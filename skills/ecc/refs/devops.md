# ECC DevOps — Build / Package / Deploy Patterns

> Domain: build-exe.bat, electron builder, PyInstaller, update-server, am-proxy

## Electron Builder (Windows .exe)

### electron-builder.yml chuẩn
```yaml
appId: com.yourname.appname
productName: App Name
directories:
  output: dist
  buildResources: build

files:
  - "src/**/*"
  - "!src/**/*.test.js"
  - "!node_modules/**"
  - "node_modules/**"        # include runtime deps

win:
  target:
    - target: nsis           # installer .exe
    - target: portable       # portable .exe
  icon: build/icon.ico

nsis:
  oneClick: false            # user chọn install dir
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: App Name

publish:
  provider: generic
  url: https://your-update-server.com/updates/
```

### Build script (package.json)
```json
{
  "scripts": {
    "build": "npm run build:renderer && electron-builder",
    "build:renderer": "vite build",
    "build:win": "electron-builder --win",
    "build:portable": "electron-builder --win portable",
    "dist": "npm run build && npm run build:win"
  }
}
```

### Pre-build checklist
- [ ] `version` trong `package.json` đã bump
- [ ] Icon `.ico` đúng kích thước (256x256 min)
- [ ] `main` field trỏ đúng vào main process
- [ ] Env vars production không có trong code (chỉ có dev mới cần .env)
- [ ] `asar: true` để pack source thành archive

## PyInstaller — đóng gói Python script

### Lệnh cơ bản
```bat
REM Single file output
pyinstaller --onefile --windowed --icon=icon.ico launcher.py

REM Với hidden imports (thường cần cho Playwright)
pyinstaller --onefile ^
  --hidden-import=playwright ^
  --hidden-import=playwright.sync_api ^
  --add-data "config.json;." ^
  --icon=icon.ico ^
  script.py
```

### Spec file khi cần control chi tiết
```python
# launcher.spec
a = Analysis(
    ['launcher.py'],
    pathex=['.'],
    binaries=[],
    datas=[('config.json', '.'), ('assets', 'assets')],
    hiddenimports=['playwright', 'requests'],
    ...
)
exe = EXE(a.scripts, a.binaries, a.zipfiles, a.datas,
    name='launcher',
    debug=False,
    console=False,   # True = show console, False = GUI
    icon='icon.ico'
)
```

### Build .bat script chuẩn
```bat
@echo off
echo [BUILD] Cleaning old dist...
if exist dist rmdir /s /q dist
if exist build rmdir /s /q build

echo [BUILD] Installing deps...
pip install -r requirements.txt

echo [BUILD] Building exe...
pyinstaller --onefile --windowed --icon=icon.ico launcher.py

echo [BUILD] Done! Check dist\launcher.exe
pause
```

## Auto-update server (Express)

### Cấu trúc update server
```
update-server/
  public/
    releases/
      1.2.0/
        AppName-Setup-1.2.0.exe
        latest.yml
  server.js
```

### latest.yml (Electron Updater format)
```yaml
version: 1.2.0
files:
  - url: AppName-Setup-1.2.0.exe
    sha512: <hash>
    size: 12345678
path: AppName-Setup-1.2.0.exe
sha512: <hash>
releaseDate: '2026-01-01T00:00:00.000Z'
```

### Update server endpoints
```javascript
// server.js
app.get('/updates/latest.yml', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/releases/latest.yml'));
});
app.get('/updates/:filename', (req, res) => {
  const file = path.join(__dirname, 'public/releases', req.params.filename);
  if (!fs.existsSync(file)) return res.status(404).send('Not found');
  res.download(file);
});
```

### Electron main — auto-update wiring
```javascript
const { autoUpdater } = require('electron-updater');
autoUpdater.setFeedURL({ provider: 'generic', url: 'https://your-server/updates' });

app.on('ready', () => {
  autoUpdater.checkForUpdatesAndNotify();
});

autoUpdater.on('update-available', () => {
  // Thông báo user
});
autoUpdater.on('update-downloaded', () => {
  // Hỏi user có muốn restart không
  autoUpdater.quitAndInstall();
});
```

## File copy / sync (.bat)

### Copy files sang nhiều project rồi build
```bat
@echo off
setlocal

set SRC=D:\Claude code cli\local\bin
set TARGETS=D:\Claude code cli\hotmail-manager D:\Claude code cli\auto-manager

for %%T in (%TARGETS%) do (
  echo [SYNC] Copying to %%T...
  xcopy /E /Y /I "%SRC%\scripts" "%%T\scripts"
  echo [BUILD] Building %%T...
  cd /d "%%T"
  call npm run build
)

echo [DONE] All targets built.
pause
```

## Proxy / tunnel checklist
- [ ] start-tunnel.bat tồn tại và document rõ cách chạy lại sau restart
- [ ] Ghi log tunnel PID để có thể kill khi cần
- [ ] Health check endpoint `/health` để detect tunnel chết
- [ ] Retry logic ở client khi tunnel timeout (Error 1033/530)

## Release checklist
- [ ] Bump version (`npm version patch/minor/major`)
- [ ] Build + test locally
- [ ] Upload installer lên update server
- [ ] Update `latest.yml` với hash mới
- [ ] Tag git commit: `git tag v1.2.0`
- [ ] Thông báo user qua Telegram bot
