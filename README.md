# TOME

Web đọc sách cá nhân: tải PDF/Word lên, đọc ngay trên trình duyệt, nhớ trang đang đọc, theo dõi thời gian đọc và streak mỗi ngày.

## Chạy thử

Cần: Node 20+, Docker.

```bash
npm install                                   # cài cả 2 app (tự chạy prisma generate)
npm run infra:up                              # bật PostgreSQL 18 + Redis
cp apps/api/.env.example apps/api/.env        # nhớ đổi JWT_SECRET
cp apps/web/.env.example apps/web/.env.local
npm run db:migrate                            # tạo bảng (đặt tên migration: init)

npm run dev:api      # http://localhost:3001
npm run dev:web      # http://localhost:3000
```

Mở http://localhost:3000, tạo tài khoản, rồi bấm "Thêm sách" để tải file `.pdf` hoặc `.docx`.

> Nếu máy đã có Postgres chạy ở cổng 5432, đổi `"5432:5432"` trong `docker-compose.yml` (và `DATABASE_URL`).

## Cấu trúc

```
apps/
  api/   NestJS + Prisma + BullMQ
    prisma/schema.prisma      User, Book, ReadingSession
    src/auth/                 đăng ký/đăng nhập, JWT lưu cookie httpOnly, rate limit bằng Redis
    src/books/                upload, danh sách, tải file, tiến độ đọc
    src/books/books.processor worker BullMQ: đếm trang PDF, convert DOCX sang HTML
    src/reading/              ghi phiên đọc, thống kê + streak (cache Redis)
  web/   Next.js (App Router) + Tailwind v4 + Framer Motion + SWR
    app/                      / (thư viện), /login, /read/[id]
    components/PdfReader      react-pdf (pdf.js), phím mũi tên để lật trang
    components/DocxReader     HTML đã convert, chỉnh cỡ chữ + nền sáng/sepia/tối
```

## Luồng upload

1. Web gửi file lên `POST /books` → API kiểm tra đuôi file và magic bytes, lưu vào `apps/api/storage/uploads`, tạo `Book(status=PROCESSING)`.
2. API đẩy job vào hàng đợi `books` (Redis).
3. Worker lấy job: PDF thì đếm trang, DOCX thì convert bằng `mammoth` rồi làm sạch HTML bằng `sanitize-html`. Xong thì `status=READY` (lỗi 3 lần thì `FAILED`).
4. Trang chủ tự hỏi lại API mỗi 2 giây khi còn sách đang xử lý.

## API

| Method | Đường dẫn | Mô tả |
|---|---|---|
| POST | `/auth/register`, `/auth/login`, `/auth/logout` | đặt/xoá cookie `tome_token` |
| GET/PATCH | `/auth/me` | thông tin + mục tiêu đọc mỗi ngày |
| POST/GET | `/books` | upload (field `file`) / danh sách |
| GET/DELETE | `/books/:id` | chi tiết / xoá |
| GET | `/books/:id/file`, `/books/:id/html` | file gốc (có Range) / HTML của DOCX |
| PUT | `/books/:id/progress` | `{ page, percent }` |
| POST | `/sessions` | `{ bookId, seconds, pages, day }` |
| GET | `/stats?today=YYYY-MM-DD` | phút đọc hôm nay, streak, 7 ngày, số sách đã xong |

## Những chỗ nên tự đọc kỹ để học

- **Redis có 3 vai trò**: hàng đợi BullMQ, đếm giới hạn đăng nhập (`auth.controller.ts`), cache thống kê 60 giây và xoá khi có phiên đọc mới (`reading.service.ts`).
- **Streak** tính từ cột `day` (ngày địa phương do client gửi), nên server không cần xử lý múi giờ.
- **Tiến độ DOCX** lưu theo phần trăm cuộn trang, **PDF** lưu theo số trang.
- Cookie đăng nhập là `sameSite=lax`, chạy được vì web và API cùng host `localhost` (khác cổng). Khi deploy lên hai domain khác nhau, cần đặt chung domain cha (vd. `app.` và `api.`) hoặc đổi cách xác thực.

## Chưa làm (gợi ý bước tiếp theo)

- Highlight và ghi chú trong sách, tìm kiếm trong sách (Postgres full-text).
- Ảnh bìa thật từ trang đầu PDF (hiện bìa được sinh tự động theo tên sách).
- Nhắc đọc hằng ngày, lưu file lên S3/R2/MinIO thay vì ổ đĩa, tách worker ra tiến trình riêng, viết test, Dockerfile để deploy.
