<div align="center">

<img src="assets/hero.svg" alt="luuvanskill — kho skill Claude Code cá nhân" />

<br/>

![Claude Code](https://img.shields.io/badge/Claude_Code-plugin_%2B_marketplace-7C5CFF?style=for-the-badge&logo=anthropic&logoColor=white)
![Skills](https://img.shields.io/badge/skills-8-21E6FF?style=for-the-badge)
![Private](https://img.shields.io/badge/repo-private-FF4D8D?style=for-the-badge)
![Author](https://img.shields.io/badge/by-xomno01-FFAE3D?style=for-the-badge)

**Bộ skill engineering cá nhân — backup &amp; đồng bộ nhiều máy.**
Một repo vừa là **kho lưu trữ**, vừa là **Claude Code marketplace + plugin** cài lại được trong 2 lệnh.

<img src="assets/divider.svg" alt="" />

</div>

## ⚡ Có gì bên trong

> 🛠️ **Skill tự tạo** — chế riêng cho phong cách dev của mình: automation, Electron, proxy, game tu tiên, Firebase.

| | Skill | Tác dụng |
|:--:|:--|:--|
| 🧭 | **ecc** | Hub điều phối 271 engineering pattern, tự route theo domain (automation / frontend / backend / devops / game / quality / patterns) |
| 📚 | **source-driven** | Chống AI bịa API/SDK bên thứ 3 — verify từ doc chính thức trước khi code (Firebase v8/v9, Playwright, Telegram, mail.tm, SMM, Electron Builder, OpenAI/Anthropic) |
| 🎯 | **risk-first** | Build feature mới: làm mẩu **rủi ro nhất trước** + vertical slice + save point |
| 🔎 | **trace-log** | Structured JSON log + correlation ID cho hệ chạy song song (AM Proxy, bot worker pool) |
| 🌐 | **IMOL2o** | Dựng website **đỉnh cao &amp; đẹp chuẩn 2026** — thẩm mỹ (bento/aurora/OKLCH), stack frontend (Astro/Next/SvelteKit), cinematic 3D/WebGPU, motion, AI workflow (checklist + 5 references) |

> 🎨 **Skill tải về** — đồ hay của cộng đồng, gom chung cho tiện sync.

| | Skill | Tác dụng |
|:--:|:--|:--|
| 🖼️ | **baoyu-design** | Tạo UI mockup / prototype / slide deck HTML |
| 🌌 | **cinematic-3d-web** | Three.js / WebGL site cinematic kiểu *awwwards* |
| 🔬 | **deep-research** | Deep research đa nguồn, có verify + cite |

📌 Kèm [`reference/working-discipline.md`](reference/working-discipline.md) — **11 nguyên tắc làm việc** để dán vào `CLAUDE.md` trên máy mới.

<img src="assets/divider.svg" alt="" />

## 📥 Cài trên máy mới

**Cách 1 — Plugin (chuẩn Claude Code, gọn nhất):**

```bash
/plugin marketplace add xomno01/luuvanskill
/plugin install luuvanskill
/reload-plugins
```

Skill xuất hiện dưới namespace `/luuvanskill:<tên>` — ví dụ `/luuvanskill:ecc`, `/luuvanskill:source-driven`.

> 💡 **Auto-invoke vẫn chạy y hệt:** Claude tự gọi skill theo `description`, không cần gõ tay. Namespace chỉ ảnh hưởng khi gọi thủ công.

**Cách 2 — Copy thủ công (giữ tên ngắn `/ecc`):**

```bash
git clone https://github.com/xomno01/luuvanskill.git
cp -r luuvanskill/skills/* ~/.claude/skills/
```

<img src="assets/divider.svg" alt="" />

## 🔄 Đồng bộ &amp; cập nhật

```bash
# Máy chính: sửa skill rồi đẩy lên
git commit -am "update skill" && git push

# Máy khác: kéo bản mới
/plugin marketplace update
/plugin update luuvanskill
```

## 🧭 11 nguyên tắc làm việc

Lọc từ bộ [`addyosmani/agent-skills`](https://github.com/addyosmani/agent-skills) cho **dev solo** — bỏ nghi thức team enterprise.
Nêu giả định trước khi code · scope discipline · risk-first · verify API bên thứ 3 · prove-it bug · validate input · save point · refactor an toàn · secrets vào `.env` · structured log · ADR-lite.

→ Chi tiết: [`reference/working-discipline.md`](reference/working-discipline.md)

## 🗂️ Cấu trúc repo

```text
luuvanskill/
├── .claude-plugin/
│   ├── plugin.json        # manifest plugin
│   └── marketplace.json   # catalog marketplace (source ./)
├── skills/                # 8 skill, mỗi cái 1 thư mục có SKILL.md
│   ├── ecc/  source-driven/  risk-first/  trace-log/  IMOL2o/
│   └── baoyu-design/  cinematic-3d-web/  deep-research/
├── reference/
│   └── working-discipline.md
└── assets/                # hero.svg + divider.svg (pixel-art animation)
```

<div align="center">

<img src="assets/divider.svg" alt="" />

<sub>🔒 Private repo · backup cá nhân, không phát hành công khai · made with <b>Claude Code</b> + pixel ✦</sub>

</div>
