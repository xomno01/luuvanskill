# Game Design & Systems (Thiết Kế Hệ Thống & Toán Học Trong Game)

> Tài liệu thiết kế chuẩn hóa và các công thức toán học game cốt lõi từ Claude Code Game Studios.

---

## 1. Chuẩn Game Design Document (GDD - 8 Mục Bắt Buộc)

Một tài liệu thiết kế tính năng không được nói mơ hồ ("game tạo cảm giác mượt mà"), mà phải đo lường và lập trình được theo 8 mục:

```markdown
# [Tên Hệ Thống]: Game Design Specification

## 1. Overview (Tổng Quan)
Mục đích của hệ thống, đóng vai trò gì trong game loop tổng thể.

## 2. Player Fantasy (Cảm Xúc Người Chơi)
Người chơi cảm thấy quyền lực, hồi hộp, chiến thuật hay thỏa mãn như thế nào?

## 3. Detailed Rules (Quy Tắc Chi Tiết)
- Điều kiện kích hoạt: Khi nào hệ thống chạy?
- Luồng sự kiện tuần tự từ đầu đến cuối.
- Các trạng thái (States) có thể xảy ra.

## 4. Formulas & Math (Công Thức & Toán Học)
- Định nghĩa biến: `ATK`, `DEF`, `CRIT_RATE`, `CRIT_DMG`.
- Công thức tính toán chi tiết (kèm ví dụ bằng số cụ thể).

## 5. Edge Cases (Các Trường Hợp Biên)
- Máu = 0 cùng lúc hai bên đánh nhau thì ai thắng?
- Người chơi ấn phím khi đang bị stun thì lệnh có lưu đệm không?
- Mất kết nối mạng / Pause game giữa lúc animation đang chạy?

## 6. Dependencies (Quan Hệ Phụ Thuộc)
- Hệ thống này đọc dữ liệu từ đâu?
- Hệ thống nào khác đang lắng nghe sự kiện của hệ thống này?

## 7. Tuning Knobs (Bảng Tham Số Cân Bằng)
| Tham số | Giá trị mặc định | Khoảng an toàn | Ý nghĩa gameplay |
|---|---|---|---|
| `base_damage` | 25.0 | [10.0, 100.0] | Sát thương cơ bản |
| `cooldown` | 1.5s | [0.5s, 5.0s] | Nhịp độ ra đòn |

## 8. Acceptance Criteria (Tiêu Chí Kiểm Thử)
- [ ] Khi nhân vật có 50 Giáp, đòn đánh 100 Sát thương gây chính xác 66 Máu.
- [ ] Không thể cast chiêu khi Mana < Cost.
```

---

## 2. Các Công Thức Toán Học Kinh Điển (Math Formulas)

### A. Công Thức Giảm Trừ Sát Thương Theo Giáp (Diminishing Armor)
Công thức kinh điển từ *Warcraft 3 / League of Legends / Diablo*, đảm bảo giáp càng cao thì giá trị bảo vệ tăng dần nhưng không bao giờ đạt tới 100% miễn nhiễm:

$$\text{Damage Taken} = \text{Raw Damage} \times \left( \frac{K}{\text{Armor} + K} \right)$$

* Thông thường $K = 100$ hoặc $K = 200$.
* **Ví dụ ($K = 100$):**
  * Giáp = 0: Nhận $100\%$ sát thương.
  * Giáp = 50: Nhận $100 / (50 + 100) = 66.6\%$ sát thương (giảm 33.3%).
  * Giáp = 100: Nhận $100 / (100 + 100) = 50\%$ sát thương (giảm 50%).
  * Giáp = 300: Nhận $100 / (300 + 100) = 25\%$ sát thương (giảm 75%).

### B. Công Thức Đòn Chí Mạng (Critical Strike)
$$\text{Expected Damage} = \text{Base Damage} \times (1 + \text{CritRate} \times (\text{CritMultiplier} - 1))$$

* Áp dụng thuật toán **Pseudo-Random Distribution (PRD)** thay vì Random thuần (RNG) để tránh việc người chơi bị xui 10 phát không crit hoặc quái hên crit liên tục 3 phát làm chết oan.

### C. Đường Cong Kinh Nghiệm & Đột Phá Cảnh Giới (Progression Curve)
Kinh nghiệm cần để lên cấp $L$:

$$\text{XP}(L) = \text{BaseXP} \times (L)^\alpha + \text{FlatGrowth} \times L$$

* $\alpha = 1.5$ đến $2.0$: Tăng trưởng lũy thừa nhẹ, tạo cảm giác đầu game nhanh, late game cần cày cuốc hoặc có cơ duyên đột phá.
* Trong game Tu Tiên: Mỗi khi vượt đại cảnh giới (Trúc Cơ $\rightarrow$ Kim Đan), áp dụng **Hệ số Bức tường (Threshold Wall)** để chặn người chơi phải vượt qua một Thiên Kiếp / Boss bí cảnh.

---

## 3. Kiến Trúc Finite State Machine (FSM)

Mọi thực thể (Entity) trong game phải quản lý trạng thái bằng FSM minh bạch:

```javascript
// core/StateMachine.js
export class StateMachine {
  constructor(owner, validTransitions, initialState) {
    this.owner = owner;
    this.validTransitions = validTransitions;
    this.currentState = initialState;
  }

  canTransitionTo(nextState) {
    const allowed = this.validTransitions[this.currentState];
    return allowed && allowed.includes(nextState);
  }

  transitionTo(nextState, context = {}) {
    if (!this.canTransitionTo(nextState)) {
      console.warn(`[FSM] Chuyển trạng thái bất hợp lệ: ${this.currentState} -> ${nextState}`);
      return false;
    }
    const previous = this.currentState;
    this.currentState = nextState;
    if (this.owner.onStateChanged) {
      this.owner.onStateChanged(previous, nextState, context);
    }
    return true;
  }
}
```

---

## 4. Quy Chuẩn Tách Dữ Liệu Khỏi Code (Data-Driven)

Dữ liệu cân bằng nằm trong file config độc lập, game engine đọc vào dưới dạng Read-Only:

```json
{
  "characters": {
    "sword_master": {
      "name": "Kiếm Tu",
      "base_stats": {
        "max_hp": 200,
        "base_atk": 35,
        "base_def": 12,
        "move_speed": 180.0
      },
      "skills": ["swift_slash", "flying_sword", "sword_barrier"]
    }
  },
  "balance_knobs": {
    "global_damage_multiplier": 1.0,
    "xp_rate_multiplier": 1.2,
    "potion_cooldown_seconds": 8.0
  }
}
```
* **Lợi ích:** Designer có thể cân bằng lại toàn bộ game, buff/nerf quái mà không cần recompile hoặc đụng vào 1 dòng code logic nào!
