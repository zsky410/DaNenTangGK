# Supabase — Database & Storage (Task 02)

Tài liệu mô tả cấu hình đã áp dụng cho project (bảng `sanpham`, RLS, Storage).

## 1. Bảng `sanpham`

Chạy trong **SQL Editor** (hoặc migration) trên Supabase:

```sql
CREATE TABLE IF NOT EXISTS sanpham (
  idsanpham UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tensp TEXT NOT NULL,
  loaisp TEXT NOT NULL,
  gia NUMERIC NOT NULL,
  hinhanh TEXT
);
```

## 2. Row Level Security (RLS)

```sql
ALTER TABLE sanpham ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated users" ON sanpham;
CREATE POLICY "Allow all for authenticated users"
ON sanpham FOR ALL TO authenticated
USING (true) WITH CHECK (true);
```

- Chỉ user **đã đăng nhập** (`authenticated`) mới CRUD được bảng `sanpham`.

## 3. Storage — bucket `product-images` (Public)

Tạo bucket public để lưu ảnh sản phẩm; cột `hinhanh` trong DB lưu **public URL**.

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
```

### Policy trên `storage.objects`

```sql
DROP POLICY IF EXISTS "Public read product-images" ON storage.objects;
CREATE POLICY "Public read product-images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated insert product-images" ON storage.objects;
CREATE POLICY "Authenticated insert product-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated update product-images" ON storage.objects;
CREATE POLICY "Authenticated update product-images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated delete product-images" ON storage.objects;
CREATE POLICY "Authenticated delete product-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images');
```

- **Đọc file:** public (ai cũng xem được URL public).
- **Ghi/sửa/xóa file:** chỉ `authenticated`.

## 4. Kiểm tra trên Dashboard

1. **Table Editor:** có bảng `sanpham`, các cột `idsanpham`, `tensp`, `loaisp`, `gia`, `hinhanh`.
2. **Authentication → Policies** (hoặc Table → RLS): policy trên `sanpham` như trên.
3. **Storage:** bucket `product-images`, bật **Public bucket**.

## 5. Ảnh màn hình (nộp bài)

Theo yêu cầu đề bài, nên chụp và lưu trong repo (ví dụ `docs/screenshots/`):

- [ ] Table Editor — bảng `sanpham`
- [ ] Storage — bucket `product-images` (public)

*(Checklist ảnh: thêm file ảnh thủ công sau khi chụp.)*
