# Kids English Mobile

Ứng dụng Android React Native/Expo dùng chung API với `Backend` hiện tại. Ứng dụng nằm trong thư mục riêng `Mobile`, không thay đổi `Frontend` web.

## Chạy trên Android Emulator

Mobile dùng API Backend hiện tại qua proxy nội bộ `127.0.0.1:5001`; không sửa Backend và không sửa Frontend.

1. Khởi động Backend ở cổng `5000`.
2. Từ thư mục `Mobile`, mở một terminal và chạy `node .\backend-proxy.cjs`.
3. Mở một terminal khác, thiết lập Android SDK/JDK rồi chạy bản development native:

```powershell
$env:JAVA_HOME='C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME='C:\Users\ASUS\AppData\Local\Android\Sdk'
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
$env:EXPO_PUBLIC_API_URL='http://127.0.0.1:5001/api'
npx.cmd expo run:android --port 8083
```

Hoặc chạy lệnh tự động để mở proxy và cấu hình ADB reverse:

```powershell
npm.cmd run android:connected
```

Không dùng Expo Go cho bản có Nói AI; module ghi âm native cần development build. Nếu dùng emulator, Mobile đã cấu hình ADB reverse cho cổng `5001` và `8083`.

Nếu chạy trên điện thoại thật, thay `EXPO_PUBLIC_API_URL` bằng IP LAN của máy tính, ví dụ:

```env
EXPO_PUBLIC_API_URL=http://DIA_CHI_IP_MAY_TINH:5001/api
```

Điện thoại và máy tính phải cùng mạng LAN; Backend cần cho phép kết nối tới cổng 5000.

## Hiện đã có

- Đăng nhập bằng tài khoản Backend.
- Lưu phiên đăng nhập trên thiết bị.
- Chọn độ tuổi 3–8.
- Tải khóa học, chủ đề và bài học đã xuất bản từ API `/api/curriculum/roadmap`.
- Flashcard, Video, Quiz, Mini Game, Nói AI chấm qua `/api/voice/transcribe`.
- Lưu tiến độ, từ vựng đã học, sao/xu, huy hiệu và mở rương qua API Backend.
- Màn hình phần thưởng và hồ sơ người dùng.
- Giao diện roadmap theo bậc 3–8, đăng ký trước rồi đăng nhập sau.
