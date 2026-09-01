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

---

# SYNC ECC v2.2.1 (2026-08-31)

## 11. Agent Loop Design & Review (từ skill `loop-design-check`)

> Dùng khi: bọc vòng lặp tự động quanh agent (bot tự relogin, worker chạy tới khi xong, cron fix lỗi đêm). Vấn đề: loop không có "steer về mục tiêu" — viết sai là nó quay vô định đốt token, hoặc gian lận verifier để "thắng".

### Gate 4 điều kiện — thiếu 1 là ĐỪNG bọc loop
1. Task lặp lại theo tuần hoặc dày hơn
2. Verify được tự động hóa (có test/script trả yes/no)
3. Token/compute budget chịu nổi
4. Agent có tool thực sự *chạy và xem được kết quả*

> Repo không xứng đáng có loop (không có baseline đối soát + test) thì loop chỉ KHẾCH ĐỘI lỗi lên.

### Goal phải machine-decidable + có boundary
```javascript
// SAI: goal mơ hồ → comparator không judge được, hoặc đoán bừa
// "làm cho pool chạy ổn định", "login cho đẹp"

// ĐÚNG: yes/no được + boundary ("KHÔNG được làm gì")
// "pool chạy xong 50 accounts VÀ không account nào bị skip âm thầm
//  VÀ không sửa file test  VÀ xuất change-list"
```
- **Reconciliation > assertion**: neo kết quả vào sự thật bên ngoài (con số backoffice, golden sample, đối soát DB) thay vì "tests pass" — tests pass có thể bị qua mặt (loại assert, mock giả, nuốt exception); "diff vs số gốc < 0.01" thì không.
- **Boundary đi kèm done-criterion** — thiếu boundary = cấp giấy phép gian lận (Goodhart).

### 3 vai plan/build/judge — judge phải ĐỘC LẬP
| Vai | Làm | Quy tắc sắt |
|---|---|---|
| Plan | chẻ goal thành spec + điều kiện nghiệm thu **script judge được** | — |
| Build | code theo spec | KHÔNG được sửa điều kiện nghiệm thu |
| Judge | chạy nghiệm thu độc lập (CI/diff), fail → trả lý do về Build | không phải chính agent Build tự chấm |

3 rules đặt cược vào Judge: ① judge ≠ build (tự chấm bài luôn phình điểm) ② tiêu chí deterministic (pytest, diff đối soát) — không "nhìn có vẻ ổn" ③ Build cấm sửa acceptance. Fail 3 lần liên tiếp → đá lên người.

### Damping + 5 kiểu loop chạy sàn (review checklist)
Damping bắt buộc: retry cap N + hard stop + **người flip công tắc cuối**. Negative feedback không damping = dao động (loop Ralph: quay tròn đốt token).

| # | Loop sàn kiểu nào | Câu hỏi soi | Kháng thể |
|---|---|---|---|
| 1 | Goal là câu đúng-mà-vô-dụng → quay vô định đốt tiền | Exit condition Judge yes/no được không, hay là "quản lý cho tốt"? | Đổi thành điều kiện decidable |
| 2 | "Verify" = "nhìn có ổn không" → agent tự tin nói ổn rồi dừng | Judge có phải chính bị cáo? Verify có dựa trên rule deterministic? | Đối soát + exit code + judge độc lập |
| 3 | (tệ nhất) chỉ gate "tests pass" → agent **xoá test** để thắng | Có boundary "KHÔNG được làm gì" chưa, hay chỉ có done-criterion? | Done + boundary cùng lúc |
| 4 | Trông chờ agent hỏi giữa chừng → nó KHÔNG hỏi, chạy sai tới cùng | Có điểm nào "chỉ rõ được lúc chạy" không? | Hồi clarity trước khi chạy, không để dư |
| 5 | CLAUDE.md phình + memory ôi thiu → loop càng nhanh càng sai | Docs/memory nó dựa vào có tươi không, ai giữ? | Memory phân tầng + lint định kỳ |

**3 red line — phạm 1 là cấm fully-automatic:**
- Nhận định cuối cùng thuộc người: cell "done" do người flip, loop chỉ là thợ, không là thẩm định.
- Trách nhiệm không chuyển giao: việc fail không chịu được (đăng nhầm nội dung, chi tiền, merge nhầm) → không giao quyền tự động.
- Loop càng "tự cải thiện/tự sửa rule của chính nó" càng phải review ngặt hơn — chặn TRƯỚC action (hard gate), không vá sau.

> Áp vào project của anh: loop relogin Hotmail — goal decidable = "context có cookie hợp lệ + load trang dashboard không bị văng về /login", boundary = "không touch email data của account", judge = script check cookie riêng, không phải chính worker vừa login tự báo thành công.

## 12. Mailtrap — gửi email transactional có sandbox (từ skill `mailtrap-email-integration`)

> Dùng khi: thêm tính năng "gửi email" (xác nhận signup, reset password, notification) hoặc debug vì sao mail dev/staging không tới.

- **Sandbox ≠ Production**: dev/staging bắn vào Sandbox API (capture mọi mail, không deliver tới inbox thật). Bật production phải dùng endpoint domain đã verify. **Cấm đá dev vào production endpoint.**
- **Auth**: Bearer token trong header, token scope theo project — sandbox và production là 2 token khác nhau.
- **Domain verification**: production cần verify domain qua DNS (SPF, DKIM, DMARC) TRƯỚC, không thì mail rơi im lặng hoặc vào spam — lỗi kiểu "không có error nhưng người nhận không thấy".

```javascript
// Production send (đã verify domain)
const res = await fetch("https://send.api.mailtrap.io/api/send", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${process.env.MAILTRAP_API_TOKEN}`, // token production riêng
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: { email: "no-reply@yourverifieddomain.com", name: "Your App" },
    to: [{ email: to }],
    subject,
    html,
  }),
});
if (!res.ok) throw new Error(`Mailtrap ${res.status}: ${await res.text()}`);
```
