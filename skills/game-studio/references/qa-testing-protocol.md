# QA & Testing Protocol (Kiểm Thử & Đảm Bảo Chất Lượng Game)

> Quy chuẩn kiểm thử game tự động và giao thức "Cặp đôi tác chiến" dành riêng cho Antigravity.

---

## 1. Nguyên Tắc Cốt Lõi Về Test Trong Game

### A. Phải Thấy Test Fail Trước Khi Tin Nó
* **Quy tắc CCGS:** Một test mà bạn chưa từng thấy nó fail thì không có giá trị chứng minh.
* **Quy trình chuẩn khi sửa bug:**
  1. Viết Unit Test tái hiện chính xác trường hợp bug.
  2. Chạy test trên code hiện tại $\rightarrow$ **Xác nhận Test FAIL**.
  3. Sửa code để khắc phục lỗi.
  4. Chạy lại test $\rightarrow$ **Xác nhận Test PASS**.

### B. Cấu Trúc Arrange / Act / Assert (AAA)
Mọi test case phải độc lập, không dựa vào trạng thái toàn cục (global state) và tự dọn dẹp (cleanup) sau khi chạy:

```javascript
// Ví dụ test cơ chế tính sát thương giáp
describe('CombatSystem - Damage Calculation', () => {
  it('should reduce damage according to diminishing armor formula', () => {
    // 1. Arrange
    const combat = new CombatCalculator({ armorConstant: 100 });
    const rawDamage = 100;
    const targetArmor = 50;

    // 2. Act
    const damageTaken = combat.calculateDamage(rawDamage, targetArmor);

    // 3. Assert (100 * (100 / (50 + 100)) = 66.666...)
    expect(damageTaken).toBeCloseTo(66.67, 1);
  });
});
```

---

## 2. Các Kịch Bản Phá Hoại Game Cần Test (Edge Cases)

| Nhóm Kiểm Thử | Tình huống nguy cơ cao | Cách kiểm tra |
|---|---|---|
| **Save / Load Integrity** | Người chơi thoát game đột ngột khi đang lưu, file save bị đổi phiên bản (Schema migration). | Viết test deserialize save file cũ (v1) vào engine mới (v2), kiểm tra backup file `.bak`. |
| **Input Mashing** | Người chơi bấm nút Đánh và Nhảy cùng một frame 100 lần liên tiếp. | Mô phỏng gửi liên tiếp các event xem state machine có bị kẹt vào trạng thái bất tử hay không. |
| **Negative Values** | Quái bị buff trừ giáp khiến Giáp < 0, hoặc giá vật phẩm trong shop bị âm khiến mua đồ được thêm tiền. | Kiểm tra hàm clamp: `Math.max(0, value)` cho tiền tệ, máu, cooldown. |
| **Floating Drift** | Cộng dồn `delta` liên tục gây sai số số thực sau 2 giờ chơi liên tục. | Dùng fixed-point hoặc làm tròn tọa độ sau mỗi tick logic. |
| **Orphan Nodes** | Tạo đạn và hiệu ứng nhưng quên giải phóng khi bay ra ngoài màn hình. | Theo dõi `instance_count` của engine xem có tăng vô hạn không. |

---

## 3. Giao Thức "Cặp Đôi Tác Chiến" (Antigravity Protocol)

Để tối ưu hóa Quota & Quality, Antigravity **không bao giờ** spawn 4-8 agent cùng lúc như Claude Code gốc. Khi bước vào khâu QA hoặc kiểm tra kiến trúc sâu:

```text
┌──────────────────────────────────────┐
│       LEAD AGENT (Antigravity)       │
│  - Thiết kế kiến trúc & code chính   │
│  - Duyệt và áp dụng mọi thay đổi     │
└──────────────────┬───────────────────┘
                   │
    Cặp đôi tác chiến (Tối đa 1 Subagent duy nhất)
                   │
                   ▼
┌──────────────────────────────────────┐
│     SUBAGENT: TESTER / REVIEWER      │
│  - Read-Only / Advisory (Chỉ cố vấn) │
│  - flash_lite: Chạy test, đọc log    │
│  - flash / inherit: Soi logic toán   │
│  - Báo cáo cô đọng (Bullet points)   │
└──────────────────────────────────────┘
```

### Các Bước Thực Hiện:
1. **Lead Agent** chuẩn bị test runner hoặc kịch bản kiểm thử.
2. Nếu cần rà soát toàn diện, Lead Agent gọi `invoke_subagent` với đúng **1 Subagent**:
   * **Role:** `Game QA & Logic Tester`
   * **Model:** `flash_lite` (nếu chỉ chạy test script hoặc đọc log dài), hoặc `flash`/`inherit` (nếu cần soi logic toán học, bảo mật netcode, thuật toán RNG).
3. **Subagent** tiến hành kiểm thử, ghi nhận bug và gửi báo cáo về cho Lead Agent dưới dạng danh sách bullet points ngắn gọn:
   * Vị trí lỗi (file + line).
   * Kịch bản gây lỗi (reproduction steps).
   * Đề xuất hướng khắc phục.
4. **Lead Agent** thẩm định đề xuất của Subagent, tự tay sửa code và verify lại kết quả cuối cùng trước khi bàn giao cho người dùng.
