# ECC Frontend — Electron / React / Tailwind Patterns

> Domain: claude-gui, mmo-electron, claude-launcher, ngochien-books

## Electron architecture chuẩn

### Cấu trúc thư mục
```
src/
  main/
    index.js          ← main process entry
    ipc/
      handlers.js     ← IPC handler registrations
    services/
      updater.js      ← electron-updater
      tray.js         ← system tray
  renderer/
    App.jsx
    pages/
    components/
    hooks/
    store/            ← Zustand hoặc Context
  preload/
    index.js          ← contextBridge — PHẢI qua đây, không expose nodeRequire
```

### Bảo mật Electron (bắt buộc)
```javascript
// main/index.js — BẮT BUỘC
const win = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false,      // KHÔNG bao giờ true
    contextIsolation: true,      // PHẢI true
    preload: path.join(__dirname, '../preload/index.js'),
    sandbox: true
  }
});
```

### IPC pattern chuẩn (contextBridge)
```javascript
// preload/index.js
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  // Chỉ expose những gì renderer thực sự cần
  readAccounts: () => ipcRenderer.invoke('accounts:read'),
  saveAccounts: (data) => ipcRenderer.invoke('accounts:save', data),
  onProgress: (callback) => ipcRenderer.on('task:progress', (_, v) => callback(v)),
});

// main/ipc/handlers.js
ipcMain.handle('accounts:read', async () => {
  // Validate + sanitize trước khi return
  return accountService.readAll();
});

// renderer — sử dụng qua window.electronAPI
const accounts = await window.electronAPI.readAccounts();
```

### Zustand store pattern
```javascript
// store/accountStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAccountStore = create(
  persist(
    (set, get) => ({
      accounts: [],
      isLoading: false,
      error: null,
      
      loadAccounts: async () => {
        set({ isLoading: true, error: null });
        try {
          const data = await window.electronAPI.readAccounts();
          set({ accounts: data, isLoading: false });
        } catch (err) {
          set({ error: err.message, isLoading: false });
        }
      },
      
      addAccount: (account) =>
        set(state => ({ accounts: [...state.accounts, account] })),
    }),
    { name: 'account-storage' }
  )
);
```

### UI States — xử lý đủ 4 trạng thái
```jsx
// Luôn xử lý: loading, error, empty, success
function AccountList() {
  const { accounts, isLoading, error } = useAccountStore();
  
  if (isLoading) return <AccountListSkeleton />;
  if (error) return <ErrorState message={error} onRetry={loadAccounts} />;
  if (accounts.length === 0) return <EmptyState message="Chưa có account nào" />;
  
  return (
    <ul className="divide-y divide-gray-700">
      {accounts.map(acc => <AccountItem key={acc.id} account={acc} />)}
    </ul>
  );
}
```

### Skeleton loading (Tailwind)
```jsx
function AccountListSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-700 rounded-md" />
      ))}
    </div>
  );
}
```

### Tailwind class organization
```jsx
// Nhóm theo: layout → spacing → sizing → color → state → animation
<div className={[
  'flex items-center gap-3',            // layout
  'px-4 py-2',                          // spacing
  'w-full min-h-[44px]',               // sizing
  'bg-gray-800 text-gray-100',          // color
  'hover:bg-gray-700 focus:ring-2',     // state
  'transition-colors duration-150',     // animation
  isActive && 'border-l-2 border-blue-400'  // conditional
].filter(Boolean).join(' ')} />
```

### useMemo / useCallback — chỉ khi CẦN
```jsx
// useMemo: chỉ khi computation thực sự tốn kém
const filteredAccounts = useMemo(
  () => accounts.filter(a => a.status === filter),
  [accounts, filter]  // dependency chính xác
);

// useCallback: chỉ khi pass xuống child có React.memo
const handleDelete = useCallback(
  (id) => removeAccount(id),
  [removeAccount]
);
// Không dùng useCallback cho handler inline đơn giản — overhead > benefit
```

### Accessibility cơ bản
```jsx
// Button có aria-label nếu chỉ có icon
<button aria-label="Xóa account" onClick={handleDelete}>
  <TrashIcon />
</button>

// Form input
<label htmlFor="email">Email</label>
<input id="email" type="email" aria-required="true" />

// Live region cho thông báo
<div aria-live="polite" className="sr-only">{statusMessage}</div>
```

### Electron build checklist
- [ ] `package.json` có `main` trỏ đúng main process
- [ ] `build.files` exclude `node_modules` dev deps
- [ ] Icons: `.ico` (Windows), `.icns` (Mac), `.png` (Linux)
- [ ] `electron-builder.yml`: `nsis` cho Windows installer
- [ ] Auto-update: `electron-updater` + update server URL
- [ ] `productName` khớp với app name user thấy
