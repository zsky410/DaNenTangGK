import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { ProductForm } from '../../components/ProductForm';
import { useProducts } from '../../hooks/useProducts';
import { SanPhamInsert } from '../../types';

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct } = useProducts();
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = async (data: SanPhamInsert) => {
    try {
      await addProduct(data);
      setFormKey((k) => k + 1);
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thêm được sản phẩm.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <ProductForm key={formKey} mode="add" onSubmit={handleSubmit} />
    </View>
  );
}
