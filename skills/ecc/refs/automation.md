# ECC Automation — Playwright / Bot / Scraping Patterns

> Domain: hotmail-manager, auto-manager, dongvanfb, mmo-cookie-grabber, hotmail-login-tool, mmo-tools

## Workflow chuẩn khi viết bot

### 1. Phân tích trước khi code
```
Site target → identify: login flow, anti-bot signals, DOM selectors, OTP source
→ Plan: single account trước, multi-account sau
→ Estimate: concurrency limit an toàn (thường ≤ 10 accounts/domain)
```

### 2. Cấu trúc thư mục bot
```
src/
  core/
    browser.js       ← factory tạo browser/context có config
    auth.js          ← login flow, session check, relogin
    otp.js           ← lấy OTP từ mail.tm / inbox / SMS
  tasks/
    register.js      ← task đăng ký account
    login.js         ← task login
    action.js        ← task nghiệp vụ (post, follow, etc.)
  utils/
    proxy.js         ← proxy rotation
    delay.js         ← human-like delay helpers
    logger.js        ← structured logging
  workers/
    pool.js          ← worker pool / concurrency manager
```

### 3. Browser Context pattern (Playwright)
```javascript
// Mỗi account = 1 isolated context, KHÔNG share
async function createContext(account, proxyConfig) {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-blink-features=AutomationControlled']
  });
  const context = await browser.newContext({
    proxy: proxyConfig,
    userAgent: account.userAgent,   // rotate per account
    storageState: account.cookiePath // resume session nếu có
  });
  // Luôn save cookie sau mỗi action quan trọng
  context.on('close', async () => {
    await context.storageState({ path: account.cookiePath });
  });
  return { browser, context };
}
```

### 4. Retry với exponential backoff
```javascript
async function withRetry(fn, { maxAttempts = 3, baseDelay = 1000 } = {}) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      // Retry chỉ khi là transient error (network, timeout)
      if (err.message.includes('403') || err.message.includes('banned')) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### 5. Worker Pool — chạy N accounts song song
```javascript
async function runPool(accounts, taskFn, concurrency = 5) {
  const results = [];
  const queue = [...accounts];
  
  async function worker() {
    while (queue.length > 0) {
      const account = queue.shift();
      if (!account) break;
      try {
        const result = await taskFn(account);
        results.push({ account: account.email, status: 'ok', result });
      } catch (err) {
        results.push({ account: account.email, status: 'fail', error: err.message });
      }
      // Human-like delay giữa các account
      await randomDelay(500, 2000);
    }
  }
  
  // Spawn N workers song song
  await Promise.all(Array.from({ length: concurrency }, worker));
  return results;
}
```

### 6. OTP Flow (mail.tm pattern)
```javascript
async function waitForOTP(emailAddress, { timeout = 60000, pollInterval = 3000 } = {}) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const messages = await mailClient.getMessages(emailAddress);
    const otpMsg = messages.find(m => m.subject.includes('verification'));
    if (otpMsg) {
      const otp = otpMsg.text.match(/\b(\d{6})\b/)?.[1];
      if (otp) return otp;
    }
    await new Promise(r => setTimeout(r, pollInterval));
  }
  throw new Error(`OTP timeout after ${timeout}ms for ${emailAddress}`);
}
```

### 7. Anti-detect checklist
- [ ] Rotate User-Agent per account (không dùng default Playwright UA)
- [ ] Random delay giữa actions: `300ms–2000ms`
- [ ] Không dùng `page.fill()` cho toàn bộ text — type từng ký tự với delay
- [ ] Disable WebDriver flag: `--disable-blink-features=AutomationControlled`
- [ ] Proxy riêng mỗi account nếu budget cho phép
- [ ] Xoá `navigator.webdriver` via `page.addInitScript()`

### 8. Session reuse (tiết kiệm login)
```javascript
// Check session còn hạn trước khi login lại
async function ensureLoggedIn(page, account) {
  const isLoggedIn = await page.$('[data-testid="user-avatar"]').catch(() => null);
  if (isLoggedIn) return; // session còn sống
  await performLogin(page, account);
}
```

### 9. Error categories
| Error | Action |
|---|---|
| Timeout / network | Retry với backoff |
| Wrong password | Mark account `invalid`, skip |
| Security challenge / CAPTCHA | Mark `needs_review`, notify Telegram |
| Rate limited (429) | Pause pool 5–10 phút |
| IP banned | Rotate proxy, retry |

### 10. Kết quả → Telegram
```javascript
async function notifyTelegram(results) {
  const ok = results.filter(r => r.status === 'ok').length;
  const fail = results.filter(r => r.status === 'fail').length;
  const msg = `✅ ${ok} success | ❌ ${fail} fail\n` +
    results.filter(r => r.status === 'fail')
           .map(r => `• ${r.account}: ${r.error}`).join('\n');
  await telegramBot.sendMessage(CHAT_ID, msg);
}
```
