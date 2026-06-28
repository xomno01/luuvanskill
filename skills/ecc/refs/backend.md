# ECC Backend — Node.js / Firebase / API Patterns

> Domain: am-proxy, update-server, freemodel-tool, telegram-claude, các server-side scripts

## Kiến trúc layers chuẩn

```
src/
  routes/          ← HTTP routing only, không có business logic
  controllers/     ← parse request, validate, gọi service, format response
  services/        ← business logic thuần, không biết Express/HTTP
  repositories/    ← data access (Firebase/Firestore/SQLite)
  middleware/      ← auth, rate-limit, error handler
  utils/           ← helpers: logger, crypto, validation
```

## Repository pattern (Firebase)
```javascript
// repositories/accountRepo.js
class AccountRepository {
  constructor(db) { this.collection = db.collection('accounts'); }

  async findAll(filters = {}) {
    let query = this.collection;
    if (filters.status) query = query.where('status', '==', filters.status);
    const snap = await query.get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  async findById(id) {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() };
  }

  async save(id, data) {
    // Immutable update — không merge unknown fields
    await this.collection.doc(id).set({
      ...data,
      updatedAt: Date.now()
    }, { merge: true });
  }
}
```

## Service layer
```javascript
// services/accountService.js
class AccountService {
  constructor(accountRepo, notifier) {
    this.repo = accountRepo;
    this.notifier = notifier;
  }

  async processAccount(id) {
    const account = await this.repo.findById(id);
    if (!account) throw new NotFoundError(`Account ${id} not found`);
    if (account.status === 'banned') throw new ValidationError('Account bị ban');
    
    // Business logic ở đây
    const result = await this.runTask(account);
    await this.repo.save(id, { status: 'done', result });
    await this.notifier.notify(account.email, result);
    return result;
  }
}
```

## Express controller pattern
```javascript
// controllers/accountController.js
async function processAccount(req, res, next) {
  try {
    const { id } = req.params;
    // Validate input tại boundary
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: { code: 'INVALID_ID', message: 'ID không hợp lệ' }});
    }
    const result = await accountService.processAccount(id);
    res.json({ ok: true, data: result });
  } catch (err) {
    next(err); // Pass xuống centralized error handler
  }
}
```

## Centralized error handler
```javascript
// middleware/errorHandler.js
function errorHandler(err, req, res, next) {
  // Log full context server-side
  logger.error({ err, path: req.path, method: req.method });

  if (err instanceof NotFoundError) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: err.message }});
  }
  if (err instanceof ValidationError) {
    return res.status(422).json({ error: { code: 'VALIDATION', message: err.message }});
  }
  // Unknown error — không leak stack trace ra ngoài
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Có lỗi xảy ra' }});
}
```

## Rate limiting (production-safe)
```javascript
const rateLimit = require('express-rate-limit');
// KHÔNG dùng in-memory limiter cho multi-instance
// Dùng Redis hoặc per-IP limit đơn giản cho single-instance server
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: 'RATE_LIMITED', message: 'Quá nhiều request, thử lại sau' }}
});
app.use('/api/', limiter);
```

## Firebase Firestore — tránh read/write thừa
```javascript
// KHÔNG: đọc toàn bộ collection rồi filter JS
const all = await db.collection('accounts').get(); // 10000 reads
const active = all.docs.filter(d => d.data().status === 'active');

// ĐÚNG: filter tại Firestore
const active = await db.collection('accounts')
  .where('status', '==', 'active')
  .limit(100)
  .get();

// Batch write cho bulk ops — thay vì loop await
const batch = db.batch();
accounts.forEach(acc => {
  batch.update(db.collection('accounts').doc(acc.id), { synced: true });
});
await batch.commit(); // 1 network round-trip
```

## Cache-aside pattern
```javascript
const cache = new Map();

async function getAccountCached(id) {
  const TTL = 5 * 60 * 1000; // 5 phút
  const cached = cache.get(id);
  if (cached && Date.now() - cached.ts < TTL) return cached.data;
  
  const data = await accountRepo.findById(id);
  cache.set(id, { data, ts: Date.now() });
  return data;
}
```

## Retry với backoff (cho external API calls)
```javascript
async function callWithRetry(fn, maxAttempts = 3) {
  for (let i = 1; i <= maxAttempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxAttempts) throw err;
      // Chỉ retry transient errors
      if (err.status >= 400 && err.status < 500) throw err;
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i - 1)));
    }
  }
}
```

## Structured logging
```javascript
const logger = {
  info: (msg, meta = {}) => console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: Date.now() })),
  error: (msg, meta = {}) => console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: Date.now() })),
};
// Dùng: logger.info('Account processed', { accountId: id, duration: ms })
```

## Environment config
```javascript
// config.js — validate khi startup, fail fast nếu thiếu
const required = ['FIREBASE_PROJECT_ID', 'TELEGRAM_BOT_TOKEN'];
required.forEach(key => {
  if (!process.env[key]) throw new Error(`Missing required env: ${key}`);
});
module.exports = {
  firebase: { projectId: process.env.FIREBASE_PROJECT_ID },
  telegram: { token: process.env.TELEGRAM_BOT_TOKEN },
  port: parseInt(process.env.PORT) || 3000,
};
```
