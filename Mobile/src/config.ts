import { Platform } from 'react-native';

// Android Emulator truy cập máy host bằng 10.0.2.2.
// Nếu chạy trên điện thoại thật, đặt EXPO_PUBLIC_API_URL thành IP LAN của máy chạy Backend.
const localApiUrl = Platform.OS === 'android'
    ? 'http://127.0.0.1:5001/api'
  : 'http://localhost:5000/api';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || localApiUrl;

export const STORAGE_KEYS = {
  token: 'kids_mobile_token',
  user: 'kids_mobile_user'
} as const;
