# ECC Patterns — Architecture / SOLID / Data Model

> Dùng khi: thiết kế hệ thống mới, refactor, chọn cấu trúc dữ liệu, Firebase schema

## SOLID áp dụng thực tế

### S — Single Responsibility
```javascript
// SAI: 1 class làm quá nhiều
class AccountManager {
  login() { /* ... */ }
  sendEmail() { /* ... */ }
  saveToFirebase() { /* ... */ }
  formatReport() { /* ... */ }
}

// ĐÚNG: tách theo trách nhiệm
class AuthService { login() {} }
class EmailService { send() {} }
class AccountRepository { save() {} }
class ReportFormatter { format() {} }
```

### O — Open/Closed (mở để mở rộng, đóng để sửa)
```javascript
// SAI: thêm site mới phải sửa switch case
function register(site, account) {
  switch(site) {
    case 'hotmail': return hotmailRegister(account);
    case 'gmail': return gmailRegister(account);
    // Thêm site mới → sửa file này
  }
}

// ĐÚNG: plugin architecture
const registrars = {
  hotmail: new HotmailRegistrar(),
  gmail: new GmailRegistrar(),
};
function register(site, account) {
  const registrar = registrars[site];
  if (!registrar) throw new Error(`Unsupported site: ${site}`);
  return registrar.register(account);
}
// Thêm site mới → chỉ thêm class mới, không sửa logic core
```

### D — Dependency Injection (dễ test, dễ swap)
```javascript
// SAI: hardcoded dependency
class TaskRunner {
  async run(account) {
    const browser = await chromium.launch(); // không thể mock trong test
  }
}

// ĐÚNG: inject dependency
class TaskRunner {
  constructor(browserFactory, logger) {
    this.browserFactory = browserFactory;
    this.logger = logger;
  }
  async run(account) {
    const browser = await this.browserFactory.launch();
  }
}
// Test: inject mock factory
// Production: inject real chromium factory
```

## DRY — Don't Repeat Yourself

```javascript
// Nhận ra pattern lặp lại:
// accounts.filter(a => a.status === 'active')  ← lặp 5 lần trong codebase
// → Extract:
const isActive = (account) => account.status === 'active';
// Dùng: accounts.filter(isActive)

// Lặp lại validation:
if (!email || !email.includes('@')) throw new ValidationError('...');
// → Extract:
function validateEmail(email) {
  if (!email || !email.includes('@')) throw new ValidationError('Invalid email');
}
```

## Firebase data model patterns

### Flatten structure (tránh nested quá sâu)
```javascript
// SAI: nested quá sâu → khó query, tốn bandwidth
/users/{uid}/projects/{pid}/tasks/{tid}/comments/{cid}/

// ĐÚNG: flat collections với references
/users/{uid}
/projects/{pid}  → { ownerId: uid, memberIds: [uid1, uid2] }
/tasks/{tid}     → { projectId: pid, assigneeId: uid }
/comments/{cid}  → { taskId: tid, authorId: uid }
```

### Denormalize khi cần read performance
```javascript
// Tình huống: hiển thị danh sách tasks kèm tên user
// Option A (normalize): read tasks → loop read users → N+1 reads
// Option B (denormalize): store tên trong task
/tasks/{tid}: {
  title: "...",
  assigneeId: "uid123",
  assigneeName: "Nguyễn A",  // ← denormalized, cập nhật khi user đổi tên
}
// Trade-off: data trùng lặp nhưng 1 read thay vì N reads
```

### Pagination với cursor
```javascript
// KHÔNG dùng offset (tốn reads)
db.collection('tasks').orderBy('createdAt').offset(page * 20).limit(20)

// DÙNG cursor
let query = db.collection('tasks').orderBy('createdAt').limit(20);
if (lastDoc) query = query.startAfter(lastDoc);
const snap = await query.get();
const lastDoc = snap.docs[snap.docs.length - 1]; // lưu cho page tiếp
```

### Security Rules pattern
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    // User chỉ đọc/sửa data của mình
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Validate data shape khi write
    match /tasks/{tid} {
      allow create: if request.auth != null
        && request.resource.data.keys().hasAll(['title', 'createdAt'])
        && request.resource.data.title is string
        && request.resource.data.title.size() > 0;
    }
  }
}
```

## Architecture decision framework

### Khi nào dùng gì?

| Tình huống | Nên dùng |
|---|---|
| State chia sẻ trong Electron | Zustand (đơn giản, không boilerplate) |
| State phức tạp nhiều action | useReducer + Context |
| Data từ Firebase real-time | onSnapshot + local state |
| API calls + caching | React Query / SWR |
| Heavy computation | Web Worker |
| Multiple accounts song song | Worker pool (Promise.all với limit) |
| File ops trong Electron | IPC → main process (không làm ở renderer) |

### Khi cần refactor: 3 câu hỏi
1. **Tại sao khó sửa hiện tại?** — tìm root cause, không vá triệu chứng
2. **Change sẽ lan ra bao xa?** — map dependencies trước khi đụng vào
3. **Có test cover không?** — nếu không, viết test trước khi refactor

### Complexity O(n) check
```
Loop trong loop = O(n²) → thường có thể dùng Map để giảm xuống O(n)
accounts.forEach(a => {
  const match = list.find(l => l.id === a.id)  // O(n) × O(n) = O(n²)
})
// → Build Map trước:
const listMap = new Map(list.map(l => [l.id, l]));  // O(n) một lần
accounts.forEach(a => {
  const match = listMap.get(a.id);  // O(1) mỗi lần
});
// → Total: O(n)
```
