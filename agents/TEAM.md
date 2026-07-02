# 🏢 TEAM DEV ĐA ĐẶC VỤ — Sổ tay điều phối

> 9 sub-agent chuyên gia, đặt ở user-level (`~/.claude/agents/`) → dùng được ở **mọi project**.
> Anh chỉ cần mô tả việc, Technical Lead (main) sẽ tự gọi đúng chuyên gia. Hoặc gọi đích danh: *"để **automation-engineer** lo vụ này"*.

---

## 📋 Sơ đồ team

```
                    ┌─────────────────────────┐
                    │   TECHNICAL LEAD (main)  │  ← điều phối, không tag thì tự tư vấn tổng thể
                    └────────────┬────────────┘
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
   🔬 RESEARCH            🛠️ BUILD                ✅ QUALITY
   ┌──────────┐      ┌──────────────────┐      ┌──────────────┐
   │researcher│      │ senior-dev       │      │ debugger     │
   │architect │      │ frontend-ux      │      │ qa-tester    │
   └──────────┘      │ automation-eng.  │      │ code-reviewer│
                     │ devops-builder   │      └──────────────┘
                     └──────────────────┘
```

---

## 👥 9 chuyên gia

| Agent | Vai trò | Gọi khi | Model |
|-------|---------|---------|-------|
| **researcher** | Nghiên cứu sâu đa nguồn | Điều tra công nghệ/API/site mới, so sánh giải pháp, tổng hợp trước khi quyết | inherit |
| **architect** | Kiến trúc hệ thống *(@ARCHITECT)* | Thiết kế hệ thống/tính năng mới, data model, chọn phương án, lo scale/bảo mật **trước khi code** | opus |
| **senior-dev** | Code production *(@DEV)* | Viết/sửa tính năng React/Node/Python/Electron/Firebase — **mặc định cho việc code** | inherit |
| **frontend-ux** | Giao diện *(@UXUI)* | Dựng/đánh bóng UI, Tailwind, đủ trạng thái loading/empty/error, a11y, hiệu năng | inherit |
| **automation-engineer** | Bot & automation 🌟 | Playwright/scraping/login-bot/OTP/multi-acc/Telegram/SMM — **mảng cốt lõi của anh** | inherit |
| **devops-builder** | Build & đóng gói | Electron build, PyInstaller .exe, bundle scripts, installer, .bat pipeline | inherit |
| **debugger** | Điều tra sự cố *(@DEBUG)* | Có lỗi/crash/test fail/hành vi sai → tìm **nguyên nhân gốc** | inherit |
| **qa-tester** | Đảm bảo chất lượng *(@QA)* | Viết unit test, kịch bản test khắt khe, chống regression | inherit |
| **code-reviewer** | Review code | Soi bug + **bảo mật/lộ key** + chất lượng, trước khi build/ship (chỉ đọc) | opus |

---

## 🔁 Ánh xạ @TAG (CLAUDE.md cũ) → sub-agent mới

| @TAG cũ | Sub-agent mới | Nâng cấp gì |
|---------|---------------|-------------|
| `@ARCHITECT` | **architect** | + Big O, ước lượng read/write Firebase, plugin architecture, lộ trình triển khai |
| `@DEV` | **senior-dev** | + Bối cảnh Windows/Python 3.9/Electron, fail-safe, chống re-render |
| `@UXUI` | **frontend-ux** | + Đủ 4 trạng thái UI, a11y, Core Web Vitals, hỗ trợ cả Electron renderer |
| `@DEBUG` | **debugger** | + Checklist cạm bẫy thực chiến của repo (Playwright/encoding/path) |
| `@QA` | **qa-tester** | + Edge-case mạng rớt giữa chừng, spam click, idempotency, concurrency |
| *(mới)* | **researcher** | Deep research đa nguồn |
| *(mới)* | **automation-engineer** | Chuyên Playwright/bot — đặc sản công việc của anh |
| *(mới)* | **devops-builder** | Build/đóng gói exe & installer |
| *(mới)* | **code-reviewer** | Review độc lập, đặc biệt quét lộ key/token |

> Tag cũ vẫn dùng được như "phong cách" trong chat. Sub-agent là phiên bản "có tay chân" — chạy độc lập, context riêng, tự đọc/sửa/test file.

---

## 🚀 Cách dùng

**1. Giao việc tự nhiên — Lead tự chọn người:**
> *"site freemodel đổi flow rồi, sửa bot giúp anh"* → tự gọi `automation-engineer`
> *"build lại auto-manager"* → tự gọi `devops-builder`

**2. Gọi đích danh một chuyên gia:**
> *"dùng **architect** thiết kế lại phần quản lý acc cho 500 tài khoản"*
> *"cho **code-reviewer** soi vụ này trước khi build"*

**3. Ghép nhiều chuyên gia (Lead điều phối dây chuyền):**
> *"nghiên cứu → thiết kế → code → test → review nguyên tính năng X"*
> → researcher ➝ architect ➝ senior-dev ➝ qa-tester ➝ code-reviewer

**4. Chạy song song khi việc độc lập:** Lead có thể tung nhiều agent cùng lúc (vd: vừa `frontend-ux` làm UI vừa `automation-engineer` sửa bot).

---

## 🧭 Quy ước chung của cả team
- **Báo cáo tiếng Việt**, súc tích, thẳng thắn. Xong + đã test thì nói thẳng, không vòng vo.
- **Think before code** · **Clean Architecture** · **Fail-safe** (3 nguyên tắc lõi từ CLAUDE.md).
- Tôn trọng bối cảnh Windows / Python 3.9 / Electron / Playwright đã ghi trong `SESSION_LOG.md`.
- **Không tự ý lộ/commit key thật.** code-reviewer luôn quét bước này.

*Chỉnh sửa agent: sửa file `.md` tương ứng trong thư mục này. Thêm chuyên gia mới: tạo `<tên>.md` cùng định dạng.*
