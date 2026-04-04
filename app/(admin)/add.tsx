import { useRouter } from 'expo-router';
import { Alert, View } from 'react-native';
import { ProductForm } from '../../components/ProductForm';
import { useProducts } from '../../hooks/useProducts';
import { SanPhamInsert } from '../../types';

export default function AddProductScreen() {
  const router = useRouter();
  const { addProduct } = useProducts();

  const handleSubmit = async (data: SanPhamInsert) => {
    try {
      await addProduct(data);
      router.back();
    } catch {
      Alert.alert('Lỗi', 'Không thêm được sản phẩm.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f1f5f9' }}>
      <ProductForm mode="add" onSubmit={handleSubmit} />
    </View>
  );
}
