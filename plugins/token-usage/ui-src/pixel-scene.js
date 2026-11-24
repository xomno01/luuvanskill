// Procedural Pixel-Art Diorama Engine for Antigravity Token Usage
// Zero external images, crisp nearest-neighbor pixel rendering, adapts to Dark & Light themes.

const PALETTE = {
  '.': null,
  // Cat (warm cream + ginger ears + cute pink blush + dark outline)
  K: '#1e1b2e', // dark outline
  W: '#fff6e8', // cream fur
  S: '#f3dec2', // fur shadow
  O: '#ff9b54', // ginger patches/ears
  D: '#d97236', // ginger shadow
  P: '#ff8fab', // blush / inner ear / heart
  E: '#1b1d2a', // eyes
  H: '#38bdf8', // cyan headphones
  B: '#0284c7', // headphones shade
  // Token coin (gold)
  G: '#fbbf24',
  Y: '#fef08a',
  R: '#b45309',
  // Cache gem (emerald)
  M: '#10b981',
  L: '#6ee7b7',
  T: '#047857',
  // Mini bot (mint/white)
  C: '#e2e8f0',
  V: '#94a3b8',
  A: '#34d399',
};

// 16x16 Cute Pixel Cat wearing tiny cyan headphones (Idle / Walk frame 1)
const CAT_FRAME_1 = [
  '....KK....KK....',
  '...KOPK..KPOK...',
  '..KOOOKKKKOOOK..',
  '.HKWWWWWWWWWWKH.',
  '.HKWWWWWWWWWWKH.',
  '.BKWWKWWWWKWWKB.',
  '.BKWPWWWWWWPWKB.',
  '..KWWWWKKWWWWK..',
  '...KWWWWWWWWK...',
  '..KWWWSWWWSWWK..',
  '..KWWWWWWWWWWK.K',
  '..KWWWSWWWSWWKKO',
  '...KWWWWWWWWKKO.',
  '...KWWK..KWWK...',
  '...KKK....KKK...',
  '................',
];

// Walk frame 2 (bobbing + paws stepping + tail sway)
const CAT_FRAME_2 = [
  '................',
  '....KK....KK....',
  '...KOPK..KPOK...',
  '..KOOOKKKKOOOK..',
  '.HKWWWWWWWWWWKH.',
  '.HKWWWWWWWWWWKH.',
  '.BKWWKWWWWKWWKB.',
  '.BKWPWWWWWWPWKB.',
  '..KWWWWKKWWWWK..',
  '...KWWWWWWWWK..K',
  '..KWWWSWWWSWWKKO',
  '..KWWWWWWWWWWKO.',
  '..KWWWSWWWSWWK..',
  '....KWWKKWWK....',
  '....KKK..KKK....',
  '................',
];

// Happy / Jump / Blink frame (squinting ^_^ eyes + paws up!)
const CAT_HAPPY = [
  '....KK....KK....',
  '...KOPK..KPOK...',
  '..KOOOKKKKOOOK..',
  '.HKWWWWWWWWWWKH.',
  '.HKWKKWWWWKKWKH.',
  '.BKWWWWWWWWWWKB.',
  '.BKWPWWWWWWPWKB.',
  '..KWWWWPKWWWWK..',
  '.K.KWWWWWWWWK.K.',
  'KWKKWWSWWWSWKKWK',
  '.KKWWWWWWWWWWKK.',
  '..KWWWSWWWSWWK.K',
  '...KWWWWWWWWKKO.',
  '..KWWK....KWWK..',
  '..KKK......KKK..',
  '................',
];

// 10x10 Cute Floating Pixel Bot ("Bé Cache")
const BOT_FRAME_1 = [
  '....AA....',
  '....KK....',
  '..KKKKKK..',
  '.KCCCCCCK.',
  '.KCKAAKCK.',
  '.KCPCCPCK.',
  '.KCVVVVCK.',
  '..KKKKKK..',
  '...A..A...',
  '..........',
];

const BOT_FRAME_2 = [
  '....LL....',
  '....KK....',
  '..KKKKKK..',
  '.KCCCCCCK.',
  '.KCKLLKCK.',
  '.KCPCCPCK.',
  '.KCVVVVCK.',
  '..KKKKKK..',
  '..A....A..',
  '..........',
];

// 8x8 Spinning Pixel Coin (2 frames)
const COIN_1 = [
  '..KKKK..',
  '.KGGYGK.',
  'KGYGGGRK',
  'KGYGGGRK',
  'KGGGGGRK',
  'KGRGGGRK',
  '.KRRRRK.',
  '..KKKK..',
];

const COIN_2 = [
  '...KK...',
  '..KGYK..',
  '..KGYK..',
  '..KGGK..',
  '..KGRK..',
  '..KGRK..',
  '..KRRK..',
  '...KK...',
];

// 8x8 Emerald Cache Gem
const GEM_SPRITE = [
  '...KK...',
  '..KLLK..',
  '.KLMMMK.',
  'KLMMMMTK',
  'KMMMMTTK',
  '.KMMTTK.',
  '..KTTK..',
  '...KK...',
];

// 7x6 Pixel Heart
const HEART_SPRITE = [
  '.PP.PP.',
  'PPPPPPP',
  'PPPPPPP',
  '.PPPPP.',
  '..PPP..',
  '...P...',
];

function drawSprite(ctx, sprite, x, y, scale, flipX = false) {
  const rows = sprite.length;
  const cols = sprite[0].length;
  for (let r = 0; r < rows; r++) {
    const row = sprite[r];
    for (let c = 0; c < cols; c++) {
      const ch = row[c];
      const color = PALETTE[ch];
      if (!color) continue;
      ctx.fillStyle = color;
      const dx = flipX ? x + (cols - 1 - c) * scale : x + c * scale;
      ctx.fillRect(Math.round(dx), Math.round(y + r * scale), scale, scale);
    }
  }
}

export function createPixelScene(canvas, speechEl) {
  if (!canvas) return { setStats() {}, celebrate() {} };
  const ctx = canvas.getContext('2d');
  const reducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const LOGICAL_H = 104;
  let logicalW = 640;

  // World entities
  const cat = {
    x: 90,
    y: 52,
    targetX: 220,
    vx: 0,
    vy: 0,
    facingLeft: false,
    jumping: false,
    happyTimer: 0,
    walkTick: 0,
    idleTimer: 90,
  };

  const bot = {
    x: 44,
    y: 34,
    phase: 0,
  };

  /** @type {Array<{x:number,y:number,vx:number,vy:number,kind:'coin'|'gem'|'heart',life:number,maxLife:number,phase:number}>} */
  const particles = [];

  /** @type {Array<{x:number,y:number,size:number,speed:number,phase:number}>} */
  const skyItems = Array.from({ length: 24 }, (_, i) => ({
    x: (i * 53 + 17) % 900,
    y: 8 + ((i * 29) % 44),
    size: i % 3 === 0 ? 3 : 2,
    speed: 0.12 + (i % 4) * 0.06,
    phase: i * 0.9,
  }));

  /** @type {Array<{x:number,y:number,vy:number,kind:'coin'|'gem',phase:number}>} */
  const pickups = Array.from({ length: 5 }, (_, i) => ({
    x: 130 + i * 110,
    y: 16 + (i % 3) * 14,
    vy: 0.18 + (i % 2) * 0.08,
    kind: i % 2 === 0 ? 'coin' : 'gem',
    phase: i * 1.3,
  }));

  let statsLines = [
    'Meo meo! Bấm vào mình để nhận mưa xu token nhé!',
    'Đang canh từng token cho anh nè…',
  ];
  let speechIdx = 0;
  let speechTimer = 0;

  function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 60) {
      logicalW = Math.round(rect.width);
      canvas.width = logicalW;
      canvas.height = LOGICAL_H;
      ctx.imageSmoothingEnabled = false;
    }
  }

  function spawnBurst(x, y, count = 8, includeHearts = true) {
    for (let i = 0; i < count; i++) {
      const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7;
      const spd = 1.4 + Math.random() * 2.2;
      const kinds = includeHearts ? ['heart', 'coin', 'gem', 'coin'] : ['coin', 'gem'];
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd - 0.6,
        kind: kinds[i % kinds.length],
        life: 0,
        maxLife: 45 + Math.floor(Math.random() * 25),
        phase: Math.random() * 6,
      });
    }
  }

  function setSpeech(text) {
    if (speechEl && text) {
      speechEl.textContent = text;
    }
  }

  function celebrate(msg) {
    cat.vy = -4.2;
    cat.jumping = true;
    cat.happyTimer = 70;
    spawnBurst(cat.x + 24, cat.y + 10, 12, true);
    if (msg) {
      setSpeech(msg);
      speechTimer = 0;
    }
  }

  canvas.addEventListener('click', (ev) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = ((ev.clientX - rect.left) / rect.width) * logicalW;
    const clickY = ((ev.clientY - rect.top) / rect.height) * LOGICAL_H;

    // Move cat toward click and celebrate!
    cat.targetX = Math.max(24, Math.min(logicalW - 72, clickX - 24));
    cat.idleTimer = 180;
    cat.vy = -3.8;
    cat.jumping = true;
    cat.happyTimer = 65;
    spawnBurst(clickX, Math.min(clickY, 64), 9, true);

    speechIdx = (speechIdx + 1) % statsLines.length;
    setSpeech(statsLines[speechIdx]);
    speechTimer = 0;
  });

  function update(t) {
    // Rotate speech periodically
    speechTimer++;
    if (speechTimer > 360) {
      speechTimer = 0;
      speechIdx = (speechIdx + 1) % statsLines.length;
      setSpeech(statsLines[speechIdx]);
    }

    // Cat AI stroll
    const dx = cat.targetX - cat.x;
    if (Math.abs(dx) > 4) {
      const speed = 1.15;
      cat.vx = Math.sign(dx) * speed;
      cat.x += cat.vx;
      cat.facingLeft = cat.vx < 0;
      cat.walkTick++;
    } else {
      cat.vx = 0;
      cat.idleTimer--;
      if (cat.idleTimer <= 0) {
        cat.targetX = 32 + Math.random() * Math.max(80, logicalW - 110);
        cat.idleTimer = 140 + Math.floor(Math.random() * 140);
      }
    }

    // Cat jump physics
    if (cat.jumping || cat.y < 52) {
      cat.y += cat.vy;
      cat.vy += 0.28;
      if (cat.y >= 52) {
        cat.y = 52;
        cat.vy = 0;
        cat.jumping = false;
      }
    }
    if (cat.happyTimer > 0) cat.happyTimer--;

    // Floating bot follows gently behind the cat
    bot.phase += 0.06;
    const desiredBotX = cat.facingLeft ? cat.x + 56 : cat.x - 36;
    bot.x += (Math.max(12, Math.min(logicalW - 36, desiredBotX)) - bot.x) * 0.04;
    bot.y = 32 + Math.sin(bot.phase) * 5;

    // Gentle floating token pickups
    for (const p of pickups) {
      p.phase += 0.05;
      p.y += p.vy;
      if (p.y > 74) {
        p.y = -12;
        p.x = 30 + Math.random() * Math.max(120, logicalW - 60);
      }
      // If cat touches a pickup -> happy collect burst!
      if (Math.abs(p.x - (cat.x + 22)) < 22 && Math.abs(p.y - (cat.y + 20)) < 22) {
        cat.happyTimer = 35;
        spawnBurst(p.x, p.y, 4, false);
        p.y = -14;
        p.x = 30 + Math.random() * Math.max(120, logicalW - 60);
      }
    }

    // Burst particles
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += 0.09;
      pt.life++;
      if (pt.life >= pt.maxLife) {
        particles.splice(i, 1);
      }
    }

    // Sky items drift
    for (const s of skyItems) {
      s.x -= s.speed;
      if (s.x < -24) s.x = logicalW + 16;
    }
  }

const SKY_DARK = {
  top: '#121722',
  mid: '#171e2c',
  moon: '#fef08a',
  starOn: '#fef08a',
  starOff: '#475569',
  hill: '#1c2536',
  grassTop: '#059669',
  grassBlade: '#047857',
  floor: '#1f242e',
  brick: '#2a303d',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

const SKY_LIGHT = {
  top: '#e0f2fe',
  mid: '#f0f9ff',
  sunOuter: '#fde047',
  sunInner: '#fef9c3',
  cloud: '#ffffff',
  hill: '#bae6fd',
  grassTop: '#34d399',
  grassBlade: '#10b981',
  floor: '#d6d3d1',
  brick: '#a8a29e',
  shadow: 'rgba(15, 23, 42, 0.14)',
};

  function draw(t) {
    const light = isLightTheme();
    const sky = light ? SKY_LIGHT : SKY_DARK;

    // Sky backdrop (2-band pixel sky)
    ctx.fillStyle = sky.top;
    ctx.fillRect(0, 0, logicalW, LOGICAL_H);
    ctx.fillStyle = sky.mid;
    ctx.fillRect(0, 46, logicalW, 40);

    // Sun or Pixel Moon
    if (light) {
      ctx.fillStyle = sky.sunOuter;
      ctx.fillRect(logicalW - 56, 12, 18, 18);
      ctx.fillStyle = sky.sunInner;
      ctx.fillRect(logicalW - 53, 15, 12, 12);
    } else {
      ctx.fillStyle = sky.moon;
      ctx.fillRect(logicalW - 52, 12, 14, 14);
      ctx.fillStyle = sky.top;
      ctx.fillRect(logicalW - 46, 12, 8, 10);
    }

    // Pixel Stars (dark) or Fluffy Pixel Clouds (light)
    for (const s of skyItems) {
      const x = Math.round(s.x % (logicalW + 40)) - 20;
      if (light) {
        if (s.size === 3) {
          ctx.fillStyle = sky.cloud;
          ctx.fillRect(x, s.y, 22, 6);
          ctx.fillRect(x + 4, s.y - 4, 14, 4);
        }
      } else {
        const twinkle = Math.sin(t * 0.004 + s.phase) > 0.1;
        ctx.fillStyle = twinkle ? sky.starOn : sky.starOff;
        ctx.fillRect(x, s.y, s.size, s.size);
      }
    }

    // Distant pixel hills / skyline
    ctx.fillStyle = sky.hill;
    for (let x = 0; x < logicalW; x += 48) {
      const h = 14 + ((x * 7) % 16);
      ctx.fillRect(x, 86 - h, 40, h);
    }

    // Pixel Grass & Ground Floor
    ctx.fillStyle = sky.grassTop;
    ctx.fillRect(0, 86, logicalW, 5);
    ctx.fillStyle = sky.grassBlade;
    for (let x = 0; x < logicalW; x += 12) {
      ctx.fillRect(x, 84, 4, 2);
    }
    ctx.fillStyle = sky.floor;
    ctx.fillRect(0, 91, logicalW, LOGICAL_H - 91);
    ctx.fillStyle = sky.brick;
    for (let x = 4; x < logicalW; x += 20) {
      ctx.fillRect(x, 95, 8, 3);
    }

    // Floating token coins & cache gems
    const spinFrame = Math.floor(t / 240) % 2 === 0;
    for (const p of pickups) {
      const sp = p.kind === 'gem' ? GEM_SPRITE : spinFrame ? COIN_1 : COIN_2;
      drawSprite(ctx, sp, p.x, p.y + Math.sin(p.phase) * 2, 2, false);
    }

    // Cute Floating Bot
    const botSprite = Math.floor(t / 320) % 2 === 0 ? BOT_FRAME_1 : BOT_FRAME_2;
    drawSprite(ctx, botSprite, bot.x, bot.y, 2, false);

    // Shadow under cat
    ctx.fillStyle = sky.shadow;
    const shadowW = cat.jumping ? 22 : 30;
    ctx.fillRect(Math.round(cat.x + 24 - shadowW / 2), 85, shadowW, 3);

    // Cute Pixel Cat
    let catSprite = CAT_FRAME_1;
    if (cat.happyTimer > 0 || cat.jumping) {
      catSprite = CAT_HAPPY;
    } else if (Math.abs(cat.vx) > 0.1) {
      catSprite = Math.floor(cat.walkTick / 10) % 2 === 0 ? CAT_FRAME_1 : CAT_FRAME_2;
    } else if (Math.floor(t / 1800) % 4 === 0 && t % 1800 < 160) {
      catSprite = CAT_HAPPY; // cute occasional blink/smile
    }
    drawSprite(ctx, catSprite, cat.x, cat.y, 2, cat.facingLeft);

    // Burst particles (hearts, coins, gems)
    for (const pt of particles) {
      const alpha = Math.max(0, 1 - pt.life / pt.maxLife);
      ctx.globalAlpha = alpha;
      const sp = pt.kind === 'heart' ? HEART_SPRITE : pt.kind === 'gem' ? GEM_SPRITE : COIN_1;
      drawSprite(ctx, sp, pt.x, pt.y, 2, false);
    }
    ctx.globalAlpha = 1;
  }

  resize();
  window.addEventListener('resize', resize);

  if (reducedMotion) {
    draw(0);
  } else {
    const loop = (t) => {
      update(t);
      draw(t);
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    setStats(summary) {
      if (!summary || !summary.totals) return;
      const fmt = (n) => {
        if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
        if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
        return String(n);
      };
      statsLines = [
        `Hôm nay: ${fmt(summary.todaySummary.total)} token (${summary.todaySummary.turns} lượt) — chạm vào Bé Mèo để thả xu nhé!`,
        `Cache Hit ${summary.totals.cacheHitRate}% — đã tiết kiệm ${fmt(summary.totals.cacheRead)} token từ cache!`,
        `Tháng ${summary.thisMonthSummary.month}: ${fmt(summary.thisMonthSummary.total)} token qua ${summary.thisMonthSummary.conversations} hội thoại!`,
        `Tổng cộng All-Time: ${fmt(summary.totals.total)} token across ${summary.totals.activeDays} ngày hoạt động!`,
      ];
      setSpeech(statsLines[0]);
    },
    celebrate,
  };
}
