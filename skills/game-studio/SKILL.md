---
name: game-studio
description: >-
  Hệ thống phát triển game toàn diện chuyển thể từ Claude Code Game Studios (CCGS) cho Antigravity.
  Tự động kích hoạt khi người dùng làm game, phát triển gameplay, tạo game 2D/3D, game web (Phaser/Canvas/Three.js),
  game engine (Godot GDScript/C#, Unity C#/DOTS, Unreal C++/Blueprint/GAS), game tu tiên, roguelike, puzzle, RPG;
  khi lập Game Design Document (GDD), thiết kế mechanics, cân bằng kinh tế/chỉ số (economy balancing), level design,
  state machine nhân vật/quái, thêm game feel / juice (screen shake, hitstop, SFX/VFX), hoặc kiểm thử QA/playtest.
  Được tối ưu cho giao thức Quota & Quality (Single-Agent lead đảm nhiệm mọi khâu, chỉ kích hoạt Cặp đôi tác chiến
  1 Subagent Tester/Reviewer khi cần soi chéo).
---

# Game Studio — Bộ Kỹ Năng & Quy Trình Làm Game Chuẩn Studio

Chuyển thể từ **Claude Code Game Studios (CCGS)** và được tối ưu hóa riêng cho Antigravity: giữ trọn vẹn tư duy bài bản, chống "spaghetti code", nhưng loại bỏ thủ tục rườm rà và tiết kiệm token tối đa theo **Giao thức Tác chiến (Quota & Quality Balanced)**.

Repo gốc được lưu trữ vĩnh viễn tại:
`C:\Users\phamn\.gemini\antigravity\knowledge\Claude-Code-Game-Studios`

---

## 1. Nguyên Tắc Cốt Lõi (Non-Negotiable)

1. **Mechanic First, Asset Later (Graybox trước, Art sau):** Không sa đà vào vẽ pixel art, làm 3D model hay kiếm nhạc trước khi core loop được chứng minh là "vui" bằng các hình khối cơ bản (rectangles, cubes, prototype).
2. **Data-Driven (Tách biệt dữ liệu và logic):** Tuyệt đối **không hardcode** chỉ số game (damage, speed, drop rate, mana cost) trong file logic. Mọi chỉ số phải nằm trong Config/JSON/Resource/Data Asset.
3. **Delta Time & Frame Independence:** Mọi phép tính di chuyển, cooldown, animation liên quan đến thời gian đều phải nhân với `delta` (hoặc `deltaTime`).
4. **Decoupled Architecture (Tách rời UI & Gameplay):** UI chỉ là lớp hiển thị và gửi tín hiệu/lệnh (Events, Signals, Delegates). UI **không bao giờ** trực tiếp sửa biến trạng thái nội tại của gameplay.
5. **State Machine rõ ràng:** Nhân vật, quái, game loop phải có state machine minh bạch (Idle, Move, Attack, Hurt, Dead), cấm dùng cờ boolean lộn xộn (`isAttacking`, `canAttack`, `isJumping`, `isFalling`).
6. **Game Feel (The Juice):** Game hay ở phản hồi dưới 100ms: hitstop (freeze frame 0.05s), screen shake, sound cue, particle burst, tween scale/squash & stretch.
7. **Regression Test phải thấy Fail trước:** Viết test logic cho gameplay, chạy test fail trên code chưa fix, rồi mới viết code fix để test pass. Không bao giờ tin một test chưa từng fail.

---

## 2. Dispatcher — Định Tuyến Nhanh Theo Nhiệm Vụ

Khi nhận task làm game, tra cứu file tham chiếu tương ứng trong thư mục `references/`:

| Tình huống / Nhiệm vụ | File cần đọc |
|---|---|
| Lên ý tưởng, định hình core loop, viết GDD (Game Design Document), cân bằng toán/kinh tế/combat | [`references/game-design-systems.md`](references/game-design-systems.md) |
| Lựa chọn & code Engine: Godot 4 (GDScript/C#), Unity (C#/ScriptableObjects), Unreal Engine 5 (C++/GAS), Web/Canvas/Phaser | [`references/engine-guides.md`](references/engine-guides.md) |
| Đồ họa Web Game Canvas 2D: Procedural Pixel Art, Chibi generator, walking bobbing 4-frame, cartoon outline, LRU sprite cache | [`references/canvas-procedural-art.md`](references/canvas-procedural-art.md) |
| Quy trình phát triển: 7 Phase từ Concept → Prototype (Vertical Slice) → Production → Polish → Release | [`references/pipeline.md`](references/pipeline.md) |
| Thêm "Juice" / Game Feel: Screen shake, Hitstop, Particle, Audio feedback, Coyote time, Input buffering, 60 FPS budget | [`references/game-feel-polish.md`](references/game-feel-polish.md) |
| Kiểm thử, QA, phát hiện bug logic, chống flakiness, Save/Load integrity & Quy trình Cặp đôi tác chiến | [`references/qa-testing-protocol.md`](references/qa-testing-protocol.md) |
| Tra cứu 49 vai trò chuyên trách và 74 skills chi tiết từ kho CCGS gốc | [`references/ccgs-index.md`](references/ccgs-index.md) |

---

## 3. Quy Trình Vận Hành (Lead Synthesizer + Cặp Đôi Tác Chiến)

CCGS gốc dùng 49 agent riêng biệt gây tốn hàng triệu token và tràn context. Trong Antigravity, áp dụng chuẩn:

* **Mặc định (Single-Agent):** Lead Agent đóng vai trò **Studio Lead / Lead Technical Designer**, tự động áp dụng góc nhìn của từng vai trò (Gameplay, AI, Level, Shader, Audio) theo đúng ngữ cảnh mà không cần spawn agent phụ.
* **Chế độ Prototype:** Cho phép viết code nhanh, cấu trúc đơn giản, dùng placeholder để kiểm chứng core loop trong thư mục `prototypes/`. Khi cơ chế được xác nhận là "vui", mới refactor sang chuẩn Production.
* **Giao thức "Cặp đôi tác chiến" (Khi QA / Review sâu):**
  * Tối đa **1 Subagent duy nhất** làm Tester / Reviewer.
  * Tác vụ chạy test, đọc log: Dùng `flash_lite`.
  * Soi logic toán học, bảo mật save file, kiến trúc engine: Dùng `flash` hoặc `inherit`.
  * Subagent phụ chỉ là **Read-only / Advisory** (cố vấn), **không** được tự ý sửa code. Lead Agent thẩm định và thực thi thay đổi.
