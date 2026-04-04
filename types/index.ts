export interface SanPham {
  idsanpham: string;
  tensp: string;
  loaisp: string;
  gia: number;
  hinhanh: string | null;
}

export type SanPhamInsert = Omit<SanPham, 'idsanpham'>;
export type SanPhamUpdate = Partial<SanPhamInsert>;
