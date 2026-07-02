@echo off
:: codex-isolated.bat — Chạy Codex với CODEX_HOME riêng cho từng project
:: Tránh bug #11435 và #24224: session leak workspace root giữa các project song song
::
:: Cách dùng:
::   codex-isolated.bat                    <- dùng tên thư mục hiện tại
::   codex-isolated.bat my-project         <- đặt tên tùy ý
::   codex-isolated.bat my-project "prompt" <- chạy non-interactive

setlocal

:: Lấy tên project (arg 1 hoặc tên thư mục hiện tại)
if "%~1"=="" (
    for %%F in ("%CD%") do set "PROJECT_NAME=%%~nxF"
) else (
    set "PROJECT_NAME=%~1"
    shift
)

:: CODEX_HOME riêng cho project này
set "CODEX_HOME=%USERPROFILE%\.codex-sessions\%PROJECT_NAME%"

:: Tạo thư mục nếu chưa có
if not exist "%CODEX_HOME%" mkdir "%CODEX_HOME%"

:: Sync config từ ~/.codex vào CODEX_HOME (mỗi lần chạy để lấy config mới nhất)
:: config.toml  : model, provider, API key, plugins
:: auth.json    : managed auth token (bắt buộc, không có → 401)
:: installation_id: device ID
:: AGENTS.md   : global instructions
for %%F in (config.toml auth.json installation_id AGENTS.md) do (
    if exist "%USERPROFILE%\.codex\%%F" (
        copy /Y "%USERPROFILE%\.codex\%%F" "%CODEX_HOME%\%%F" >nul
    )
)
echo [codex-isolated] Config synced from ~/.codex

:: Skills vẫn dùng global ~/.agents/skills/ — không cần copy vì read-only

echo [codex-isolated] Project : %PROJECT_NAME%
echo [codex-isolated] CODEX_HOME: %CODEX_HOME%
echo.

:: Chạy codex với CODEX_HOME riêng
set CODEX_HOME=%CODEX_HOME%
codex %*

endlocal
