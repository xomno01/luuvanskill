# ECC Game — Tu Tiên / Multiplayer / Real-time Patterns

> Domain: game-tu-tien, game-tu-tien-online

## Kiến trúc game tu tiên offline (single-player)

### State machine cho tu tiên player
```javascript
// core/playerState.js
const PlayerStates = {
  IDLE: 'idle',
  CULTIVATING: 'cultivating',   // tu luyện
  COMBAT: 'combat',             // chiến đấu
  BREAKTHROUGH: 'breakthrough', // đột phá cảnh giới
  DEAD: 'dead'
};

class PlayerStateMachine {
  constructor(player) {
    this.player = player;
    this.current = PlayerStates.IDLE;
    this.transitions = {
      idle: ['cultivating', 'combat'],
      cultivating: ['idle', 'breakthrough'],
      combat: ['idle', 'dead'],
      breakthrough: ['idle'],
      dead: []
    };
  }

  transition(newState) {
    if (!this.transitions[this.current].includes(newState)) {
      throw new Error(`Invalid transition: ${this.current} → ${newState}`);
    }
    const prev = this.current;
    this.current = newState;
    this.player.emit('stateChange', { from: prev, to: newState });
  }
}
```

### Data model cảnh giới tu tiên
```javascript
// data/realms.js — Immutable config
const REALMS = Object.freeze([
  { id: 1, name: 'Luyện Khí',    stages: 9, baseQi: 100,   qiPerStage: 50   },
  { id: 2, name: 'Trúc Cơ',      stages: 9, baseQi: 1000,  qiPerStage: 500  },
  { id: 3, name: 'Kim Đan',       stages: 9, baseQi: 10000, qiPerStage: 5000 },
  { id: 4, name: 'Nguyên Anh',    stages: 4, baseQi: 100000,qiPerStage: 50000},
  { id: 5, name: 'Hóa Thần',      stages: 4, baseQi: 1e6,   qiPerStage: 5e5  },
  // ...
]);

function getQiRequired(realmId, stage) {
  const realm = REALMS.find(r => r.id === realmId);
  if (!realm) throw new Error(`Realm ${realmId} không tồn tại`);
  return realm.baseQi + realm.qiPerStage * (stage - 1);
}
```

### Game loop (offline/idle game)
```javascript
// core/gameLoop.js
class GameLoop {
  constructor(state, tickRate = 1000) {
    this.state = state;
    this.tickRate = tickRate;
    this.lastTick = Date.now();
    this.timer = null;
  }

  start() {
    // Xử lý offline progress khi mở game lại
    this.processOfflineTime();
    this.timer = setInterval(() => this.tick(), this.tickRate);
  }

  tick() {
    const now = Date.now();
    const delta = (now - this.lastTick) / 1000; // seconds
    this.lastTick = now;

    // Tính qi tích lũy theo delta time (không phụ thuộc FPS)
    if (this.state.player.isCultivating) {
      const gained = this.state.player.qiPerSecond * delta;
      this.state.addQi(gained);
    }
  }

  processOfflineTime() {
    const saved = loadSaveData();
    if (!saved) return;
    const offlineSeconds = (Date.now() - saved.lastOnline) / 1000;
    const maxOffline = 8 * 3600; // max 8 giờ offline
    const effective = Math.min(offlineSeconds, maxOffline);
    const offlineGain = saved.qiPerSecond * effective * 0.5; // 50% efficiency offline
    this.state.addQi(offlineGain);
  }

  stop() { clearInterval(this.timer); }
}
```

### Save/Load system
```javascript
// core/saveManager.js
const SAVE_KEY = 'tuxian_save_v1';
const SAVE_VERSION = 1;

function save(state) {
  const data = {
    version: SAVE_VERSION,
    lastOnline: Date.now(),
    player: state.player.serialize(),
    inventory: state.inventory.serialize(),
  };
  localStorage.setItem(SAVE_KEY, JSON.stringify(data));
}

function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.version !== SAVE_VERSION) {
      return migrate(data); // handle version mismatch
    }
    return data;
  } catch {
    console.warn('Save data corrupted, starting fresh');
    return null;
  }
}
```

## Kiến trúc game online (multiplayer)

### Firebase Realtime DB schema
```
/players/{uid}/
  profile: { name, realm, stage, qi, lastOnline }
  stats: { totalCombats, wins, losses }

/combat/{roomId}/
  players: { uid1: { ready, hp }, uid2: { ready, hp } }
  state: 'waiting' | 'active' | 'ended'
  log: [ { turn, actor, action, damage } ]

/world/
  chat: [ { uid, name, msg, ts } ]    ← giới hạn 100 tin nhắn
  events: { currentEvent, endsAt }
```

### Realtime sync với Firebase
```javascript
// services/playerSync.js
class PlayerSync {
  constructor(db, uid) {
    this.ref = db.ref(`players/${uid}/profile`);
  }

  // Debounce save để tránh write quá nhiều
  saveDebounced = debounce((data) => {
    this.ref.update({ ...data, lastOnline: Date.now() });
  }, 2000);

  watchOpponent(opponentUid, onUpdate) {
    const ref = db.ref(`players/${opponentUid}/profile`);
    ref.on('value', snap => onUpdate(snap.val()));
    return () => ref.off(); // cleanup function
  }
}
```

### Combat system
```javascript
// services/combatService.js
function calculateDamage(attacker, defender) {
  const base = attacker.attack - defender.defense;
  const variance = 0.2; // ±20% randomness
  const multiplier = 1 + (Math.random() * 2 - 1) * variance;
  const damage = Math.max(1, Math.floor(base * multiplier));
  return damage;
}

async function processCombatTurn(roomId, actorUid, action) {
  const roomRef = db.ref(`combat/${roomId}`);
  // Dùng transaction để tránh race condition
  await roomRef.transaction(room => {
    if (!room || room.state !== 'active') return; // abort
    const result = applyAction(room, actorUid, action);
    return { ...room, ...result };
  });
}
```

### Anti-cheat cơ bản (server-side validation)
```javascript
// Cloud Function validate combat result
exports.validateCombat = functions.database
  .ref('combat/{roomId}/result')
  .onCreate(async (snap, context) => {
    const result = snap.val();
    const room = await admin.database()
      .ref(`combat/${context.params.roomId}`).once('value');
    
    // Replay combat log server-side để verify
    const expected = replayCombat(room.val().log);
    if (expected.winner !== result.winner) {
      // Cheat detected
      await snap.ref.parent.update({ result: expected, cheatDetected: true });
    }
  });
```

## Performance cho game web

- **Delta time**: Luôn nhân tính toán với `delta`, không dùng tick count
- **Object pooling**: Reuse bullet/particle objects thay vì tạo mới
- **Lazy load**: Load assets theo màn/cảnh, không load toàn bộ upfront
- **Canvas vs DOM**: Combat effects dùng Canvas, UI dùng DOM
- **requestAnimationFrame**: Luôn dùng rAF cho render loop, không dùng setInterval
