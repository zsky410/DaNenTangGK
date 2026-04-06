import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SanPham } from '../types';

const THUMB_WIDTH = 96;
const THUMB_MIN_HEIGHT = 88;

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
        style={({ pressed }) => [styles.thumbPressable, pressed && hasImage && styles.thumbPressed]}
        accessibilityRole={hasImage ? 'button' : undefined}
        accessibilityLabel={hasImage ? 'Xem ảnh sản phẩm' : undefined}
      >
        {hasImage ? (
          <Image source={{ uri: product.hinhanh! }} style={styles.thumbImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="image-outline" size={28} color="#94a3b8" />
          </View>
        )}
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {product.tensp}
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {product.loaisp}
          </Text>
        </View>

        <View style={styles.footerRow}>
          <Text style={styles.price} numberOfLines={1}>
            {formatVnd(product.gia)}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onEdit}
              style={({ pressed }) => [styles.actionBtn, styles.editBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Sửa sản phẩm"
            >
              <Ionicons name="pencil" size={17} color="#1e3a5f" />
            </Pressable>
            <Pressable
              onPress={onDelete}
              style={({ pressed }) => [styles.actionBtn, styles.deleteBtn, pressed && styles.btnPressed]}
              accessibilityRole="button"
              accessibilityLabel="Xóa sản phẩm"
            >
              <Ionicons name="trash-outline" size={17} color="#b91c1c" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  /** Cột ảnh cố định chiều ngang, kéo cao theo nội dung bên phải */
  thumbPressable: {
    width: THUMB_WIDTH,
    minHeight: THUMB_MIN_HEIGHT,
    alignSelf: 'stretch',
    backgroundColor: '#f1f5f9',
  },
  thumbPressed: {
    opacity: 0.88,
  },
  thumbImage: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    flex: 1,
    minHeight: THUMB_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e2e8f0',
  },
  body: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 12,
    paddingLeft: 12,
    justifyContent: 'center',
    minHeight: THUMB_MIN_HEIGHT,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 20,
    marginBottom: 4,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 6,
    maxWidth: '100%',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3730a3',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 'auto',
  },
  price: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#1e3a5f',
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
    flexShrink: 0,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
