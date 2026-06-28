---
name: deep-research
description: >-
  Deep research harness — fan-out web searches, fetch sources, adversarially
  verify claims, synthesize a cited report. Use when the user wants a deep,
  multi-source, fact-checked research report on any topic.
whenToUse: >-
  When the user wants a deep, multi-source, fact-checked research report on
  any topic. BEFORE invoking, check if the question is specific enough to
  research directly — if underspecified (e.g., "what car to buy" without
  budget/use-case/region), ask 2-3 clarifying questions to narrow scope.
  Then pass the refined question as args, weaving the answers in.
---

# Deep Research Skill

Khi `/deep-research` được gọi, thực hiện theo các bước sau:

## Bước 1 — Kiểm tra câu hỏi

Nếu `args` chưa đủ cụ thể (thiếu ngữ cảnh quan trọng như: ngân sách, khu vực, mục đích sử dụng, phiên bản, v.v.), hỏi **2-3 câu làm rõ** trước khi tiếp tục. Mục tiêu là có câu hỏi đủ rõ để các search agents tìm đúng nguồn.

**Ví dụ câu hỏi mơ hồ cần hỏi lại:**
- "mua xe gì tốt" → hỏi ngân sách, mục đích, khu vực
- "AI nào tốt nhất" → hỏi cho task gì, budget, self-host hay SaaS
- "framework nào nên dùng" → hỏi team size, use case, ecosystem hiện tại

## Bước 2 — Chạy workflow

Khi câu hỏi đã đủ rõ, đọc workflow script tại `~/.claude/skills/deep-research/workflow.js` rồi gọi:

```
Workflow({ scriptPath: "<path-to>/skills/deep-research/workflow.js", args: "<câu hỏi đầy đủ>" })
```

Thay `<path-to>` bằng đường dẫn tuyệt đối thực tế đến thư mục `.claude` của người dùng.

## Bước 3 — Trình bày kết quả

Sau khi workflow hoàn thành, format kết quả thành báo cáo dễ đọc:

```markdown
## Kết quả nghiên cứu: <câu hỏi>

### Tóm tắt
<report.summary>

### Các phát hiện chính
Với mỗi finding trong report.findings:
- **[Độ tin cậy: high/medium/low]** <claim>
  - Nguồn: <sources>
  - Bằng chứng: <evidence>

### Cảnh báo & hạn chế
<report.caveats>

### Câu hỏi mở
<report.openQuestions>

### Nguồn đã kiểm tra (<N> nguồn)
Liệt kê sources theo chất lượng (primary → secondary → blog)

### Thống kê
- Góc tìm kiếm: <angles>
- Nguồn fetch: <sourcesFetched>
- Claims trích xuất: <claimsExtracted>
- Claims xác minh: <claimsVerified> (confirmed: <confirmed>, bị bác: <killed>)
```

## Lưu ý quan trọng

- Workflow chạy **5 pha** (Scope → Search → Fetch → Verify → Synthesize) và có thể mất vài phút
- Mỗi claim được kiểm tra bởi **3 verifier độc lập** — cần ≥2/3 bác bỏ mới loại claim
- Nếu workflow bị timeout hoặc skip, vẫn trình bày kết quả partial từ các pha đã hoàn thành
- **Không bịa** — chỉ report những gì workflow trả về, không thêm thông tin từ training data
