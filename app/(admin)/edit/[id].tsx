import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import { ProductForm } from '../../../components/ProductForm';
import { useProducts } from '../../../hooks/useProducts';
import { supabase } from '../../../lib/supabase';
import { SanPham, SanPhamInsert } from '../../../types';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateProduct } = useProducts();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('sanpham').select('*').eq('idsanpham', id).single();
      if (cancelled) return;
      if (error || !data) {
        setProduct(null);
      } else {
        setProduct(data as SanPham);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (data: SanPhamInsert) => {
    if (!id || typeof id !== 'string') return;
    try {
      await updateProduct(id, data);
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không cập nhật được sản phẩm.');
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>Không tìm thấy sản phẩm.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ProductForm mode="edit" initialData={product} onSubmit={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    padding: 24,
  },
  muted: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
});
