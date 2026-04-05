/**
 * Lấy đường dẫn object trong bucket `product-images` từ URL public Supabase Storage.
 * URL không thuộc bucket này → null (bỏ qua xóa file).
 */
export function pathInProductImagesBucket(publicUrl: string | null | undefined): string | null {
  if (!publicUrl?.trim()) return null;
  try {
    const u = new URL(publicUrl.trim());
    const marker = '/object/public/product-images/';
    const idx = u.pathname.indexOf(marker);
    if (idx === -1) return null;
    const path = u.pathname.slice(idx + marker.length);
    if (!path) return null;
    return decodeURIComponent(path);
  } catch {
    return null;
  }
}
