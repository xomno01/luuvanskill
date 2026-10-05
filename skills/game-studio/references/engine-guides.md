# Engine Architectural Guides (Godot, Unity, Unreal, Web)

> Kiến trúc chuẩn mực theo từng Engine được đúc kết từ các Engine Specialists của Claude Code Game Studios.

---

## 1. Godot 4.x (GDScript & C#)

Godot là engine mã nguồn mở tối ưu nhất cho indie, 2D và 3D vừa phải.

### Quy Tắc Vàng Trong Godot:
1. **Scene Tree Architecture:** "Call down, signal up". Node cha gọi hàm node con trực tiếp; Node con **chỉ phát Signal** lên trên khi có sự kiện, không bao giờ `get_parent().get_parent()`.
2. **Static Typing trong GDScript:** Luôn ép kiểu tường minh (`var hp: int = 100`, `func take_damage(amount: float) -> void:`). Tăng tốc độ thực thi GDScript lên 25-30% và bắt lỗi ngay khi compile.
3. **Custom Resources (`Resource`):** Dùng Resource cho mọi dữ liệu cấu hình (ItemData, SkillData, EnemyConfig). Resource trong Godot hoạt động tương đương ScriptableObject của Unity.
4. **Auto-Free trong Unit Tests:** Khi viết test gdUnit4, luôn bọc node mới tạo trong `auto_free()` để tránh rò rỉ bộ nhớ (Godot orphan node exit code 101).

```gdscript
# ItemData.gd
class_name ItemData
extends Resource

@export var id: String = ""
@export var display_name: String = ""
@export var icon: Texture2D
@export var sell_price: int = 10
@export var attributes: Dictionary = {}
```

---

## 2. Unity (C# & ScriptableObject Architecture)

### Quy Tắc Vàng Trong Unity:
1. **ScriptableObject-Driven Architecture:** Dùng ScriptableObject làm kho dữ liệu cấu hình, data containers và kênh sự kiện trung gian (GameEvent SO). Hạn chế tối đa dùng `Singleton.Instance`.
2. **Hạn Chế Garbage Collection:**
   * Không dùng `FindObjectOfType`, `GetComponent` trong hàm `Update()`. Cache references trong `Awake()` hoặc `Start()`.
   * Dùng `StringBuilder` cho chuỗi động trong UI HUD.
   * Dùng **Object Pool** cho Particle, Projectile và Floating Text.
3. **Event-Driven UI:** UI script đăng ký nhận event từ gameplay manager, không poll data trong `Update()`.

```csharp
// Event channel trung gian chống coupling giữa Player và UI
[CreateAssetMenu(fileName = "New IntEventChannel", menuName = "Events/Int Event Channel")]
public class IntEventChannelSO : ScriptableObject
{
    public event Action<int> OnEventRaised;

    public void RaiseEvent(int value)
    {
        OnEventRaised?.Invoke(value);
    }
}
```

---

## 3. Unreal Engine 5 (C++ & Gameplay Ability System - GAS)

### Quy Tắc Vàng Trong Unreal:
1. **Chia Tách C++ và Blueprints:**
   * C++ chịu trách nhiệm: Toán học, State, Netcode replication, gameplay systems nặng, cơ sở dữ liệu.
   * Blueprint (BP) chịu trách nhiệm: Visuals, gắn âm thanh, particle components, tweaking thông số, camera view.
2. **Gameplay Ability System (GAS):** Sử dụng `AbilitySystemComponent`, `GameplayAttributeSet`, và `GameplayEffect` cho các game RPG / Combat có nhiều chỉ số, buff/debuff.
3. **Unreal Delegates:** Sử dụng Dynamic Multicast Delegates để broadcast sự kiện sang Blueprint hoặc UI (CommonUI).
4. **Automation Tests:** Mọi test case phải có Arrange/Act/Assert và cleanup actor sau khi test xong.

---

## 4. Web Game (TypeScript + Phaser 3 / PixiJS / Canvas / Three.js)

Thích hợp cho game nền web, Telegram mini-app, Electron app hoặc game tu tiên idle:

### Quy Tắc Vàng Web Game:
1. **Tách biệt Fixed Step (Logic) và Variable Render:**
   ```javascript
   const FIXED_TIME_STEP = 1000 / 60; // 16.66ms
   let accumulator = 0;
   let lastTime = performance.now();

   function gameLoop(currentTime) {
     const frameTime = Math.min(currentTime - lastTime, 250); // Clamping max delta
     lastTime = currentTime;
     accumulator += frameTime;

     while (accumulator >= FIXED_TIME_STEP) {
       updateLogic(FIXED_TIME_STEP / 1000); // 60 ticks logic ổn định
       accumulator -= FIXED_TIME_STEP;
     }

     renderGraphics(accumulator / FIXED_TIME_STEP); // Interpolation
     requestAnimationFrame(gameLoop);
   }
   ```
2. **Entity-Component-System (ECS):** Khi số lượng thực thể > 500 (như đạn bay trong game Vampire Survivors / Bullet Hell), dùng kiến trúc ECS (ví dụ: `bitecs`) để dữ liệu được sắp xếp tuần tự trong bộ nhớ (Data-oriented design), tránh lag do V8 garbage collection.
