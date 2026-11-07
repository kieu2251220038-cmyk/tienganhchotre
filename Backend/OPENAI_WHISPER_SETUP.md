# OpenAI Whisper API

Whisper API chỉ được gọi từ Backend. Không đưa `OPENAI_API_KEY` vào Frontend.

Thêm vào `Backend/.env`:

```env
OPENAI_WHISPER_ENABLED=true
OPENAI_API_KEY=sk-điền-khóa-của-bạn-vào-đây
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_WHISPER_LANGUAGE=en
```

Sau đó khởi động lại Backend. Frontend sẽ tự dùng OpenAI Whisper API. Nếu API chưa cấu hình hoặc tạm lỗi, ứng dụng sẽ tự dùng Whisper cục bộ.

Whisper là mô hình chuyển giọng nói thành văn bản, không tự đo trực tiếp từng âm vị. Ứng dụng giữ nguyên transcript Whisper trả về rồi so sánh nghiêm ngặt với đáp án; ví dụ đang học A mà nhận được `bye` hoặc `hi` thì vẫn là sai, không tự đổi thành `ay`.
