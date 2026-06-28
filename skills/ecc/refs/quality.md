# ECC Quality — Review / Test / Security / Debug

> Dùng khi: code review, security audit, tìm bug, viết test, regression check

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
