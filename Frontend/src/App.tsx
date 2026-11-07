import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import KidsLayout from './layouts/KidsLayout';
import AdminLayout from './layouts/AdminLayout';
import LessonAccessGate from './components/kids/LessonAccessGate';

// Kid Pages (U01 - U12)
import Home from './pages/kids/Home';
import Dashboard from './pages/kids/Dashboard';
import Topics from './pages/kids/Topics';
import Flashcard from './pages/kids/Flashcard';
import VideoLesson from './pages/kids/VideoLesson';
import QuizLesson from './pages/kids/QuizLesson';
import MiniGame from './pages/kids/MiniGame';
import SpeakingAI from './pages/kids/SpeakingAI';
import Rewards from './pages/kids/Rewards';
import Profile from './pages/kids/Profile';
import Curriculum from './pages/kids/Curriculum';
import PlacementTest from './pages/kids/PlacementTest';

// Expert & Parent Pages
import ExpertDashboard from './pages/expert/ExpertDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

// Auth Pages (U10 & Dedicated Portals)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import ParentLogin from './pages/auth/ParentLogin';
import ExpertLogin from './pages/auth/ExpertLogin';

// Admin Pages (A01 - A07)
import AdminDashboard from './pages/admin/Dashboard';
import Users from './pages/admin/Users';
import TopicsManager from './pages/admin/TopicsManager';
import Lessons from './pages/admin/Lessons';
import Vocabularies from './pages/admin/Vocabularies';
import QuizManager from './pages/admin/QuizManager';
import MiniGameManager from './pages/admin/MiniGameManager';
import Analytics from './pages/admin/Analytics';
import Courses from './pages/admin/Courses';
import CreateCourse from './pages/admin/CreateCourse';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================= BƯỚC ĐÓN TIẾP BAN ĐẦU: ONBOARDING KHÔNG CÓ THANH NAVBAR ================= */}
        <Route path="/" element={<Home />} />

        {/* ================= TRANG HỌC TẬP CHÍNH (CÓ THANH NAV ĐẦY ĐỦ: LỘ TRÌNH, SAO, XU, GÓC PHỤ HUYNH) ================= */}
        <Route element={<KidsLayout />}>
          {/* U02: Dashboard học tập dạng lộ trình Duolingo */}
          <Route path="dashboard" element={<Dashboard />} />

          {/* U03: Danh sách từ vựng theo chủ đề */}
          <Route path="topics" element={<Topics />} />

          {/* U04: Chi tiết từ vựng / Flashcard */}
          <Route path="lessons/:topicId/flashcard" element={<Flashcard />} />

          {/* U05: Bài học video */}
          <Route path="lessons/:lessonId/video" element={<VideoLesson />} />

          {/* U06: Quiz trắc nghiệm */}
          <Route path="lessons/:lessonId/quiz" element={<LessonAccessGate mode="QUIZ"><QuizLesson /></LessonAccessGate>} />

          {/* U07: Mini Game ghép từ và tranh */}
          <Route path="game" element={<LessonAccessGate mode="GAME"><MiniGame /></LessonAccessGate>} />

          {/* U08: Luyện phát âm AI */}
          <Route path="speaking" element={<LessonAccessGate mode="SPEAKING"><SpeakingAI /></LessonAccessGate>} />

          {/* U09: Tiến độ và phần thưởng */}
          <Route path="rewards" element={<Rewards />} />

          {/* Bài Test Đánh Giá Trình Độ Đầu Vào Cho Bé */}
          <Route path="placement-test" element={<PlacementTest />} />

          {/* Lộ trình học */}
          <Route path="curriculum" element={<Curriculum />} />

          {/* Góc phụ huynh quản lý con em */}
          <Route path="parent" element={<ParentDashboard />} />

          {/* U11: Hồ sơ cá nhân của bé */}
          <Route path="profile" element={<Profile />} />
        </Route>

        {/* U10: Đăng nhập & Đăng ký cho Học sinh / Bé */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ================= DEDICATED LOGIN PORTALS FOR EACH ROLE ================= */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/parent/login" element={<ParentLogin />} />
        <Route path="/expert/login" element={<ExpertLogin />} />

        {/* ================= EXPERT EDUCATION PORTAL ================= */}
        {/* Khu vực Chuyên Gia độc lập, không dùng giao diện học sinh */}
        <Route path="/expert" element={<ExpertDashboard />} />

        {/* ================= ADMIN MANAGEMENT (A01 - A07) ================= */}
        <Route path="/admin" element={<AdminLayout />}>
          {/* A01: Dashboard tổng quan */}
          <Route index element={<AdminDashboard />} />

          {/* A02: Quản lý User */}
          <Route path="users" element={<Users />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/new" element={<CreateCourse />} />
          <Route path="courses/edit/:courseId" element={<CreateCourse />} />

          {/* Quản lý Chủ đề (Topics) */}
          <Route path="topics" element={<TopicsManager />} />

          {/* A03 & A07: Quản lý Bài học & Biểu mẫu */}
          <Route path="lessons" element={<Lessons />} />

          {/* A04: Quản lý Từ vựng & Media */}
          <Route path="vocabularies" element={<Vocabularies />} />

          {/* A05: Quản lý Quiz */}
          <Route path="quiz" element={<QuizManager />} />

          {/* A06: Quản lý Mini Game */}
          <Route path="games" element={<MiniGameManager />} />

          {/* A09: Báo cáo & Thống kê hệ thống */}
          <Route path="analytics" element={<Analytics />} />
        </Route>

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
