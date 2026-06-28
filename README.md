# luuvanskill — Bộ skill Claude Code cá nhân

Backup + đồng bộ nhiều máy cho toàn bộ skill tự dùng của **xomno01**.
Repo này vừa là **kho lưu trữ** vừa là **Claude Code marketplace + plugin** cài lại được.

## Có gì bên trong

| Skill | Loại | Tác dụng |
|---|---|---|
| **ecc** | Tự tạo | Hub điều phối 271 engineering patterns, route theo domain (automation/frontend/backend/devops/game/quality/patterns) cho project của anh |
| **source-driven** | Tự tạo | Chống AI bịa API/SDK bên thứ 3 — verify từ doc chính thức trước khi code (Firebase v8/v9, Playwright, Telegram, mail.tm, SMM, Electron Builder, OpenAI/Anthropic) |
| **risk-first** | Tự tạo | Build feature mới theo lối làm mẩu rủi ro nhất trước + vertical slice + save point |
| **trace-log** | Tự tạo | Structured JSON log + correlation ID cho hệ chạy song song (AM Proxy, bot worker pool) |
| **baoyu-design** | Tải về | Tạo UI mockup/prototype/slide deck HTML |
| **cinematic-3d-web** | Tải về | Three.js/WebGL site cinematic kiểu awwwards |
| **deep-research** | Tải về | Deep research đa nguồn có verify + cite |

Kèm `reference/working-discipline.md` — 11 nguyên tắc làm việc để dán vào `CLAUDE.md` trên máy mới.

## Cài trên máy mới (2 lệnh trong Claude Code)

```
/plugin marketplace add xomno01/luuvanskill
/plugin install luuvanskill
```

Sau đó `/reload-plugins`. Skill sẽ xuất hiện dưới namespace `/luuvanskill:<tên>` (vd `/luuvanskill:ecc`, `/luuvanskill:source-driven`).

> **Lưu ý namespace:** khi cài qua plugin, tên skill bị thêm tiền tố `luuvanskill:`. Phần **auto-invoke vẫn chạy y hệt** (Claude tự gọi theo `description`), chỉ khác khi gõ tay. Nếu muốn tên ngắn (`/ecc`), copy thẳng thư mục `skills/<tên>` vào `~/.claude/skills/` thay vì cài plugin.

## Cập nhật

Sửa skill ở máy chính → commit → push. Máy khác chạy:
```
/plugin marketplace update
/plugin update luuvanskill
```

## Đồng bộ thủ công (không qua plugin, giữ tên ngắn)

```bash
# máy mới
git clone https://github.com/xomno01/luuvanskill.git
cp -r luuvanskill/skills/* ~/.claude/skills/
```

## Cấu trúc repo

```
luuvanskill/
├── .claude-plugin/
│   ├── plugin.json        # manifest plugin
│   └── marketplace.json   # catalog marketplace (source ./)
├── skills/                # 7 skill, mỗi cái 1 thư mục có SKILL.md
├── reference/
│   └── working-discipline.md
└── README.md
```

Private repo — chỉ để backup cá nhân, không phát hành công khai.
