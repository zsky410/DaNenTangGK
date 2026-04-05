import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LOAI_SAN_PHAM } from '../../constants/categories';
import { useProducts } from '../../hooks/useProducts';
import { SanPham } from '../../types';

function formatVnd(n: number) {
  return `${Number(n).toLocaleString('vi-VN')} đ`;
}

export default function StatsTab() {
  const { products, loading, error, fetchProducts } = useProducts();

  useFocusEffect(
    useCallback(() => {
      void fetchProducts();
    }, [fetchProducts]),
  );

  const { total, sumValue, countsByLoai, maxCount, maxProduct, minProduct } = useMemo(() => {
    const totalN = products.length;
    const sum = products.reduce((s, p) => s + Number(p.gia), 0);

    const map = new Map<string, number>();
    products.forEach((p) => {
      map.set(p.loaisp, (map.get(p.loaisp) ?? 0) + 1);
    });
    const orderedLoai = [
      ...LOAI_SAN_PHAM.filter((l) => map.has(l)),
      ...[...map.keys()].filter((k) => !LOAI_SAN_PHAM.includes(k)),
    ];
    const countsByLoai = orderedLoai.map((loai) => ({ loai, count: map.get(loai) ?? 0 }));
    const maxCount = Math.max(1, ...countsByLoai.map((c) => c.count));

    let maxP: SanPham | null = null;
    let minP: SanPham | null = null;
    if (products.length > 0) {
      maxP = products.reduce((a, b) => (Number(b.gia) > Number(a.gia) ? b : a));
      minP = products.reduce((a, b) => (Number(b.gia) < Number(a.gia) ? b : a));
    }

    return {
      total: totalN,
      sumValue: sum,
      countsByLoai,
      maxCount,
      maxProduct: maxP,
      minProduct: minP,
    };
  }, [products]);

  if (loading && products.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={loading && products.length > 0} onRefresh={() => void fetchProducts()} />
      }
    >
      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={() => void fetchProducts()}>
            <Text style={styles.retryLabel}>Thử lại</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.row}>
        <View style={[styles.card, styles.cardHalf]}>
          <Text style={styles.cardLabel}>Tổng sản phẩm</Text>
          <Text style={styles.cardValue}>{total}</Text>
        </View>
        <View style={[styles.card, styles.cardHalf]}>
          <Text style={styles.cardLabel}>Tổng giá trị</Text>
          <Text style={styles.cardValueSmall}>{formatVnd(sumValue)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Theo loại</Text>
        {countsByLoai.length === 0 ? (
          <Text style={styles.muted}>Chưa có dữ liệu theo loại.</Text>
        ) : (
          countsByLoai.map(({ loai, count }) => (
            <View key={loai} style={styles.barRow}>
              <View style={styles.barLabelRow}>
                <Text style={styles.barLabel} numberOfLines={1}>
                  {loai}
                </Text>
                <Text style={styles.barCount}>{count}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${(count / maxCount) * 100}%` }]} />
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Giá cao / thấp nhất</Text>
        {!maxProduct || !minProduct ? (
          <Text style={styles.muted}>Chưa có sản phẩm.</Text>
        ) : (
          <>
            <View style={styles.extremeRow}>
              <Text style={styles.extremeTag}>Đắt nhất</Text>
              <View style={styles.extremeBody}>
                <Text style={styles.extremeName} numberOfLines={2}>
                  {maxProduct.tensp}
                </Text>
                <Text style={styles.extremePrice}>{formatVnd(Number(maxProduct.gia))}</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.extremeRow}>
              <Text style={styles.extremeTag}>Rẻ nhất</Text>
              <View style={styles.extremeBody}>
                <Text style={styles.extremeName} numberOfLines={2}>
                  {minProduct.tensp}
                </Text>
                <Text style={styles.extremePrice}>{formatVnd(Number(minProduct.gia))}</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
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
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardHalf: {
    flex: 1,
    marginBottom: 0,
  },
  cardLabel: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a5f',
  },
  cardValueSmall: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1e3a5f',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 14,
  },
  muted: {
    color: '#94a3b8',
    fontSize: 14,
  },
  barRow: {
    marginBottom: 14,
  },
  barLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  barLabel: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
    paddingRight: 8,
  },
  barCount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e2e8f0',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    minWidth: 4,
  },
  extremeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  extremeTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    width: 72,
    marginTop: 2,
  },
  extremeBody: {
    flex: 1,
  },
  extremeName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  extremePrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e3a5f',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 14,
  },
});
