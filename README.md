# Quản lý sản phẩm (Expo + Supabase)

App admin: đăng nhập, CRUD sản phẩm, upload ảnh (Storage), thống kê.

## Cần có

- Node.js (LTS)
- Tài khoản [Supabase](https://supabase.com) + project đã tạo bảng `sanpham` và bucket `product-images` (xem `docs/database-setup.md`)

## Cài đặt

```bash
npm install
```

Tạo file `.env` từ `.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

User đăng nhập tạo trong Supabase **Authentication → Users** (không có đăng ký trong app).

## Chạy

```bash
npx expo start
```

- Quét QR bằng Expo Go, hoặc `a` / `i` cho emulator.

## Cấu trúc chính

- `app/` — Expo Router (login, tab admin, sửa SP)
- `components/` — form, card, viewer ảnh, v.v.
- `hooks/useProducts.ts` — gọi Supabase CRUD
- `lib/supabase.ts` — client
- `docs/database-setup.md` — SQL + Storage

## Ghi chú

- `.env` không commit; chỉ commit `.env.example`.
- Ảnh upload lên bucket `product-images` khi **lưu** sản phẩm (không upload khi mới chọn ảnh).
