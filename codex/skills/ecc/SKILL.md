---
name: ecc
description: >-
  Everything hub — dispatcher cho toàn bộ engineering patterns, tailored cho projects
  automation, Electron, Playwright bots, Node servers, game tu tiên, Firebase backends.
  Gọi khi cần code chuẩn, review, audit, error handling, devops, hoặc "nên làm thế nào".
  Tương đương gọi 271 ECC skills qua một cổng duy nhất.
---

# ECC — Everything Code Hub

Gọi `$ecc` để tôi route đúng methodology phù hợp với task. Không cần nhớ nhiều skill riêng — một lệnh, tôi tự route.

## Cách hoạt động

**Bước 1 — Detect domain từ task:**

| Task / Keyword | Domain |
|---|---|
| Playwright, Selenium, bot login, OTP, multi-account, scraping, Hotmail, Facebook, MMO, cookie | automation |
| React, Electron renderer, Tailwind, UI, dashboard, skeleton, dark mode, a11y | frontend |
| Node.js, Express, API, Firebase, database, auth, cache, rate limit, service layer | backend |
| Build, .exe, PyInstaller, Electron Builder, CI/CD, deploy, Docker, bat script, installer | devops |
| Game, tu tiên, multiplayer, real-time, state machine, WebSocket, game loop | game |
| Test, bug, error, crash, review, audit, security, coverage, regression | quality |
| Architecture, refactor, SOLID, DRY, pattern, data model, Firebase schema, mở rộng | patterns |

**Bước 2 — Áp dụng toàn bộ methodology cho domain đó.**

**Bước 3 — Nếu task overlap 2 domain**, merge cả hai.

## Nguyên tắc cốt lõi (áp dụng mọi domain)

1. **Read before fix** — Không đoán. Đọc code thực tế, log thực tế trước khi phán đoán.
2. **Test-driven mindset** — Mỗi fix phải kèm cách verify, không chỉ "nên hoạt động rồi".
3. **Security-first** — Gặp secret hardcoded, SQL injection, XSS → STOP, fix ngay trước khi tiếp.
4. **Immutability** — Luôn tạo object mới, không mutate state trực tiếp.
5. **Fail loud** — Mọi catch block phải log hoặc re-throw, không nuốt lỗi im lặng.
6. **200–400 lines/file** — Nếu file > 400 dòng, split ngay.
7. **Answer from code, not memory** — Mọi claim về codebase phải có file path hoặc line number.

## Skill đồng hành (tự kích hoạt khi khớp ngữ cảnh)

| Tình huống | Skill |
|---|---|
| Đụng SDK/API bên thứ 3 → verify doc, đừng bịa method/param | `$source-driven` |
| Build feature mới nhiều mảnh có chỗ chưa chắc khả thi → làm mẩu rủi ro nhất trước | `$risk-first` |
| Viết/debug hệ chạy song song nhiều bước → structured log + correlation ID | `$trace-log` |
