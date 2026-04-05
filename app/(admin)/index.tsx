import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ImageViewer } from '../../components/ImageViewer';
import { ProductCard } from '../../components/ProductCard';
import { SearchFilterBar } from '../../components/SearchFilterBar';
import { useProducts } from '../../hooks/useProducts';
import { SanPham } from '../../types';

export default function ProductsScreen() {
  const router = useRouter();
  const { products, loading, error, fetchProducts, deleteProduct } = useProducts();
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useFocusEffect(
    useCallback(() => {
      void fetchProducts();
    }, [fetchProducts]),
  );

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return products.filter((p) => {
      const matchName = !q || p.tensp.toLowerCase().includes(q);
      const matchCat = selectedCategory === null || p.loaisp === selectedCategory;
      return matchName && matchCat;
    });
  }, [products, searchText, selectedCategory]);

  const confirmDelete = (p: SanPham) => {
    Alert.alert('Xóa sản phẩm', `Xóa "${p.tensp}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProduct(p.idsanpham);
          } catch {
            Alert.alert('Lỗi', 'Không xóa được sản phẩm.');
          }
        },
      },
    ]);
  };

  const openViewer = (uri: string) => {
    setViewerUri(uri);
    setViewerOpen(true);
  };

  if (loading && products.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const emptyMessage = loading
    ? 'Đang tải...'
    : products.length === 0
      ? 'Chưa có sản phẩm nào.'
      : 'Không có sản phẩm phù hợp.';

  return (
    <View style={styles.screen}>
      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void fetchProducts()}>
            <Text style={styles.retryLabel}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.idsanpham}
        ListHeaderComponent={
          <SearchFilterBar
            searchText={searchText}
            onSearchChange={setSearchText}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onEdit={() => router.push(`/(admin)/edit/${item.idsanpham}`)}
            onDelete={() => confirmDelete(item)}
            onImagePress={() => item.hinhanh && openViewer(item.hinhanh)}
          />
        )}
        contentContainerStyle={filtered.length === 0 ? styles.listEmptyGrow : styles.listPad}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{emptyMessage}</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={loading && products.length > 0}
            onRefresh={() => void fetchProducts()}
          />
        }
      />
      <ImageViewer uri={viewerUri} visible={viewerOpen} onClose={() => setViewerOpen(false)} />
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
  },
  errorBanner: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fef2f2',
    gap: 8,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
  },
  retryBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  retryLabel: {
    color: '#b91c1c',
    fontSize: 14,
    fontWeight: '600',
  },
  listPad: {
    paddingBottom: 24,
  },
  listEmptyGrow: {
    flexGrow: 1,
  },
  emptyWrap: {
    flex: 1,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 16,
    textAlign: 'center',
  },
});
