import { useState } from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { supabase } from '../lib/supabase';

export function SignOutButton() {
  const [busy, setBusy] = useState(false);

  return (
    <Pressable
      onPress={() => {
        if (busy) return;
        setBusy(true);
        void supabase.auth.signOut().finally(() => setBusy(false));
      }}
      style={{ marginRight: 16, paddingVertical: 4, minWidth: 88, alignItems: 'flex-end' }}
      disabled={busy}
    >
      {busy ? (
        <ActivityIndicator size="small" color="#c62828" />
      ) : (
        <Text style={{ color: '#c62828', fontWeight: '600' }}>Đăng xuất</Text>
      )}
    </Pressable>
  );
}
