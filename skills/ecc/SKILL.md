---
name: ecc
description: >-
  Everything Claude Code hub — dispatcher cho toàn bộ engineering patterns từ
  ECC framework, tailored cho projects của anh: Electron apps, Hotmail/MMO automation,
  Playwright bots, Node servers, game tu tiên, Firebase backends. Gọi khi cần
  code chuẩn, review, audit, error handling, devops, hoặc hỏi "nên làm thế nào".
  Tương đương gọi 286 ECC skills (sync upstream v2.2.1, 2026-08-31) qua một cổng duy nhất.
---

# ECC — Everything Claude Code Hub

Anh gọi `/ecc` để tôi đọc đúng domain-file và áp dụng methodology phù hợp với task. Không cần nhớ 286 skill riêng — một lệnh, tôi tự route.

## Cách hoạt động

**Bước 1 — Detect domain từ task của anh:**

| Task / Keyword | File cần đọc |
|---|---|
| Playwright, Selenium, bot login, OTP, multi-account, scraping, Hotmail, Facebook, MMO, cookie | [`refs/automation.md`](refs/automation.md) |
| React, Electron renderer, Tailwind, UI, dashboard, skeleton, dark mode, a11y | [`refs/frontend.md`](refs/frontend.md) |
| Node.js, Express, API, Firebase, database, auth, cache, rate limit, service layer | [`refs/backend.md`](refs/backend.md) |
| Build, .exe, PyInstaller, Electron Builder, CI/CD, deploy, Docker, bat script, installer | [`refs/devops.md`](refs/devops.md) |
| Game, tu tiên, multiplayer, real-time, state machine, WebSocket, game loop | [`refs/game.md`](refs/game.md) |
| Test, bug, error, crash, review, audit, security, coverage, regression | [`refs/quality.md`](refs/quality.md) |
| Architecture, refactor, SOLID, DRY, pattern, data model, Firebase schema, mở rộng | [`refs/patterns.md`](refs/patterns.md) |

**Bước 2 — Đọc file tương ứng, áp dụng toàn bộ methodology trong đó.**

**Bước 3 — Nếu task overlap 2 domain**, đọc cả 2 file rồi merge.

## Nguyên tắc cốt lõi từ ECC (áp dụng mọi domain)

1. **Read before fix** — Không đoán. Đọc code thực tế, log thực tế trước khi phán đoán.
2. **Agent-first** — Task phức tạp > 3 bước → spawn subagent, đừng làm inline.
3. **Test-driven mindset** — Mỗi fix phải kèm cách verify, không chỉ "nên hoạt động rồi".
4. **Security-first** — Gặp secret hardcoded, SQL injection, XSS → STOP, fix ngay trước khi tiếp.
5. **Immutability** — Luôn tạo object mới, không mutate state trực tiếp.
6. **Fail loud** — Mọi catch block phải log hoặc re-throw, không nuốt lỗi im lặng.
7. **200–400 lines/file** — Nếu file > 400 dòng, split ngay.
8. **Answer from code, not memory** — Mọi claim về codebase phải có file path hoặc line number.

## Skill đồng hành (tự kích hoạt, không cần gọi tay)

Ngoài ECC, 3 skill chuyên biệt dưới đây TỰ chạy khi khớp ngữ cảnh. Khi route task, ưu tiên chúng cho đúng việc:

| Tình huống | Skill bắn tự động |
|---|---|
| Đụng SDK/API bên thứ 3 (Firebase v8/v9, Playwright, Telegram, mail.tm, SMM, Electron Builder, OpenAI/Anthropic) → verify doc, đừng bịa method/param | `source-driven` |
| Build feature mới nhiều mảnh có chỗ chưa chắc khả thi (AM Proxy bridge, relogin Hotmail, anti-bot, worker pool, gameplay tu tiên) → làm mẩu rủi ro nhất trước | `risk-first` |
| Viết/debug hệ chạy song song nhiều bước (AM Proxy forward, bot worker pool nhiều account, luồng OTP) → structured log + correlation ID | `trace-log` |
| Rà soát bảo mật toàn diện, auth/session, secrets, query DB, pentest trước khi release | `security-review` |
| Làm game bài bản chuẩn studio (Godot, Unity, Unreal, Canvas 2D): 7-phase pipeline, GDD, game feel | `game-studio` |
| Dựng đồ họa & chuyển động web game Canvas 2D 60 FPS bằng code thuần (Procedural pixel art, chibi) | `canvas-game-art` |
| Clone/reproduce website: bóc tách tài nguyên web & CDN, audio pack binary, đối soát SHA-256 | `web-clone` |

> Tất cả nằm trong bộ `luuvanskill` (github private xomno01/luuvanskill) cùng với chính `ecc`. Xem thêm 11 NGUYÊN TẮC LÀM VIỆC trong `CLAUDE.md`.
