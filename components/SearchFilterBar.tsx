import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { LOAI_SAN_PHAM } from '../constants/categories';

export type SearchFilterBarProps = {
  searchText: string;
  onSearchChange: (text: string) => void;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

export function SearchFilterBar({
  searchText,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
}: SearchFilterBarProps) {
  const items = useMemo(() => ['Tất cả', ...LOAI_SAN_PHAM] as const, []);

  return (
    <View style={styles.wrap}>
      <TextInput
        style={styles.search}
        placeholder="Tìm theo tên..."
        placeholderTextColor="#94a3b8"
        value={searchText}
        onChangeText={onSearchChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => {
          const isAll = item === 'Tất cả';
          const active = isAll ? selectedCategory === null : selectedCategory === item;
          return (
            <Pressable
              key={item}
              onPress={() => onSelectCategory(isAll ? null : item)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#f8fafc',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  search: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#0f172a',
  },
  row: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginRight: 4,
  },
  chipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  chipTextActive: {
    color: '#fff',
  },
});
