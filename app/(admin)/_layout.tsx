import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, Text } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerRight: () => (
          <Pressable
            onPress={() => {
              void supabase.auth.signOut();
            }}
            style={{ marginRight: 16, paddingVertical: 4 }}
          >
            <Text style={{ color: '#c62828', fontWeight: '600' }}>Đăng xuất</Text>
          </Pressable>
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Sản phẩm',
          tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Thêm mới',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: 'Thống kê',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
