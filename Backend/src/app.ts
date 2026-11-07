import express, { Application } from 'express';
import cors from 'cors';
import path from 'node:path';
import authRoutes from './routes/auth.routes';
import courseRoutes from './routes/course.routes';
import contentRoutes from './routes/content.routes'; // Import route mới
import progressRoutes from './routes/progress.routes';
import adminRoutes from './routes/admin.routes';
import curriculumRoutes from './routes/curriculum.routes';
import expertRoutes from './routes/expert.routes';
import parentRoutes from './routes/parent.routes';
import miniGameRoutes from './routes/miniGame.routes';
import localWhisperRoutes from './routes/localWhisper.routes';
import openaiWhisperRoutes from './routes/openaiWhisper.routes';
import userDataRoutes from './routes/userData.routes';
const app: Application = express();

app.use(cors());
// File uploads are sent as small data URLs by the admin UI. The backend
// stores the decoded file in /uploads so the database only keeps a URL.
app.use(express.json({ limit: '8mb' }));
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Khai báo API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/content', contentRoutes); // Đăng ký API nội dung học
app.use('/api/progress', progressRoutes); // Đăng ký API tiến độ & phần thưởng
app.use('/api/admin', adminRoutes); // Đăng ký API Admin Dashboard (A01 - A07)
app.use('/api/curriculum', curriculumRoutes); // Đăng ký API Lộ trình & Bài học mẫu 3-8 tuổi
app.use('/api/expert', expertRoutes); // Đăng ký API Chuyên gia giáo dục duyệt bài
app.use('/api/parent', parentRoutes); // Đăng ký API Phụ huynh theo dõi tiến độ con
app.use('/api/games', miniGameRoutes); // Mini game đang bật cho giao diện bé
app.use('/api/voice', localWhisperRoutes);
app.use('/api/openai-voice', openaiWhisperRoutes);
app.use('/api/user-data', userDataRoutes);

app.get('/', (req, res) => {
    res.send('Kids English API is running!');
});

export default app;
