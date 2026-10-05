# Index & Tra Cứu Kho CCGS Gốc (Claude Code Game Studios)

> Thư mục lưu trữ mã nguồn và tài liệu đầy đủ của repo CCGS:
> `C:\Users\phamn\.gemini\antigravity\knowledge\Claude-Code-Game-Studios`

---

## 1. Danh Mục 49 Vai Trò Chuyên Trách (Agents Prompts)
Khi cần tham khảo chi tiết góc nhìn của từng vị trí trong game studio, đọc file tương ứng tại `.claude/agents/`:

### Ban Giám Đốc (Directors & Leads)
* `creative-director.md` — Định hướng tầm nhìn, phong cách và scope dự án.
* `technical-director.md` — Quyết định hạ tầng, performance budget, tech stack.
* `producer.md` — Phân chia task, quản lý timeline và story backlog.
* `art-director.md` / `technical-artist.md` — Phong cách hình ảnh, tối ưu asset, shader.
* `audio-director.md` / `sound-designer.md` — Thiết kế âm thanh, phân cấp audio channels.
* `qa-lead.md` / `qa-tester.md` — Kế hoạch kiểm thử, bug reporting, test matrix.

### Chuyên Gia Engine (Engine Specialists)
* **Godot:**
  * `godot-specialist.md` — Kiến trúc tổng thể Node/Scene, Signals, Resources.
  * `godot-gdscript-specialist.md` — GDScript 2.0 static typing, memory, performance.
  * `godot-csharp-specialist.md` — Tích hợp C# trong Godot 4.
  * `godot-shader-specialist.md` — Viết Visual / Text Shaders (`.gdshader`).
  * `godot-gdextension-specialist.md` — C/C++ native modules cho Godot.
* **Unity:**
  * `unity-specialist.md` — Kiến trúc component, lifecycle, ScriptableObjects.
  * `unity-dots-specialist.md` — ECS, Job System, Burst Compiler cho hàng vạn thực thể.
  * `unity-shader-specialist.md` — URP / HDRP Shader Graph, HLSL.
  * `unity-ui-specialist.md` — UI Toolkit và uGUI.
  * `unity-addressables-specialist.md` — Quản lý bộ nhớ và tải asset động.
* **Unreal Engine:**
  * `unreal-specialist.md` — Kiến trúc AActor, UObject, GameMode, PlayerController.
  * `ue-gas-specialist.md` — Gameplay Ability System (GAS), Attributes, Effects.
  * `ue-blueprint-specialist.md` — Tối ưu Blueprint và giao tiếp với C++.
  * `ue-replication-specialist.md` — Netcode, RPCs, Client prediction và Server authority.
  * `ue-umg-specialist.md` — CommonUI và widget responsive.

### Lập Trình & Thiết Kế Chuyên Biệt (Specialists)
* `game-designer.md` / `systems-designer.md` / `economy-designer.md` — Lập công thức, kinh tế game, chỉ số.
* `gameplay-programmer.md` — Điều khiển nhân vật, combat mechanics, state machine.
* `ai-programmer.md` — Behavior Trees, Utility AI, Navigation Mesh, telegraphing.
* `level-designer.md` / `world-builder.md` — Nhịp độ màn chơi (Pacing), layout ải, đặt bẫy.
* `ui-programmer.md` / `ux-designer.md` — HUD, menu navigation, gamepad mapping.
* `network-programmer.md` — Socket, WebSocket, snapshot interpolation, latency compensation.

---

## 2. Danh Mục Các File Rules (Tiêu Chuẩn Lập Trình Game)
Nằm tại `.claude/rules/`:
* `gameplay-code.md` — Quy tắc code gameplay không hardcode, delta time, decoupled UI.
* `prototype-code.md` — Tiêu chuẩn nới lỏng cho thư mục `prototypes/` để test nhanh.
* `engine-code.md` — Tiêu chuẩn tương tác API engine an toàn, tránh memory leak.
* `ai-code.md` — Giới hạn 2ms ngân sách CPU cho AI, visualization hooks.
* `shader-code.md` — Quy chuẩn đặt tên shader, tránh dynamic branch trong fragment shader.
* `ui-code.md` — UI không sở hữu game state, hỗ trợ gamepad, accessibility.
* `test-standards.md` — Tiêu chuẩn đặt tên và cấu trúc test theo từng engine.
* `data-files.md` — Schema cho JSON/YAML cân bằng game.
* `design-docs.md` — Quy chuẩn tài liệu GDD 8 mục bắt buộc.

---

## 3. Tài Liệu Nghiên Cứu Chuyên Sâu
Nằm tại `docs/`:
* `docs/WORKFLOW-GUIDE.md` — Cẩm nang phát triển chi tiết qua 7 giai đoạn.
* `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` — Triết lý thiết kế game tương tác cộng tác.
* `docs/skill-flow-diagrams.md` — Sơ đồ luồng di chuyển dữ liệu giữa các kỹ năng.
