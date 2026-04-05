import { Ionicons } from '@expo/vector-icons';
import { File as ExpoFile } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LOAI_SAN_PHAM } from '../constants/categories';
import { supabase } from '../lib/supabase';
import { SanPham, SanPhamInsert } from '../types';

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (typeof atob !== 'function') {
    throw new Error('Không decode được base64 trên môi trường này.');
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function readImageAsArrayBuffer(uri: string): Promise<ArrayBuffer> {
  try {
    return await new ExpoFile(uri).arrayBuffer();
  } catch {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64ToArrayBuffer(base64);
  }
}

export type ProductFormProps = {
  mode: 'add' | 'edit';
  initialData?: Partial<SanPham>;
  onSubmit: (data: SanPhamInsert) => Promise<void>;
  loading?: boolean;
};

type PendingPick = { uri: string; mimeType: string };

export function ProductForm({ mode, initialData, onSubmit, loading: parentLoading }: ProductFormProps) {
  const [tensp, setTensp] = useState('');
  const [loaisp, setLoaisp] = useState('');
  const [gia, setGia] = useState('');
  /** URL đã có trên server (sửa SP / sau khi submit thành công) */
  const [savedImageUrl, setSavedImageUrl] = useState<string | null>(null);
  /** Ảnh vừa chọn, chỉ upload khi bấm Thêm/Cập nhật */
  const [pendingPick, setPendingPick] = useState<PendingPick | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const previewUri = pendingPick?.uri ?? savedImageUrl;

  useEffect(() => {
    if (!initialData) return;
    setTensp(initialData.tensp ?? '');
    setLoaisp(initialData.loaisp ?? '');
    setGia(initialData.gia != null ? String(initialData.gia) : '');
    setSavedImageUrl(initialData.hinhanh ?? null);
    setPendingPick(null);
  }, [initialData?.idsanpham, initialData?.tensp, initialData?.loaisp, initialData?.gia, initialData?.hinhanh]);

  const pickImage = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Quyền truy cập', 'Cần quyền truy cập thư viện ảnh.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      const uri = asset?.uri;
      if (!uri) return;
      setPendingPick({
        uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
      });
    } catch (e) {
      Alert.alert('Chọn ảnh', e instanceof Error ? e.message : 'Không chọn được ảnh.');
    }
  };

  const handleSubmit = async () => {
    const name = tensp.trim();
    if (!name) {
      Alert.alert('Thiếu thông tin', 'Nhập tên sản phẩm.');
      return;
    }
    if (!loaisp) {
      Alert.alert('Thiếu thông tin', 'Chọn loại sản phẩm.');
      return;
    }
    const digits = String(gia).replace(/\D/g, '');
    const price = Number(digits);
    if (!digits || Number.isNaN(price) || price < 0) {
      Alert.alert('Giá không hợp lệ', 'Nhập giá là số dương.');
      return;
    }

    setSubmitting(true);
    try {
      let hinhanhOut: string | null = savedImageUrl;
      if (pendingPick) {
        setUploading(true);
        try {
          const mime = pendingPick.mimeType;
          const ext = mime.includes('png') ? 'png' : 'jpeg';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;
          const arrayBuffer = await readImageAsArrayBuffer(pendingPick.uri);
          const { error: upError } = await supabase.storage
            .from('product-images')
            .upload(fileName, arrayBuffer, { contentType: mime, upsert: false });
          if (upError) {
            Alert.alert('Upload ảnh', upError.message);
            return;
          }
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
          hinhanhOut = urlData.publicUrl;
        } catch (e) {
          Alert.alert('Upload ảnh', e instanceof Error ? e.message : 'Không tải được ảnh lên.');
          return;
        } finally {
          setUploading(false);
        }
      }

      const payload: SanPhamInsert = {
        tensp: name,
        loaisp,
        gia: price,
        hinhanh: hinhanhOut,
      };
      await onSubmit(payload);
      setPendingPick(null);
      setSavedImageUrl(hinhanhOut);
    } catch {
      Alert.alert('Lỗi', mode === 'add' ? 'Không thêm được sản phẩm.' : 'Không cập nhật được sản phẩm.');
    } finally {
      setSubmitting(false);
    }
  };

  const busy = submitting || uploading || parentLoading;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Tên sản phẩm</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập tên"
          placeholderTextColor="#94a3b8"
          value={tensp}
          onChangeText={setTensp}
          editable={!busy}
        />

        <Text style={styles.label}>Loại</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {LOAI_SAN_PHAM.map((loai) => {
            const active = loaisp === loai;
            return (
              <Pressable
                key={loai}
                onPress={() => setLoaisp(loai)}
                disabled={busy}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{loai}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.label}>Giá (VNĐ)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ví dụ: 150000"
          placeholderTextColor="#94a3b8"
          keyboardType="decimal-pad"
          value={gia}
          onChangeText={setGia}
          editable={!busy}
        />

        <Text style={styles.label}>Hình ảnh</Text>
        <Pressable
          style={[styles.pickBtn, busy && styles.pickBtnDisabled]}
          onPress={pickImage}
          disabled={busy}
        >
          <Ionicons name="image-outline" size={20} color="#1e3a5f" />
          <Text style={styles.pickBtnText}>Chọn ảnh</Text>
        </Pressable>
        {previewUri ? (
          <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
        ) : null}

        <Pressable
          style={[styles.submit, busy && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={busy}
        >
          {submitting || uploading || parentLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{mode === 'add' ? 'Thêm sản phẩm' : 'Cập nhật'}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    marginTop: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    color: '#0f172a',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: 8,
    paddingVertical: 4,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  chipActive: {
    backgroundColor: '#1e3a5f',
    borderColor: '#1e3a5f',
  },
  chipText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#fff',
  },
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
  },
  pickBtnDisabled: {
    opacity: 0.6,
  },
  pickBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e3a5f',
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginTop: 12,
    backgroundColor: '#e2e8f0',
  },
  submit: {
    marginTop: 28,
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  submitDisabled: {
    opacity: 0.7,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
