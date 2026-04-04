import { useCallback, useState } from 'react';
import { supabase } from '../lib/supabase';
import { SanPham, SanPhamInsert, SanPhamUpdate } from '../types';

function hasStringMessage(e: unknown): e is { message: string } {
  return (
    e !== null &&
    typeof e === 'object' &&
    'message' in e &&
    typeof (e as { message: unknown }).message === 'string'
  );
}

export function useProducts() {
  const [products, setProducts] = useState<SanPham[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: queryError } = await supabase
        .from('sanpham')
        .select('*')
        .order('tensp', { ascending: true });
      if (queryError) {
        setError(queryError.message);
        setProducts([]);
        return;
      }
      setProducts((data ?? []) as SanPham[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không tải được danh sách sản phẩm.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addProduct = async (product: SanPhamInsert) => {
    try {
      setError(null);
      const { error: insertError } = await supabase.from('sanpham').insert(product);
      if (insertError) {
        setError(insertError.message);
        throw insertError;
      }
      await fetchProducts();
    } catch (e) {
      if (!hasStringMessage(e)) {
        setError('Thêm sản phẩm thất bại.');
      }
      throw e;
    }
  };

  const updateProduct = async (id: string, updates: SanPhamUpdate) => {
    try {
      setError(null);
      const { error: updateError } = await supabase.from('sanpham').update(updates).eq('idsanpham', id);
      if (updateError) {
        setError(updateError.message);
        throw updateError;
      }
      await fetchProducts();
    } catch (e) {
      if (!hasStringMessage(e)) {
        setError('Cập nhật sản phẩm thất bại.');
      }
      throw e;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      setError(null);
      const { error: deleteError } = await supabase.from('sanpham').delete().eq('idsanpham', id);
      if (deleteError) {
        setError(deleteError.message);
        throw deleteError;
      }
      await fetchProducts();
    } catch (e) {
      if (!hasStringMessage(e)) {
        setError('Xóa sản phẩm thất bại.');
      }
      throw e;
    }
  };

  return { products, loading, error, fetchProducts, addProduct, updateProduct, deleteProduct };
}
