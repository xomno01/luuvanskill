# WORKING DISCIPLINE — 11 nguyên tắc làm việc

> Bản backup của block đã chèn vào `CLAUDE.md` (mục NGUYÊN TẮC LÀM VIỆC).
> Trên máy mới: copy block dưới đây vào `CLAUDE.md` của project, ngay sau mục CORE PRINCIPLES.
> Rút từ bộ agent-skills, lọc cho dev solo — bỏ nghi thức team.

```markdown
## NGUYÊN TẮC LÀM VIỆC (WORKING DISCIPLINE)
Áp dụng cho MỌI tag/persona. Rút từ bộ agent-skills, lọc cho dev solo — bỏ nghi thức team.
1. **Nêu giả định + độ tự tin trước khi code:** Phát biểu 1 câu hiểu yêu cầu kèm % tự tin. Nếu đoán được phản ứng của anh cho 3 câu hỏi tiếp theo thì dừng hỏi, làm luôn; nếu không, hỏi từng câu một (kèm phương án phỏng đoán sẵn để anh gật/sửa).
2. **Scope discipline:** Chỉ đụng đúng cái task yêu cầu. KHÔNG tự refactor/đổi tên/dọn dẹp ngoài phạm vi. Khi cách làm của anh có vấn đề rõ ràng → push back thẳng, KHÔNG nịnh (sycophancy là lỗi).
3. **Risk-First:** Với feature nhiều mảnh, làm mẩu RỦI RO / chưa chắc khả thi nhất TRƯỚC (spike chạy được), rồi mới làm phần dễ. Cắt lát dọc end-to-end, test ngay từng lát.
4. **Verify nguồn API bên thứ 3:** Khi dùng/sửa code gọi SDK ngoài (Firebase, Playwright, Telegram, mail.tm, SMM, Electron Builder, OpenAI/Anthropic) → chốt version rồi tra doc thật, KHÔNG code theo trí nhớ. Không chắc thì nói "cần verify" thay vì bịa method/param. (skill `/source-driven`)
5. **Bug = Prove-It:** Viết test tái hiện đúng bug TRƯỚC khi sửa, sửa cho xanh, giữ test làm regression. Unit test cho lõi logic thuần (parse OTP, công thức balance game). Không ép TDD cho code I/O nặng / UI / anti-bot.
6. **Validate dữ liệu vào:** Response của API/scrape bên ngoài là dữ liệu KHÔNG tin được — validate trước khi dùng để 1 JSON dị dạng không làm sập cả worker pool.
7. **Save Point:** Commit nhỏ TRƯỚC khi cho AI đụng tiếp; hỏng thì `git reset --hard` về điểm cũ. Báo rõ mục "KHÔNG đụng tới: ..." để chặn sửa lan man.
8. **Refactor an toàn:** Nếu phải sửa test mới pass = đang ĐỔI hành vi chứ không phải đơn giản hóa → revert. Giữ hành vi, chỉ giảm độ phức tạp.
9. **Secrets:** Key (amp-...), token Telegram/SMM, cookie Hotmail → vào `.env` + `.gitignore`, không hardcode, rotate khi lộ. Log phải mask, không in token/cookie.
10. **Quan sát được:** AM Proxy & bot chạy song song → log JSON có cấu trúc + correlation ID (account_id/request_id) xuyên suốt để grep 1 phát ra ca lỗi. (skill `/trace-log`)
11. **Ghi quyết định (ADR-lite):** Sau bug khó hoặc chốt kiến trúc, ghi 3 dòng vào MEMORY: *quyết định gì / đã loại phương án nào / giới hạn-hậu quả*. Không dựng tài liệu formal.
```
