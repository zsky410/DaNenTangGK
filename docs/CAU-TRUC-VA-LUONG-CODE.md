# Cấu trúc dự án & luồng code (Expo + Supabase)

Tài liệu này mô tả **cấu hình Supabase**, **logic Auth / CRUD / Storage**, **cấu trúc thư mục**, **ý nghĩa từng file**, **luồng xử lý** theo màn hình và **vị trí code chính** trong app quản lý sản phẩm.

---

## 1. Công nghệ & vai trò từng phần

| Thành phần | Vai trò trong project |
|------------|------------------------|
| **Expo (~54)** | Build/run app React Native, plugin image picker, cấu hình `app.json` |
| **expo-router** | Định tuyến theo file trong `app/`; `package.json` → `"main": "expo-router/entry"` |
| **Supabase JS** | Auth (email/password), truy vấn bảng Postgres `sanpham`, Storage bucket `product-images` |
| **AsyncStorage** | Lưu session đăng nhập (cấu hình trong `lib/supabase.ts`) |
| **expo-image-picker** | Chọn ảnh từ thư viện khi thêm/sửa sản phẩm |
| **expo-file-system** | Đọc file ảnh thành `ArrayBuffer` để upload lên Storage |

Cấu hình môi trường: file **`.env`** (không commit) — biến `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Schema DB và Storage: **`docs/database-setup.md`**.

---

## 2. Cấu hình Supabase trong code

### 2.1 Client — `lib/supabase.ts`

**Đây là nơi duy nhất** gọi `createClient` của `@supabase/supabase-js`:

- Đọc `process.env.EXPO_PUBLIC_SUPABASE_URL` và `process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY` (Expo đưa các biến `EXPO_PUBLIC_*` vào bundle lúc build/start).
- Đối số thứ ba của `createClient`: `{ auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false } }`
  - **AsyncStorage**: lưu session / refresh token trên thiết bị.
  - **detectSessionInUrl: false**: phù hợp app native, không xử lý redirect OAuth trên URL như web.

Mọi file khác chỉ `import { supabase } from '.../lib/supabase'` — không tạo client thứ hai.

### 2.2 Biến môi trường — `.env` / `.env.example`

| Biến | Vai trò |
|------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | URL project Supabase (ví dụ `https://xxxx.supabase.co`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon (public) key — quyền thật sự do **RLS** và **Storage policies** trên server quyết định |

Lấy giá trị từ Dashboard → **Settings → API**. Dùng `.env.example` làm mẫu tên biến; không commit file `.env`.

### 2.3 Package — `package.json`

Dependency `@supabase/supabase-js` khai báo phiên bản SDK; **không** chứa URL hay key.

### 2.4 Chuỗi tài nguyên cố định (phải khớp Supabase Dashboard)

Các giá trị sau **không** nằm trong `supabase.ts` mà được ghi trực tiếp trong hook/component. Đổi tên bảng/bucket hoặc URL public trên project thì phải sửa đồng bộ:

| Tài nguyên | Giá trị trong code | File |
|------------|-------------------|------|
| Bảng Postgres | `'sanpham'` | `hooks/useProducts.ts`, `app/(admin)/edit/[id].tsx` |
| Bucket Storage | `'product-images'` | `hooks/useProducts.ts`, `components/ProductForm.tsx` |
| Đoạn path trong URL public bucket | `'/object/public/product-images/'` (dùng parse → path object) | `lib/storagePaths.ts` |

---

## 3. Logic Auth (xác thực Supabase)

| Hành động | API | File |
|-----------|-----|------|
| Đọc session khi mở app | `supabase.auth.getSession()` | `app/_layout.tsx` (chờ `ready`), `app/index.tsx` (điều hướng lần đầu) |
| Theo dõi đăng nhập / đăng xuất | `supabase.auth.onAuthStateChange(callback)` | `app/_layout.tsx` — `SIGNED_IN` → `router.replace('/(admin)')`, `SIGNED_OUT` → `router.replace('/(auth)/login')` |
| Đăng nhập email + mật khẩu | `supabase.auth.signInWithPassword({ email, password })` | `app/(auth)/login.tsx` |
| Đăng xuất | `supabase.auth.signOut()` | `components/SignOutButton.tsx` |

Thông báo lỗi đăng nhập được map qua `friendlyRequestError` trong `lib/networkMessage.ts`. Sau khi đăng nhập, client tự đính kèm JWT cho các request tới Postgres và Storage (nếu policy yêu cầu user đã xác thực).

---

## 4. Logic CRUD & lưu dữ liệu lên Supabase

### 4.1 Postgres — bảng `sanpham`

Thao tác qua **PostgREST** (chuỗi `supabase.from('sanpham')...`). **Tập trung tại `hooks/useProducts.ts`**, ngoại trừ đọc một dòng ở màn sửa.

| Thao tác | Code (khái niệm) | Hàm / nơi gọi |
|----------|------------------|----------------|
| **Read danh sách** | `.select('*').order('tensp', { ascending: true })` | `fetchProducts()` |
| **Read một dòng** | `.select('*').eq('idsanpham', id).single()` | `load()` trong `app/(admin)/edit/[id].tsx` |
| **Create** | `.insert(product)` — `product` kiểu `SanPhamInsert` | `addProduct()` → sau đó `fetchProducts()` |
| **Update** | `.update(updates).eq('idsanpham', id)` | `updateProduct()` → sau đó `fetchProducts()` |
| **Delete** | ① `.select('hinhanh').eq(...).maybeSingle()` ② `.delete().eq(...)` ③ nếu có path hợp lệ thì `storage.remove` (mục 4.2) | `deleteProduct()` |

Dữ liệu lưu trên Postgres là **metadata sản phẩm**; cột `hinhanh` chỉ lưu **chuỗi URL** (public) trỏ tới file trong Storage, không lưu file nhị phân trong bảng.

### 4.2 Storage — bucket `product-images`

| Bước | API Supabase | File |
|------|----------------|------|
| Upload file | `.storage.from('product-images').upload(fileName, arrayBuffer, { contentType, upsert: false })` | `components/ProductForm.tsx` — ảnh đọc từ máy qua `expo-file-system` → `ArrayBuffer` |
| Lấy URL để ghi vào DB | `.storage.from('product-images').getPublicUrl(fileName)` → `publicUrl` gán vào `hinhanh` | Cùng `ProductForm.tsx` |
| Xóa file khi xóa sản phẩm | `pathInProductImagesBucket(url)` rồi `.storage.from('product-images').remove([path])` | `deleteProduct()` trong `useProducts.ts` |

**Luồng lưu đầy đủ** (thêm / sửa có đổi ảnh): upload Storage → nhận `publicUrl` → `insert` hoặc `update` bảng `sanpham` với `hinhanh = publicUrl`. **Sửa không đổi ảnh**: không gọi `upload`, giữ URL cũ trong state form (`savedImageUrl`).

### 4.3 Tóm tắt: chức năng → file chứa logic Supabase

| Việc | File |
|------|------|
| Khởi tạo client + auth storage | `lib/supabase.ts` |
| Session / điều hướng theo auth | `app/_layout.tsx`, `app/index.tsx` |
| Đăng nhập | `app/(auth)/login.tsx` |
| Đăng xuất | `components/SignOutButton.tsx` |
| CRUD bảng (hook) | `hooks/useProducts.ts` |
| Upload ảnh + payload gửi `insert`/`update` | `components/ProductForm.tsx` |
| Đọc một bản ghi để sửa | `app/(admin)/edit/[id].tsx` |
| URL public → path xóa object | `lib/storagePaths.ts` |
| Thông báo lỗi thân thiện | `lib/networkMessage.ts` |

Chi tiết **luồng theo từng màn hình** (refresh, filter, v.v.) nằm ở **mục 8** bên dưới.

---

## 5. Cây thư mục mã nguồn (bỏ qua `node_modules`, `.git`)

```
my-app/
├── app/                      # Màn hình & layout (Expo Router)
│   ├── _layout.tsx           # Root: session + Stack + lắng nghe auth
│   ├── index.tsx             # Điều hướng lần đầu: admin vs login
│   ├── (auth)/               # Nhóm route đăng nhập
│   │   ├── _layout.tsx       # Stack có header
│   │   └── login.tsx         # Màn đăng nhập
│   └── (admin)/              # Nhóm sau đăng nhập
│       ├── _layout.tsx       # Tabs: Sản phẩm / Thêm / Thống kê + ẩn tab Sửa
│       ├── index.tsx         # Danh sách sản phẩm
│       ├── add.tsx           # Thêm sản phẩm
│       ├── stats.tsx         # Thống kê
│       └── edit/
│           └── [id].tsx      # Sửa sản phẩm (dynamic route)
├── components/               # UI tái sử dụng
├── hooks/
│   └── useProducts.ts        # Logic CRUD + fetch danh sách (Supabase)
├── lib/
│   ├── supabase.ts           # Khởi tạo Supabase client
│   ├── networkMessage.ts     # Chuẩn hóa thông báo lỗi cho người dùng
│   └── storagePaths.ts       # Parse URL public → path trong bucket (khi xóa file)
├── constants/
│   └── categories.ts         # Danh sách loại sản phẩm cố định
├── types/
│   └── index.ts              # TypeScript: SanPham, SanPhamInsert, SanPhamUpdate
├── docs/
│   ├── database-setup.md     # Hướng dẫn SQL + Storage trên Supabase
│   └── CAU-TRUC-VA-LUONG-CODE.md   # File này
├── assets/                   # Icon, splash (theo app.json)
├── app.json                  # Cấu hình Expo (plugins, scheme, quyền ảnh)
├── package.json
├── tsconfig.json
└── README.md
```

---

## 6. Ý nghĩa từng thư mục

| Thư mục | Ý nghĩa |
|---------|---------|
| **`app/`** | Toàn bộ **route** và **màn hình**. Tên file = đường dẫn URL; nhóm `(auth)`, `(admin)` là **route groups** (không xuất hiện trong URL) nhưng tổ chức layout riêng. |
| **`components/`** | Component React không gắn trực tiếp với một route; được import từ các màn trong `app/`. |
| **`hooks/`** | Custom hooks chứa logic có state / side effect dùng chữa nhiều màn (ở đây chủ yếu `useProducts`). |
| **`lib/`** | Client bên thứ ba, helper thuần (không UI): Supabase, message, path storage. |
| **`constants/`** | Hằng số dùng chung (danh mục loại SP). |
| **`types/`** | Định nghĩa kiểu dữ liệu domain (sản phẩm). |
| **`docs/`** | Tài liệu kỹ thuật (DB, kiến trúc). |
| **`assets/`** | Tài nguyên tĩnh cho build Expo. |

---

## 7. Từng file nguồn — vai trò ngắn gọn

### Gốc & cấu hình

| File | Vai trò |
|------|---------|
| `package.json` | Dependencies, script `expo start`, entry `expo-router/entry`. |
| `app.json` | Tên app, splash, icon, plugin `expo-router` & `expo-image-picker`, deep link `scheme`. |
| `tsconfig.json` | Cấu hình TypeScript cho project. |

### `app/`

| File | Vai trò |
|------|---------|
| `_layout.tsx` | **Root layout**: chờ `getSession()`, render `Stack` (index, auth, admin); `onAuthStateChange` → `replace` `/(admin)` hoặc `/(auth)/login`. |
| `index.tsx` | **Splash routing**: một lần `getSession` → điều hướng tương ứng (tránh user đứng ở root). |
| `(auth)/_layout.tsx` | Stack cho nhóm auth; header bật, title màn login. |
| `(auth)/login.tsx` | Form email/password, `signInWithPassword`, hiển thị lỗi qua `friendlyRequestError`. |
| `(admin)/_layout.tsx` | **Tabs**: 3 tab hiển thị + màn `edit/[id]` với `href: null` (chỉ push stack, không có tab riêng); `headerRight` = `SignOutButton`. |
| `(admin)/index.tsx` | **Danh sách**: `useProducts`, lọc tìm/loại, `FlatList`, xóa/sửa/xem ảnh. |
| `(admin)/add.tsx` | **Thêm**: `ProductForm` + `addProduct` + `router.back()`. |
| `(admin)/stats.tsx` | **Thống kê**: cùng `fetchProducts`, tính toán trên mảng `products` (client-side). |
| `(admin)/edit/[id].tsx` | **Sửa**: đọc `id` từ URL, `select` một dòng `sanpham`, `ProductForm` + `updateProduct`. |

### `components/`

| File | Vai trò |
|------|---------|
| `ProductForm.tsx` | Form tên, loại (chip), giá, chọn ảnh; upload Storage nếu có ảnh mới; gọi `onSubmit` với `SanPhamInsert`. |
| `ProductCard.tsx` | Card một sản phẩm: ảnh, tên, loại, giá, nút sửa/xóa, bấm ảnh mở viewer. |
| `SearchFilterBar.tsx` | Ô tìm theo tên + chip lọc loại (gồm "Tất cả"). |
| `ImageViewer.tsx` | `Modal` toàn màn hình xem ảnh, nút đóng. |
| `SignOutButton.tsx` | `supabase.auth.signOut()`. |

### `hooks/`, `lib/`, `constants/`, `types/`

| File | Vai trò |
|------|---------|
| `hooks/useProducts.ts` | `fetchProducts`, `addProduct`, `updateProduct`, `deleteProduct`; state `products`, `loading`, `error`. |
| `lib/supabase.ts` | `createClient` + auth storage AsyncStorage. |
| `lib/networkMessage.ts` | Hàm `friendlyRequestError(message)` — map lỗi kỹ thuật → tiếng Việt. |
| `lib/storagePaths.ts` | `pathInProductImagesBucket(url)` — lấy path object để `storage.remove` khi xóa SP. |
| `constants/categories.ts` | `LOAI_SAN_PHAM` — danh sách loại dùng ở form và filter. |
| `types/index.ts` | `SanPham`, `SanPhamInsert`, `SanPhamUpdate`. |

---

## 8. Luồng code theo chức năng

### 8.1 Khởi động app & phiên đăng nhập

1. **`app/_layout.tsx`**
   - `useEffect`: `supabase.auth.getSession()` → `setReady(true)`.
   - Khi `ready`: đăng ký `supabase.auth.onAuthStateChange`.
   - `SIGNED_IN` → `router.replace('/(admin)')`.
   - `SIGNED_OUT` → `router.replace('/(auth)/login')`.
2. **`app/index.tsx`**
   - Song song: khi vào route `index`, `getSession` một lần và `replace` tới admin hoặc login.
3. **Code chính**: `app/_layout.tsx`, `app/index.tsx`, `lib/supabase.ts`.

---

### 8.2 Đăng nhập

1. User nhập email/password tại **`app/(auth)/login.tsx`**.
2. `onSubmit` → `supabase.auth.signInWithPassword({ email, password })`.
3. Lỗi: `friendlyRequestError` từ **`lib/networkMessage.ts`**.
4. Thành công: `router.replace('/(admin)')` (và listener trong root cũng có thể điều hướng tương tự).
5. **Code chính**: `app/(auth)/login.tsx`, `lib/supabase.ts`, `lib/networkMessage.ts`.

---

### 8.3 Đăng xuất

1. Header các tab admin: **`components/SignOutButton.tsx`**.
2. `supabase.auth.signOut()` → root `onAuthStateChange` → chuyển về login.
3. **Code chính**: `components/SignOutButton.tsx`, `app/_layout.tsx` (listener).

---

### 8.4 Điều hướng vùng admin (Tabs)

1. **`app/(admin)/_layout.tsx`**: `Tabs` với 3 màn hiện tab + `edit/[id]` ẩn (`href: null`).
2. Từ danh sách: `router.push(\`/(admin)/edit/${id}\`)` mở màn sửa trên cùng navigator tab (stack con tùy expo-router).
3. **Code chính**: `app/(admin)/_layout.tsx`, `app/(admin)/index.tsx` (push edit).

---

### 8.5 Tải & hiển thị danh sách sản phẩm

1. **`hooks/useProducts.ts`** — `fetchProducts`:
   - `supabase.from('sanpham').select('*').order('tensp', { ascending: true })`.
2. **`app/(admin)/index.tsx`**:
   - `useFocusEffect`: mỗi lần focus tab → `fetchProducts()`.
   - `useMemo`: lọc theo `searchText`, `selectedCategory` (state local).
   - `SearchFilterBar` + `FlatList` + `ProductCard`.
3. Pull-to-refresh: `RefreshControl` gọi lại `fetchProducts`.
4. **Code chính**: `hooks/useProducts.ts`, `app/(admin)/index.tsx`, `components/SearchFilterBar.tsx`, `components/ProductCard.tsx`.

---

### 8.6 Thêm sản phẩm

1. **`app/(admin)/add.tsx`**: mount `ProductForm` `mode="add"`.
2. **`components/ProductForm.tsx`** — khi submit:
   - Validate tên, loại (`constants/categories.ts`), giá.
   - Nếu có ảnh mới: đọc file → `supabase.storage.from('product-images').upload(...)` → `getPublicUrl` → URL vào `hinhanh`.
   - `await onSubmit(payload)` với `SanPhamInsert`.
3. **`add.tsx`**: `addProduct(data)` trong **`useProducts`** → `insert` vào `sanpham` → `fetchProducts()` → `router.back()`.
4. **Code chính**: `app/(admin)/add.tsx`, `components/ProductForm.tsx`, `hooks/useProducts.ts` (`addProduct`).

---

### 8.7 Sửa sản phẩm

1. **`app/(admin)/edit/[id].tsx`**:
   - `useLocalSearchParams<{ id: string }>()`.
   - Load: `supabase.from('sanpham').select('*').eq('idsanpham', id).single()` (không dùng list cache).
   - Render `ProductForm` `mode="edit"` + `initialData={product}`.
2. Submit: `updateProduct(id, data)` trong **`useProducts`** → `update(...).eq('idsanpham', id)` → `fetchProducts()` → `router.back()`.
3. Upload ảnh mới: cùng logic trong **`ProductForm.tsx`** như màn thêm.
4. **Code chính**: `app/(admin)/edit/[id].tsx`, `components/ProductForm.tsx`, `hooks/useProducts.ts` (`updateProduct`).

---

### 8.8 Xóa sản phẩm

1. **`app/(admin)/index.tsx`**: `Alert` xác nhận → `deleteProduct(idsanpham)`.
2. **`hooks/useProducts.ts`** — `deleteProduct`:
   - `select('hinhanh')` theo id.
   - `delete` row `sanpham`.
   - Nếu URL thuộc bucket: **`lib/storagePaths.ts`** → `pathInProductImagesBucket` → `storage.from('product-images').remove([path])`.
   - `fetchProducts()`.
3. **Code chính**: `app/(admin)/index.tsx` (`confirmDelete`), `hooks/useProducts.ts` (`deleteProduct`), `lib/storagePaths.ts`.

---

### 8.9 Xem ảnh phóng to

1. **`app/(admin)/index.tsx`**: state `viewerUri`, `viewerOpen`; `ProductCard` `onImagePress` → mở modal.
2. **`components/ImageViewer.tsx`**: `Modal` + `Image` + nút đóng (safe area).
3. **Code chính**: `app/(admin)/index.tsx`, `components/ImageViewer.tsx`, `components/ProductCard.tsx`.

---

### 8.10 Thống kê

1. **`app/(admin)/stats.tsx`**: `useFocusEffect` → `fetchProducts()` (cùng hook với danh sách).
2. `useMemo` trên `products`:
   - Tổng số, tổng giá trị (`reduce` `gia`).
   - Đếm theo `loaisp` (thứ tự ưu tiên `LOAI_SAN_PHAM`).
   - Thanh bar tỉ lệ; sản phẩm giá max/min.
3. **Code chính**: `app/(admin)/stats.tsx`, `hooks/useProducts.ts` (`fetchProducts`), `constants/categories.ts`.

---

## 9. Mô hình dữ liệu (ứng dụng)

Định nghĩa tại **`types/index.ts`**:

- **`SanPham`**: `idsanpham`, `tensp`, `loaisp`, `gia`, `hinhanh` (URL public hoặc `null`).
- **`SanPhamInsert`**: bỏ `idsanpham` (dùng khi insert / payload form).
- **`SanPhamUpdate`**: `Partial<SanPhamInsert>` (dùng khi update).

Bảng Postgres và chính sách Storage cần khớp với app — xem **`docs/database-setup.md`**.

---

## 10. Sơ đồ luồng tổng quan (text)

```
[App mở]
    → _layout: chờ session
    → index: replace → (admin) hoặc (auth)/login

[Đăng nhập] login.tsx → Supabase Auth → (admin)

[(admin) Tabs]
    → index: useProducts.fetchProducts → FlatList + filter
    → add: ProductForm → upload? → addProduct → back
    → stats: fetchProducts → useMemo thống kê
    → edit/[id]: select 1 row → ProductForm → updateProduct → back

[Đăng xuất] SignOutButton → signOut → _layout listener → login
```

---

## 11. Gợi ý khi đọc code lần đầu

1. Đọc **mục 2–4** (config + Auth + CRUD/Storage) rồi **`lib/supabase.ts`**, **`app/_layout.tsx`**.
2. Đọc **`hooks/useProducts.ts`** để nắm CRUD bảng và xóa file Storage.
3. Đọc **`components/ProductForm.tsx`** để hiểu validate + upload ảnh + payload gửi DB.
4. Lần lượt mở **`app/(admin)/index.tsx`**, **`add.tsx`**, **`edit/[id].tsx`**, **`stats.tsx`** để thấy cách màn hình kết nối hook và component (chi tiết luồng UI: **mục 8**).

---

*Tài liệu phản ánh mã nguồn tại thời điểm tạo file. Khi thêm route hoặc feature mới, nên cập nhật mục tương ứng trong file này.*
