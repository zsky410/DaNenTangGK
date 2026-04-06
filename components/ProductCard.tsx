import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SanPham } from '../types';

export type ProductCardProps = {
  product: SanPham;
  onEdit: () => void;
  onDelete: () => void;
  onImagePress: () => void;
};

function formatVnd(gia: number) {
  return `${Number(gia).toLocaleString('vi-VN')} đ`;
}

export function ProductCard({ product, onEdit, onDelete, onImagePress }: ProductCardProps) {
  const hasImage = Boolean(product.hinhanh?.trim());

  return (
    <View style={styles.card}>
      <Pressable
        onPress={hasImage ? onImagePress : undefined}
        disabled={!hasImage}
        style={({ pressed }) => [styles.imageWrap, pressed && hasImage && styles.imagePressed]}
      >
        {hasImage ? (
          <Image source={{ uri: product.hinhanh! }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={40} color="#94a3b8" />
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.tensp}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{product.loaisp}</Text>
        </View>
        <Text style={styles.price}>{formatVnd(product.gia)}</Text>

        <View style={styles.actions}>
          <Pressable
            onPress={onEdit}
            style={({ pressed }) => [styles.iconBtn, styles.editBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Sửa sản phẩm"
          >
            <Ionicons name="pencil" size={20} color="#1e3a5f" />
          </Pressable>
          <Pressable
            onPress={onDelete}
            style={({ pressed }) => [styles.iconBtn, styles.deleteBtn, pressed && styles.btnPressed]}
            accessibilityRole="button"
            accessibilityLabel="Xóa sản phẩm"
          >
            <Ionicons name="trash-outline" size={20} color="#b91c1c" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageWrap: {
    height: 160,
    width: '100%',
    backgroundColor: '#f1f5f9',
  },
  imagePressed: {
    opacity: 0.92,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  body: {
    padding: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3730a3',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a5f',
    marginBottom: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  editBtn: {
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  deleteBtn: {
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  btnPressed: {
    opacity: 0.85,
  },
});
