import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { SignOutButton } from '../../components/SignOutButton';

export default function AdminLayout() {
  return (
    <Tabs
      screenOptions={{
        headerRight: () => <SignOutButton />,
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
      <Tabs.Screen
        name="edit/[id]"
        options={{
          href: null,
          title: 'Sửa sản phẩm',
        }}
      />
    </Tabs>
  );
}
