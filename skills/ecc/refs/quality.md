# ECC Quality — Review / Test / Security / Debug

> Dùng khi: code review, security audit, tìm bug, viết test, regression check
> Xem thêm quy chuẩn bảo mật chi tiết tại skill [`security-review`](../../security-review/SKILL.md) (OWASP Top 10 + Agentic Security Top 10).

## Code Review — 5 chiều kiểm tra

### 1. Correctness (Logic đúng không)
- Tất cả code path có return value đúng type không?
- Edge cases: null/undefined, empty array, 0, negative number, rất lớn
- Off-by-one errors trong loop
- Race condition khi async

### 2. Security (Bảo mật)
```
Checklist bắt buộc:
□ Không có hardcoded secret/password/token trong code
□ User input được sanitize trước khi dùng (XSS, injection)
□ File path từ user input được validate (path traversal)
□ API keys không log ra console
□ eval() / new Function() → KHÔNG DÙNG với user input
□ SQL/NoSQL: parameterized query, không string concat
```

**Nếu phát hiện security issue → STOP → fix ngay trước khi tiếp tục**

### 3. Reuse & DRY
- Logic lặp ≥ 3 lần → extract function/hook
- Component giống nhau nhưng data khác → generalize với props
- Config lặp lại → extract constant

### 4. Performance
```javascript
// Cờ đỏ:
db.collection('x').get().then(all => all.filter(...))  // load hết rồi mới filter
accounts.forEach(async a => await fn(a))               // sequential thay vì parallel
setInterval(syncFn, 100)                               // polling quá thường
new RegExp(userInput)                                  // ReDoS nếu input độc
```

### 5. Maintainability
- File > 400 dòng → nên split
- Function > 50 dòng → nên extract
- Nesting > 4 levels → flatten với early return
- Comment giải thích WHAT (cái gì) → xóa đi, đổi tên biến cho rõ
- Comment giải thích WHY (tại sao) → giữ lại

## Debug workflow (Root Cause Analysis)

### Bước 1: Không đoán, đọc error trước
```
1. Đọc error message đầy đủ + stack trace
2. Xác định: lỗi xảy ra ở dòng nào? file nào?
3. Check: lỗi có nhất quán hay intermittent (thỉnh thoảng mới xảy ra)?
4. Reproduce locally trước khi fix
```

### Bước 2: Narrow down với logs
```javascript
// Đặt checkpoint logs tại các boundary
console.log('[CHECKPOINT 1] Input:', JSON.stringify(input));
// ... code ...
console.log('[CHECKPOINT 2] After parse:', result);
// ... code ...
console.log('[CHECKPOINT 3] Before API call:', payload);
```

### Bước 3: Phân loại nguyên nhân
| Triệu chứng | Nguyên nhân phổ biến |
|---|---|
| Undefined is not a function | Object chưa được init, optional chain thiếu |
| Promise rejected (unhandled) | await thiếu, catch thiếu |
| Memory leak | Event listener không được removeListener |
| Intermittent failure | Race condition, timing dependency |
| Works locally, fail production | Missing env var, different Node version |
| Playwright selector not found | DOM thay đổi, waitForSelector thiếu |

### Bước 4: Fix + verify
```
Fix → unit test để cover case lỗi → chạy lại reproduce steps → confirm fixed
```

## Testing patterns

### Unit test structure (Jest)
```javascript
describe('AccountService', () => {
  describe('processAccount', () => {
    it('throws NotFoundError khi account không tồn tại', async () => {
      const repo = { findById: jest.fn().mockResolvedValue(null) };
      const service = new AccountService(repo, mockNotifier);
      await expect(service.processAccount('fake-id'))
        .rejects.toThrow(NotFoundError);
    });

    it('update status thành done sau khi thành công', async () => {
      const account = { id: '1', email: 'test@test.com', status: 'active' };
      const repo = {
        findById: jest.fn().mockResolvedValue(account),
        save: jest.fn().mockResolvedValue(undefined),
      };
      await new AccountService(repo, mockNotifier).processAccount('1');
      expect(repo.save).toHaveBeenCalledWith('1', expect.objectContaining({ status: 'done' }));
    });
  });
});
```

### Test categories cho automation projects
```
Unit: helper functions (parse OTP, format date, calculate delay)
Integration: account flow với real Playwright (local only, không CI)
Regression: "email này từng fail vì X" → test case cố định
Edge cases:
  - Email không có OTP sau 60 giây
  - Network drop giữa chừng
  - Account bị block sau login
  - 2 worker cùng process 1 account (race condition)
```

### Manual test checklist (Playwright bot)
```
□ Single account flow: từ đầu đến cuối
□ Session expired: bot phải detect và relogin
□ OTP timeout: bot báo lỗi đúng cách
□ Network drop: retry không infinite loop
□ 10 accounts song song: không conflict
□ 50 accounts: memory usage không tăng mãi
□ Bot crash giữa chừng: resume từ checkpoint
```

## Security scan (trước khi deploy)

```bash
# Tìm hardcoded secrets
grep -rn "password\|secret\|token\|api_key" src/ --include="*.js" | grep -v "test\|mock"

# Tìm eval
grep -rn "eval(" src/ --include="*.js"

# Check .env không bị commit
cat .gitignore | grep ".env"

# npm audit
npm audit --audit-level=high
```

---

# SYNC ECC v2.2.1 (2026-08-31)

## Delivery Gate — chốt cơ khí trước khi được "xong" (từ skill `delivery-gate`)

> Dùng khi: agent dễ tự tuyên bố "xong rồi" trong khi habit bị bỏ — không capture lesson, shortcut có hệ thống, ổ đĩa đầy ngầm.

Nguyên lý: **gate cơ khí ≠ gate suy luận**. self-audit (suy luận) kiểm tra "nội dung có đúng/honest không"; delivery-gate (cơ khí) chỉ check **fact máy đọc được** — y hệt triết lý CI gate. Không AI inference.

| Check | Cơ chế | Khi dính |
|---|---|---|
| Rationalization ("skip tests for now", "pre-existing bug") | regex trên phần cuối transcript | **chỉ warning** (regex false-positive được) |
| Learning library ôi thiu (mtime của 5 path) | so mtime với hôm nay | ≥3 stale HOẶC growth-log stale + task complex → **Block** |
| Disk < 50GB | `disk_usage` | warning |
| Disk < 15GB | `disk_usage` | **Block** (exit 2) |

```json
// Stop hook trong settings.json — chặn trước khi agent tuyên bố xong
{ "hooks": { "Stop": [{ "hooks": [{
  "type": "command",
  "command": "python3 ~/.claude/scripts/quality-gate.py",
  "timeout": 5000
}] }] } }
```

- Task complex = ngưỡng edit/write ≥ 3 calls (config `COMPLEX_THRESHOLD`).
- Gate ép **habit** chạm learning library, không đảm bảo **chất lượng** nội dung ghi — muốn chất lượng thì pair với self-audit. Defense in depth: cơ khí chặn sâu bại, suy luận chặn nguỵ biện.

## Growth Log — log học được pattern, không phải nhật ký (từ skill `growth-log`)

> Dùng khi: vừa xong task complex, vừa fail, hoặc "khó hơn dự kiến". Trivial fix (typo, đổi config 1 dòng) → bỏ qua. Ngưỡng: task có debugging/redo/rollback/quyết định non-obvious không? Có → ghi.

**3 rules:**
1. **Failure > Achievement** — 1 bug mà mò 2 tiếng dạy nhiều hơn 3 feature chạy ngay lần đầu.
   - SAI: "Successfully implemented the login flow."
   - ĐÚNG: "Session token không persist vì cookie `SameSite` mặc định `Lax` trên Chrome 128+. Pattern: cross-origin thì set tường minh `SameSite=None; Secure`. Signal nhận diện: auth gãy sau khi browser nâng cấp."
2. **Bole principle** — trước khi ghi entry mới, hỏi: "cái này có cùng root cause với cái đã ghi chưa?" Cùng root-cause khác triệu chứng → MERGE vào entry cũ, không tạo trùng.
3. **Phải transferable** — entry nào không viết được câu "Lần sau gặp [signal] tôi sẽ [action]" là chưa extract ra pattern.

```markdown
## [Tên entry = pattern, không phải sự việc]
### Context — định làm gì, vỡ ra sao
### Root Cause — cơ chế gốc, không phải triệu chứng
### The Pattern (transferable)
- Lần sau gặp [tình huống tương tự] → [action cụ thể]
- Signal nhận diện: [dấu hiệu quan sát được nói pattern này đang active]
### Related — link entry liên quan
```

> Ví dụ dạng bot của anh: "OTP poll fail âm thầm vì `messages.find()` trả undefined khi mailbox rỗng — không throw mà cứ poll tới timeout. Pattern: mọi `.find()` trong flow chờ kết quả phải có explicit throw. Signal: step mất đúng timeout nhưng log không có error nào."

## Council + External Critique (từ skill `council-multi-model`)

> Dùng khi: quyết định go/no-go mơ hồ, hệ quả lớn — cần một model ngoài cố "đập vỡ" bản tổng hợp trước khi chốt.

- Chạy council bình thường (các position + synthesis draft) TRƯỚC, rồi mới thêm **1 node duy nhất**: gửi packet review gọn (draft + các điểm disagree) cho model ngoài (Codex/OpenAI) gọi nó phá synthesis.
- **Cần consent tường minh** trước khi gửi material ra provider ngoài — cấm gửi credential/proprietary/personal data nếu anh chưa duyệt đúng packet đó.
- Label trung thực: host đang là OpenAI mà reviewer cũng OpenAI → ghi `same-provider external critique`, KHÔNG nhận là "đa góc nhìn đa provider". Adapter không có → ghi review absent.
- Quyết định cuối vẫn là người — external critique chỉ là 1 tham số thêm, không phải authority thứ hai.
