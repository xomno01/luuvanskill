---
name: security-review
description: >-
  Chuyên gia rà soát bảo mật & kiểm thử xâm nhập (Security Audit / Penetration Testing)
  từ Everything Claude Code (ECC) và OWASP Top 10 / AgentShield. Gọi khi: triển khai auth/session,
  làm việc với secrets, API endpoints, xử lý user input, query DB, thanh toán, hoặc kiểm tra website/service trước khi go-live.
---

# Security Review — ECC & OWASP Defense in Depth

Kỹ năng rà soát lỗ hổng bảo mật toàn diện theo chuẩn **OWASP Top 10** và **OWASP Agentic Security Top 10**, chắt lọc từ framework Everything Claude Code (ECC).

## 10 Chiều Rà Soát Bắt Buộc (The 10 Core Security Domains)

### 1. Quản lý Bí mật (Secrets Management)
- **CẤM (FAIL):** Hardcode API keys, passwords, private keys, database credentials vào mã nguồn git.
- **CHUẨN (PASS):** Đưa toàn bộ vào biến môi trường (`process.env`, `env.KEY`, Cloudflare Secrets). Luôn đảm bảo `.env`, `.wrangler`, `*.pem` có trong `.gitignore`.

### 2. Xác thực Dữ liệu Đầu vào (Input Validation & Sanitization)
- **CẤM (FAIL):** Tin tưởng dữ liệu từ client/request body.
- **CHUẨN (PASS):** Whitelist validation cho mọi input (regex độ dài, format email, domain hợp lệ). Từ chối ngay lập tức (HTTP 400 Bad Request) với payload bất thường.

### 3. Phòng chống SQL / NoSQL Injection
- **CẤM (FAIL):** Ghép chuỗi truy vấn (string concatenation: `SELECT * FROM users WHERE id = '` + id + `'`).
- **CHUẨN (PASS):** 100% Prepared Statements có tham số hóa (`.prepare('SELECT ... WHERE id = ?').bind(id)`).

### 4. Kiểm soát Quyền & Ngăn chặn BOLA / IDOR (Authorization)
- **CẤM (FAIL):** Cho phép client đọc/sửa/xóa tài nguyên chỉ bằng ID trên URL mà không xác thực token sở hữu.
- **CHUẨN (PASS):** Ký số phiên bằng HMAC-SHA256 (JWT). Mọi API nhạy cảm bắt buộc kiểm tra `Authorization: Bearer <token>` và đối chiếu `token.userId === requested.userId`.

### 5. Phòng chống XSS (Cross-Site Scripting)
- **CẤM (FAIL):** Sử dụng `innerHTML` hoặc v-html trực tiếp với nội dung từ email, comment, bài viết của người khác.
- **CHUẨN (PASS):**
  - Dùng `textContent` cho plain text.
  - Sử dụng bộ lọc DOMParser / DOMPurify bóc sạch thẻ `<script>`, `<iframe>`, `<object>` và mọi thuộc tính bắt đầu bằng `on*` (`onload`, `onerror`, `onclick`).

### 6. Phòng chống CSRF & Clickjacking
- **CẤM (FAIL):** Mở `Access-Control-Allow-Origin: *` cho các endpoint thay đổi trạng thái kèm cookie session mà không có token.
- **CHUẨN (PASS):** Sử dụng Authorization header hoặc CSRF tokens. Thiết lập `X-Frame-Options: DENY` để chống nhúng iframe clickjacking.

### 7. Giới hạn Tần suất (Rate Limiting & Anti-Brute-Force)
- **CẤM (FAIL):** Cho phép gọi endpoint `/api/auth/login` hay `/api/auth/register` không giới hạn.
- **CHUẨN (PASS):** Sliding window rate limiter theo IP (ví dụ: tối đa 15-20 request/phút) để triệt tiêu tấn công dò mật khẩu và DDoS.

### 8. Bảo vệ Dữ liệu Nhạy cảm (Sensitive Data Exposure)
- **CẤM (FAIL):** Băm mật khẩu không có Salt (Rainbow table crack tức thì). Trả về `password_hash` trong API response. Trả về stack trace nội bộ khi có lỗi.
- **CHUẨN (PASS):** Salted SHA-256 hoặc Argon2/Bcrypt. Loại bỏ triệt để các trường nhạy cảm trước khi trả JSON. Log lỗi nội bộ, chỉ trả thông báo chung ra client.

### 9. Tiêu đề Bảo mật HTTP (Security Headers)
- **Bắt buộc có:**
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Content-Security-Policy (CSP)`

### 10. Bảo mật Gói Thư Viện (Dependency Security)
- Chạy `npm audit` thường xuyên.
- Cảnh giác với các gói npm không rõ nguồn gốc hoặc typosquatting.

---

## Lệnh Kiểm Tra Nhanh Trước Khi Deploy
```bash
# Quét tìm secrets lộ trong code
git grep -iE "password|secret|token|api_key" -- ":!node_modules" ":!*.log"

# Kiểm tra .env không bị git theo dõi
git status --ignored

# Audit thư viện
npm audit --audit-level=high
```
