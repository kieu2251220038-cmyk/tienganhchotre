import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { mobileApi } from './src/api';
import { API_BASE_URL } from './src/config';
import ClassicRoadmapScreen from './src/ClassicRoadmapScreen';
import StudyScreen, { ProfileScreen, RewardsScreen } from './src/StudyScreensV2';
import type { CurriculumStage, Lesson, MobileUser } from './src/types';

const AGE_OPTIONS = ['3', '4', '5', '6', '7', '8'];
const lessonTypeLabel: Record<string, string> = {
  FLASHCARD: '📚 Học bài', VIDEO: '🎬 Video', QUIZ: '🎯 Quiz', SPEAKING: '🎙️ Nói AI', GAME: '🎮 Trò chơi'
};

function LoginScreen({ onLogin, onGoRegister, initialUsername = '' }: { onLogin: (username: string, password: string) => Promise<void>; onGoRegister: () => void; initialUsername?: string }) {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!username.trim() || !password) { setError('Bé hãy nhập tên đăng nhập và mật khẩu nhé.'); return; }
    setSubmitting(true); setError('');
    try { await onLogin(username.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Đăng nhập không thành công.'); }
    finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.loginContainer} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View style={styles.logoCircle}><Text style={styles.logoEmoji}>🦉</Text></View>
        <Text style={styles.brand}>Kids English</Text>
        <Text style={styles.subtitle}>Học vui mỗi ngày cùng bé</Text>
        <View style={styles.loginCard}>
          <Text style={styles.cardTitle}>Đăng nhập</Text>
          <Text style={styles.cardHint}>Dùng tài khoản hiện có trên phiên bản web.</Text>
          <TextInput style={styles.input} placeholder="Tên đăng nhập" placeholderTextColor="#94A3B8" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primaryButton} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Vào học ngay 🚀</Text>}
          </Pressable>
          <Text style={styles.apiHint}>API: {API_BASE_URL}</Text>
          <Pressable onPress={onGoRegister} style={styles.authLink}><Text style={styles.authLinkText}>ChÆ°a cÃ³ tÃ i khoáº£n? ÄÄƒng kÃ½</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RegisterScreen({ onRegistered, onBack }: { onRegistered: (username: string) => void; onBack: () => void }) {
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageGroup, setAgeGroup] = useState('3');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    const cleanUsername = username.trim();
    const cleanDisplayName = displayName.trim() || cleanUsername;
    if (!cleanUsername || !password) { setError('Vui lòng nhập tên đăng nhập và mật khẩu.'); return; }
    if (password.length < 4) { setError('Mật khẩu cần có ít nhất 4 ký tự.'); return; }
    if (password !== confirmPassword) { setError('Mật khẩu nhập lại chưa khớp.'); return; }
    setSubmitting(true); setError('');
    try {
      await mobileApi.register(cleanUsername, password, cleanDisplayName, ageGroup);
      onRegistered(cleanUsername);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đăng ký không thành công.');
    } finally { setSubmitting(false); }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.loginContainer} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        <View style={styles.logoCircle}><Text style={styles.logoEmoji}>🦉</Text></View>
        <Text style={styles.brand}>Kids English</Text>
        <Text style={styles.subtitle}>Tạo tài khoản cho bé bắt đầu học</Text>
        <View style={styles.loginCard}>
          <Text style={styles.cardTitle}>Đăng ký tài khoản</Text>
          <Text style={styles.cardHint}>Tài khoản này dùng chung với phiên bản web.</Text>
          <TextInput style={styles.input} placeholder="Tên đăng nhập" placeholderTextColor="#94A3B8" value={username} onChangeText={setUsername} autoCapitalize="none" />
          <TextInput style={styles.input} placeholder="Tên hiển thị" placeholderTextColor="#94A3B8" value={displayName} onChangeText={setDisplayName} />
          <TextInput style={styles.input} placeholder="Mật khẩu" placeholderTextColor="#94A3B8" value={password} onChangeText={setPassword} secureTextEntry />
          <TextInput style={styles.input} placeholder="Nhập lại mật khẩu" placeholderTextColor="#94A3B8" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
          <Text style={styles.formLabel}>Độ tuổi của bé</Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            directionalLockEnabled
            showsHorizontalScrollIndicator
            style={styles.ageScroll}
            contentContainerStyle={styles.ageRow}
            keyboardShouldPersistTaps="handled"
          >
            {AGE_OPTIONS.map((age) => <Pressable key={age} onPress={() => setAgeGroup(age)} style={[styles.ageButton, ageGroup === age && styles.ageButtonActive]}><Text style={[styles.ageButtonText, ageGroup === age && styles.ageButtonTextActive]}>{age} tuổi</Text></Pressable>)}
          </ScrollView>
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable style={styles.primaryButton} onPress={submit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Tạo tài khoản</Text>}
          </Pressable>
          <Pressable onPress={onBack} style={styles.authLink}><Text style={styles.authLinkText}>Đã có tài khoản? Đăng nhập</Text></Pressable>
          <Text style={styles.apiHint}>API: {API_BASE_URL}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LessonDetail({ lesson, onBack }: { lesson: Lesson; onBack: () => void }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContainer}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backButtonText}>← Quay lại lộ trình</Text></Pressable>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>{lessonTypeLabel[lesson.lesson_type] || '📖 Bài học'}</Text>
          <Text style={styles.heroTitle}>{lesson.title}</Text>
          <Text style={styles.heroDescription}>{lesson.learning_outcomes || 'Bé cùng khám phá nội dung mới qua hình ảnh và âm thanh.'}</Text>
          <View style={styles.badgeRow}><Text style={styles.badge}>Độ khó {lesson.difficulty || 1}</Text><Text style={styles.badge}>Bài học #{lesson.id}</Text></View>
        </View>
        <View style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Bài học trên Android</Text>
          <Text style={styles.bodyText}>Màn hình này đã kết nối dữ liệu thật từ Backend. Flashcard, Quiz, Game và Nói AI sẽ được nối tiếp vào cùng luồng này mà không ảnh hưởng phiên bản web.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function RoadmapScreen({ user, onLogout }: { user: MobileUser; onLogout: () => Promise<void> }) {
  const [selectedAge, setSelectedAge] = useState(String(user.age_group || '3'));
  const [roadmap, setRoadmap] = useState<CurriculumStage[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const loadRoadmap = async (age: string) => {
    setLoading(true); setError('');
    try { setRoadmap(await mobileApi.getRoadmap(age)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Không tải được lộ trình học.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { void loadRoadmap(selectedAge); }, [selectedAge]);
  const lessonCount = useMemo(() => roadmap.reduce((total, course) => total + course.topics.reduce((n, topic) => n + topic.lessons.length, 0), 0), [roadmap]);
  if (selectedLesson) return <LessonDetail lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.pageContainer}>
        <View style={styles.topBar}>
          <View><Text style={styles.greeting}>Xin chào, {user.display_name || user.username}! 👋</Text><Text style={styles.smallText}>Cùng bé học thêm một chút hôm nay nhé.</Text></View>
          <Pressable onPress={() => void onLogout()} style={styles.logoutButton}><Text style={styles.logoutText}>Thoát</Text></Pressable>
        </View>
        <View style={styles.banner}><Text style={styles.bannerTitle}>Lộ trình học của bé</Text><Text style={styles.bannerText}>Dữ liệu lấy trực tiếp từ khóa học đã xuất bản trên hệ thống.</Text><Text style={styles.bannerStat}>{lessonCount} bài học đang sẵn sàng</Text></View>
        <Text style={styles.sectionTitle}>Chọn độ tuổi</Text>
        <ScrollView horizontal nestedScrollEnabled directionalLockEnabled showsHorizontalScrollIndicator contentContainerStyle={styles.ageRow}>
          {AGE_OPTIONS.map((age) => <Pressable key={age} onPress={() => setSelectedAge(age)} style={[styles.ageButton, selectedAge === age && styles.ageButtonActive]}><Text style={[styles.ageButtonText, selectedAge === age && styles.ageButtonTextActive]}>{age} tuổi</Text></Pressable>)}
        </ScrollView>
        {loading ? <View style={styles.centerBox}><ActivityIndicator size="large" color="#0284C7" /><Text style={styles.smallText}>Đang tải lộ trình...</Text></View> : error ? <View style={styles.errorCard}><Text style={styles.error}>{error}</Text><Text style={styles.bodyText}>Kiểm tra Backend và địa chỉ API trong src/config.ts.</Text></View> : roadmap.length === 0 ? <View style={styles.infoCard}><Text style={styles.bodyText}>Chưa có khóa học đã xuất bản cho độ tuổi này.</Text></View> : roadmap.map((course) => (
          <View key={course.course_id} style={styles.courseCard}>
            <Text style={styles.courseAge}>Bậc {course.age_group} tuổi</Text><Text style={styles.courseTitle}>{course.title}</Text><Text style={styles.bodyText}>{course.summary}</Text>
            {course.topics.map((topic) => <View key={topic.id} style={styles.topicBlock}>
              <View style={styles.topicHeader}><Text style={styles.topicTitle}>{topic.name}</Text><Text style={styles.topicCount}>{topic.lessons.length} bài</Text></View>
              {topic.lessons.map((lesson) => <Pressable key={lesson.id} onPress={() => setSelectedLesson(lesson)} style={styles.lessonRow}>
                <View style={styles.lessonIcon}><Text>{lessonTypeLabel[lesson.lesson_type]?.slice(0, 2) || '📖'}</Text></View><View style={styles.lessonContent}><Text style={styles.lessonTitle}>{lesson.title}</Text><Text style={styles.lessonType}>{lessonTypeLabel[lesson.lesson_type] || lesson.lesson_type}</Text></View><Text style={styles.chevron}>›</Text>
              </Pressable>)}
            </View>)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  const [user, setUser] = useState<MobileUser | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [utilityScreen, setUtilityScreen] = useState<'rewards' | 'profile' | null>(null);
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [registeredUsername, setRegisteredUsername] = useState('');
  const [checkingSession, setCheckingSession] = useState(true);
  useEffect(() => { mobileApi.restoreSession().then(setUser).finally(() => setCheckingSession(false)); }, []);
  if (checkingSession) return <View style={styles.centerBox}><ActivityIndicator size="large" color="#0284C7" /></View>;
  if (!user) {
    if (authMode === 'register') {
      return <RegisterScreen onBack={() => setAuthMode('login')} onRegistered={(username) => { setRegisteredUsername(username); setAuthMode('login'); }} />;
    }
    return <LoginScreen initialUsername={registeredUsername} onGoRegister={() => setAuthMode('register')} onLogin={async (username, password) => { const result = await mobileApi.login(username, password); setUser(result.user); }} />;
  }
  if (activeLesson) return <StudyScreen lesson={activeLesson} user={user} onBack={() => setActiveLesson(null)} />;
  if (utilityScreen === 'rewards') return <RewardsScreen user={user} onBack={() => setUtilityScreen(null)} />;
  if (utilityScreen === 'profile') return <ProfileScreen user={user} onBack={() => setUtilityScreen(null)} onLogout={async () => { await mobileApi.logout(); setUtilityScreen(null); setUser(null); }} />;
  return <ClassicRoadmapScreen user={user} onOpenLesson={setActiveLesson} onOpenRewards={() => setUtilityScreen('rewards')} onOpenProfile={() => setUtilityScreen('profile')} onLogout={async () => { await mobileApi.logout(); setActiveLesson(null); setUtilityScreen(null); setUser(null); }} />;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F8FC' }, loginContainer: { flexGrow: 1, justifyContent: 'center', padding: 24 }, pageContainer: { padding: 18, paddingBottom: 40 },
  logoCircle: { alignSelf: 'center', width: 84, height: 84, borderRadius: 42, backgroundColor: '#FDE68A', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, logoEmoji: { fontSize: 48 }, brand: { textAlign: 'center', color: '#0284C7', fontSize: 32, fontWeight: '900' }, subtitle: { textAlign: 'center', color: '#64748B', fontSize: 15, marginTop: 5, marginBottom: 24 },
  loginCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 22, borderWidth: 2, borderColor: '#BAE6FD', shadowColor: '#0C4A6E', shadowOpacity: 0.08, shadowRadius: 12, elevation: 3 }, cardTitle: { fontSize: 24, fontWeight: '900', color: '#172554', marginBottom: 5 }, cardHint: { color: '#64748B', fontSize: 13, marginBottom: 18 }, input: { height: 52, borderWidth: 1.5, borderColor: '#CBD5E1', borderRadius: 14, paddingHorizontal: 16, color: '#1E293B', marginBottom: 12, fontSize: 16, backgroundColor: '#F8FAFC' }, primaryButton: { minHeight: 52, backgroundColor: '#0284C7', borderRadius: 14, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, marginTop: 8 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' }, apiHint: { color: '#94A3B8', fontSize: 10, marginTop: 14, textAlign: 'center' }, error: { color: '#B91C1C', fontSize: 13, fontWeight: '700', marginBottom: 8 }, formLabel: { color: '#172554', fontSize: 14, fontWeight: '800', marginBottom: 8 }, ageScroll: { flexGrow: 0, marginBottom: 8 }, authLink: { alignItems: 'center', paddingTop: 14 }, authLinkText: { color: '#0369A1', fontSize: 13, fontWeight: '800' },
  topBar: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#E0F2FE' }, greeting: { color: '#172554', fontSize: 17, fontWeight: '900', maxWidth: 260 }, smallText: { color: '#64748B', fontSize: 12, marginTop: 4 }, logoutButton: { paddingVertical: 8, paddingHorizontal: 11, borderRadius: 10, backgroundColor: '#FEE2E2' }, logoutText: { color: '#B91C1C', fontWeight: '800', fontSize: 12 },
  banner: { backgroundColor: '#0EA5A4', borderRadius: 22, padding: 20, marginBottom: 18 }, bannerTitle: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' }, bannerText: { color: '#CCFBF1', lineHeight: 20, marginTop: 6 }, bannerStat: { alignSelf: 'flex-start', color: '#115E59', backgroundColor: '#CCFBF1', borderRadius: 10, paddingVertical: 7, paddingHorizontal: 10, marginTop: 13, fontWeight: '900', fontSize: 12 }, sectionTitle: { color: '#172554', fontSize: 19, fontWeight: '900', marginBottom: 10 }, ageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingBottom: 16, paddingRight: 12 }, ageButton: { flexShrink: 0, borderRadius: 14, borderWidth: 1.5, borderColor: '#BAE6FD', backgroundColor: '#FFFFFF', paddingVertical: 10, paddingHorizontal: 15 }, ageButtonActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' }, ageButtonText: { color: '#0369A1', fontWeight: '800' }, ageButtonTextActive: { color: '#FFFFFF' },
  courseCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 18, borderWidth: 2, borderColor: '#A7F3D0', marginBottom: 16 }, courseAge: { color: '#059669', fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }, courseTitle: { color: '#172554', fontSize: 22, fontWeight: '900', marginTop: 5, marginBottom: 8 }, bodyText: { color: '#475569', fontSize: 13, lineHeight: 20 }, topicBlock: { marginTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 13 }, topicHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }, topicTitle: { flex: 1, color: '#1E293B', fontWeight: '900', fontSize: 15 }, topicCount: { color: '#059669', fontWeight: '800', fontSize: 12 }, lessonRow: { minHeight: 64, backgroundColor: '#F8FAFC', borderRadius: 14, padding: 10, flexDirection: 'row', alignItems: 'center', marginTop: 7 }, lessonIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginRight: 10 }, lessonContent: { flex: 1 }, lessonTitle: { color: '#1E293B', fontWeight: '800', fontSize: 14 }, lessonType: { color: '#64748B', fontSize: 11, marginTop: 3 }, chevron: { color: '#0284C7', fontSize: 28, marginLeft: 6 },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 24 }, errorCard: { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 16, padding: 16 }, infoCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#BAE6FD', marginTop: 12 }, heroCard: { backgroundColor: '#0EA5A4', borderRadius: 24, padding: 22, marginBottom: 16 }, heroEyebrow: { color: '#CCFBF1', fontWeight: '900', fontSize: 13 }, heroTitle: { color: '#FFFFFF', fontSize: 26, fontWeight: '900', marginTop: 8 }, heroDescription: { color: '#ECFEFF', fontSize: 14, lineHeight: 21, marginTop: 8 }, badgeRow: { flexDirection: 'row', gap: 8, marginTop: 16 }, badge: { color: '#115E59', backgroundColor: '#CCFBF1', borderRadius: 9, paddingVertical: 6, paddingHorizontal: 9, fontSize: 11, fontWeight: '900' }, backButton: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 10 }, backButtonText: { color: '#0369A1', fontWeight: '900' }
});
