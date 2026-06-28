# Deep Research Skill — Hướng dẫn cài đặt cho Claude Code CLI

Skill này biến `/deep-research` thành một **research agent đa tầng**:
fan-out 5 góc tìm kiếm → fetch 15 nguồn → xác minh adversarial 3 phiếu / claim → tổng hợp báo cáo có trích dẫn.

---

## Yêu cầu

| Yêu cầu | Chi tiết |
|---|---|
| Claude Code CLI | >= 1.0 (có hỗ trợ Workflow + Skill) |
| Model | Bất kỳ Claude model nào có Workflow support |
| Tools cần thiết | `WebSearch`, `WebFetch` (bật trong settings) |

---

## Cài đặt

### Bước 1 — Copy thư mục skill

Copy toàn bộ thư mục `deep-research/` vào thư mục skills của Claude Code:

**Windows:**
```
%USERPROFILE%\.claude\skills\deep-research\
```

**macOS / Linux:**
```
~/.claude/skills/deep-research/
```

Kết quả cây thư mục sau khi cài:
```
.claude/
└── skills/
    └── deep-research/
        ├── SKILL.md        ← instructions cho Claude
        ├── workflow.js     ← workflow script
        └── README.md       ← file này
```

### Bước 2 — Không cần config thêm

Skill tự động được Claude Code nhận diện qua `SKILL.md`. Không cần sửa `settings.json`.

---

## Cách dùng

### Gọi trực tiếp với câu hỏi rõ ràng
```
/deep-research So sánh Playwright vs Puppeteer cho web scraping năm 2026
```

### Gọi không có args — Claude sẽ hỏi lại
```
/deep-research
```
Claude sẽ hỏi 2-3 câu làm rõ nếu chủ đề chưa đủ cụ thể.

### Ví dụ câu hỏi tốt
```
/deep-research Chi phí thực tế khi self-host LLM (Llama 3, Mistral) so với dùng API Claude/GPT-4 cho startup 10 người
/deep-research Cách bypass Cloudflare Turnstile bằng Playwright năm 2026 — có giải pháp nào không bị fingerprint?
/deep-research Firebase Realtime Database vs Firestore: khi nào dùng cái nào, benchmark đọc/ghi 2025-2026
```

---

## Kiến trúc workflow

```
/deep-research "<câu hỏi>"
       │
       ▼
 [Phase: Scope]
  1 agent phân tích câu hỏi → 5 góc tìm kiếm
       │
       ▼
 [Phase: Search]  ← 5 agents chạy song song
  WebSearch theo từng góc → 4-6 URLs mỗi góc
       │
       ▼ (dedup URLs, giữ tối đa 15)
 [Phase: Fetch]   ← tối đa 15 agents song song
  WebFetch từng URL → trích 2-5 claim có thể kiểm chứng
       │
       ▼ (rank theo importance + source quality, lấy top 25)
 [Phase: Verify]  ← mỗi claim: 3 verifier độc lập
  Adversarial: mỗi verifier cố BÁC BỎ claim
  Ngưỡng: ≥2/3 bác bỏ → claim bị loại
       │
       ▼
 [Phase: Synthesize]
  1 agent merge semantic dupes, viết báo cáo có trích dẫn
       │
       ▼
  Báo cáo cuối + stats
```

**Số lượng agent tối đa:**
```
1 (scope) + 5 (search) + 15 (fetch) + 25×3 (verify) + 1 (synthesize) = ~97 agents
```

---

## Output mẫu

```
## Kết quả nghiên cứu: <câu hỏi>

### Tóm tắt
[3-5 câu trả lời trực tiếp câu hỏi]

### Các phát hiện chính
- **[HIGH]** Claim đã được xác minh...
  - Nguồn: example.com (primary)
  - Bằng chứng: ...

### Cảnh báo & hạn chế
[Điều chưa chắc chắn, nguồn yếu, time-sensitivity]

### Câu hỏi mở
- ...

### Thống kê
- Góc tìm kiếm: 5
- Nguồn fetch: 12
- Claims trích xuất: 38
- Claims xác minh: 25 (confirmed: 11, bị bác: 14)
```

---

## Tuỳ chỉnh

Mở `workflow.js` và chỉnh các hằng số ở đầu file:

```js
const VOTES_PER_CLAIM      = 3   // tăng → chặt hơn, tốn hơn
const REFUTATIONS_REQUIRED = 2   // ngưỡng bác bỏ (< VOTES_PER_CLAIM)
const MAX_FETCH            = 15  // số nguồn tối đa
const MAX_VERIFY_CLAIMS    = 25  // số claim đưa vào verify
```

**Chế độ nhanh** (ít tốn token hơn):
```js
const VOTES_PER_CLAIM      = 1
const REFUTATIONS_REQUIRED = 1
const MAX_FETCH            = 8
const MAX_VERIFY_CLAIMS    = 10
```

**Chế độ kỹ** (độ tin cậy cao hơn):
```js
const VOTES_PER_CLAIM      = 5
const REFUTATIONS_REQUIRED = 3
const MAX_FETCH            = 20
const MAX_VERIFY_CLAIMS    = 40
```

---

## Troubleshooting

| Vấn đề | Nguyên nhân | Giải pháp |
|---|---|---|
| "No research question provided" | Gọi workflow trực tiếp không qua skill | Dùng `/deep-research <câu hỏi>` |
| "All claims refuted" | Câu hỏi về chủ đề thay đổi nhanh, nguồn cũ | Thêm "năm 2026" vào câu hỏi |
| Workflow bị timeout | Quá nhiều claims / nguồn | Giảm `MAX_FETCH` và `MAX_VERIFY_CLAIMS` |
| Fetch failed nhiều | Site có Cloudflare / paywall | Bình thường, workflow tự bỏ qua |
| Skill không xuất hiện | Copy nhầm đường dẫn | Kiểm tra thư mục có đúng `SKILL.md` không |

---

## Cấu trúc file

```
deep-research/
├── SKILL.md      — trigger conditions + hướng dẫn cho Claude khi /deep-research được gọi
├── workflow.js   — workflow script: toàn bộ logic 5 pha
└── README.md     — file này
```

---

## Tác giả & nguồn gốc

Skill này được trích xuất từ built-in `deep-research` workflow của Claude Code CLI,
dựa trên kiến trúc bughunter với WebSearch/WebFetch thay vì git/grep.

Tương thích: Claude Code CLI trên Windows, macOS, Linux.
