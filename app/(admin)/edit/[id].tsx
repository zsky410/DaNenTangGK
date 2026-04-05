import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { ProductForm } from '../../../components/ProductForm';
import { useProducts } from '../../../hooks/useProducts';
import { friendlyRequestError } from '../../../lib/networkMessage';
import { supabase } from '../../../lib/supabase';
import { SanPham, SanPhamInsert } from '../../../types';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { updateProduct } = useProducts();
  const [product, setProduct] = useState<SanPham | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || typeof id !== 'string') {
      setLoading(false);
      setLoadError(null);
      setProduct(null);
      return;
    }
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from('sanpham').select('*').eq('idsanpham', id).single();
    if (error) {
      setLoadError(friendlyRequestError(error.message));
      setProduct(null);
    } else if (!data) {
      setProduct(null);
    } else {
      setProduct(data as SanPham);
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

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

  if (loadError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.muted}>{loadError}</Text>
        <Pressable style={styles.retryBtn} onPress={() => void load()}>
          <Text style={styles.retryLabel}>Thử lại</Text>
        </Pressable>
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
    gap: 16,
  },
  muted: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  retryLabel: {
    color: '#1e3a5f',
    fontSize: 15,
    fontWeight: '600',
  },
});
