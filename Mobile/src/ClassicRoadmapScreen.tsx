// @ts-nocheck
import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { mobileApi } from './api';
import type { CurriculumStage, Lesson, MobileUser } from './types';

type LessonWithProgress = Lesson & { is_completed?: boolean };
type AgeStyle = { emoji: string; color: string; title: string };

const AGE_STYLES: Record<string, AgeStyle> = {
  '3': { emoji: '🐣', color: '#10B981', title: 'Khám phá mầm non' },
  '4': { emoji: '🐥', color: '#1CB0F6', title: 'Nhận biết xung quanh' },
  '5': { emoji: '🐼', color: '#FF6489', title: 'Gia đình & bạn bè' },
  '6': { emoji: '🦊', color: '#8B5CF6', title: 'Giao tiếp cơ bản' },
  '7': { emoji: '🦁', color: '#F59E0B', title: 'Tự tin giao tiếp' },
  '8': { emoji: '🚀', color: '#EF4444', title: 'Siêu nhí khám phá' },
};

const LESSON_LABELS: Record<string, { icon: string; label: string }> = {
  FLASHCARD: { icon: '📖', label: 'Học bài' },
  VIDEO: { icon: '🎬', label: 'Video' },
  SPEAKING: { icon: '🎙️', label: 'Nói AI' },
  QUIZ: { icon: '🎯', label: 'Quiz' },
  GAME: { icon: '🎮', label: 'Chơi' },
};

const AGE_OPTIONS = ['3', '4', '5', '6', '7', '8'];

function isDone(lesson: LessonWithProgress) {
  return Boolean(lesson.is_completed);
}

function LessonDetail({ lesson, onBack }: { lesson: LessonWithProgress; onBack: () => void }) {
  const kind = LESSON_LABELS[lesson.lesson_type] || { icon: '📚', label: 'Bài học' };
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.detailPage}>
        <Pressable onPress={onBack} style={styles.backButton}><Text style={styles.backText}>← TRỞ VỀ LỘ TRÌNH</Text></Pressable>
        <View style={styles.detailHero}>
          <Text style={styles.detailEyebrow}>{kind.icon} {kind.label}</Text>
          <Text style={styles.detailTitle}>{lesson.title}</Text>
          <Text style={styles.detailDescription}>{lesson.learning_outcomes || 'Bé cùng khám phá nội dung mới qua hình ảnh, âm thanh và hoạt động tương tác.'}</Text>
          <View style={styles.detailBadges}><Text style={styles.detailBadge}>Độ khó {lesson.difficulty || 1}</Text><Text style={styles.detailBadge}>Bài #{lesson.id}</Text></View>
        </View>
        <View style={styles.detailCard}>
          <Text style={styles.sideTitle}>Sẵn sàng học chưa? 🌟</Text>
          <Text style={styles.sideText}>Bài học này được lấy trực tiếp từ nội dung đã xuất bản trên hệ thống.</Text>
          <Pressable style={styles.startLessonButton}><Text style={styles.startLessonText}>BẮT ĐẦU BÀI HỌC →</Text></Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function ClassicRoadmapScreen({ user, onLogout, onOpenLesson, onOpenRewards, onOpenProfile }: { user: MobileUser; onLogout: () => Promise<void>; onOpenLesson?: (lesson: LessonWithProgress) => void; onOpenRewards?: () => void; onOpenProfile?: () => void }) {
  const accountAge = Number(user.age_group || 3);
  const [selectedAge, setSelectedAge] = useState(String(Number.isFinite(accountAge) ? accountAge : 3));
  const [roadmap, setRoadmap] = useState<CurriculumStage[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<LessonWithProgress | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [chestClaimed, setChestClaimed] = useState(false);
  const [chestMessage, setChestMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRoadmap = async (age: string) => {
    setLoading(true);
    setError('');
    try {
      const [roadmapData, rewards] = await Promise.all([
        mobileApi.getRoadmap(age),
        mobileApi.getRewards(user.id),
      ]);
      const completedIds = new Set((rewards.completed_lessons || []).map((item) => Number(item.lesson_id)));
      setCompletedLessonIds(completedIds);
      setRoadmap(roadmapData.map((course) => ({
        ...course,
        topics: course.topics.map((topic) => ({
          ...topic,
          lessons: topic.lessons.map((lesson) => ({ ...lesson, is_completed: completedIds.has(Number(lesson.id)) })),
        })),
      })));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải lộ trình từ Backend.');
      setRoadmap([]);
      setCompletedLessonIds(new Set());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadRoadmap(selectedAge); }, [selectedAge]);
  useEffect(() => { mobileApi.getChestStatus(Number(selectedAge)).then((status) => setChestClaimed(Boolean(status.claimed))).catch(() => setChestClaimed(false)); setChestMessage(''); }, [selectedAge]);

  const course = roadmap[0];
  const stages = course?.topics || [];
  const allLessons = useMemo(() => stages.flatMap((topic) => topic.lessons as LessonWithProgress[]), [stages]);
  const completedLessons = allLessons.filter(isDone).length;
  const completedStages = stages.filter((topic) => topic.lessons.length > 0 && topic.lessons.every((lesson) => isDone(lesson as LessonWithProgress))).length;
  const allComplete = stages.length > 0 && completedStages === stages.length;
  const style = AGE_STYLES[selectedAge] || AGE_STYLES['3'];
  const isHigherAge = Number(selectedAge) > accountAge;
  const hasAllAgeAccess = accountAge >= 8;
  const progressPercent = allLessons.length ? Math.round((completedLessons / allLessons.length) * 100) : 0;
  const openLesson = (lesson: LessonWithProgress) => onOpenLesson ? onOpenLesson(lesson) : setSelectedLesson(lesson);
  const openChest = async () => {
    try {
      const reward = await mobileApi.claimChest(Number(selectedAge));
      setChestClaimed(true);
      setChestMessage(`🎉 Bé nhận +${reward.rewardStars} Sao và +${reward.rewardCoins} Xu! ${reward.levelUpMessage || ''}`);
    } catch (requestError) {
      setChestMessage(requestError instanceof Error ? requestError.message : 'Chưa thể mở rương lúc này.');
    }
  };

  if (selectedLesson) return <LessonDetail lesson={selectedLesson} onBack={() => setSelectedLesson(null)} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator
        persistentScrollbar
        nestedScrollEnabled
      >
        <View style={styles.header}>
          <View><Text style={styles.headerBrand}>Kids English</Text><Text style={styles.headerSub}>Lộ trình học</Text></View>
          <View style={styles.headerActions}><Pressable onPress={onOpenRewards} style={styles.headerAction}><Text>⭐</Text></Pressable><Pressable onPress={onOpenProfile} style={styles.headerAction}><Text>👤</Text></Pressable><Pressable onPress={() => void onLogout()} style={styles.logoutButton}><Text style={styles.logoutText}>Thoát</Text></Pressable></View>
        </View>

        <ScrollView
          horizontal
          style={styles.ageTabsScroll}
          showsHorizontalScrollIndicator
          persistentScrollbar
          nestedScrollEnabled
          directionalLockEnabled
          contentContainerStyle={styles.ageTabs}
        >
          {AGE_OPTIONS.map((age) => {
            const active = selectedAge === age;
            const ageStyle = AGE_STYLES[age];
            return <Pressable key={age} onPress={() => setSelectedAge(age)} style={[styles.ageTab, active && { borderColor: ageStyle.color, backgroundColor: '#FFFFFF' }]}>
              <Text style={styles.ageEmoji}>{ageStyle.emoji}</Text><Text style={[styles.ageTabText, active && { color: ageStyle.color }]}>{`Bậc ${Number(age) - 2}: ${age} Tuổi`}</Text>
            </Pressable>;
          })}
        </ScrollView>

        <View style={[styles.levelHero, { backgroundColor: style.color }]}>
          <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>{`BẬC ${Number(selectedAge) - 2}: ${selectedAge} TUỔI • KHÁM PHÁ MỖI NGÀY`}</Text></View>
          <Text style={styles.levelTitle}>{course?.title || `Bậc ${Number(selectedAge) - 2}: Bé ${selectedAge} tuổi`} {style.emoji}</Text>
          <Text style={styles.levelDescription}>{course?.summary || `Lộ trình tiếng Anh dành cho trẻ ${selectedAge} tuổi.`}</Text>
          <View style={styles.progressBox}><Text style={styles.progressLabel}>Tiến độ bậc:</Text><Text style={styles.progressValue}>{completedStages} / {stages.length || 0} Chặng ✓</Text></View>
        </View>

        <View style={styles.notice}><Text style={styles.noticeIcon}>📚</Text><Text style={styles.noticeText}><Text style={styles.noticeStrong}>{allLessons.length} bài học kiến thức</Text> trong bậc này. {hasAllAgeAccess ? 'Tài khoản 8 tuổi được mở toàn bộ hoạt động.' : isHigherAge ? `Bé được học trước bài học; Nói, Quiz và Game chỉ mở đến Bậc ${accountAge} tuổi.` : 'Bé có thể học bài và hoạt động trong bậc hiện tại.'} ✨</Text></View>

        {loading ? <View style={styles.message}><ActivityIndicator size="large" color="#10B981" /><Text style={styles.muted}>Đang tải lộ trình từ Backend...</Text></View> : error ? <View style={styles.errorCard}><Text style={styles.error}>{error}</Text><Pressable onPress={() => void loadRoadmap(selectedAge)} style={styles.retryButton}><Text style={styles.retryText}>Thử lại</Text></Pressable></View> : (
          <View style={styles.path}>
            <View style={styles.pathLine} />
            <View style={styles.startArea}><View style={styles.startBubble}><Text style={styles.startBubbleText}>BẮT ĐẦU</Text></View><View style={styles.startNode}><Text style={styles.startStar}>★</Text></View><Text style={styles.mascot}>🦉</Text></View>
            {stages.map((topic, index) => {
              const lessons = topic.lessons as LessonWithProgress[];
              const done = lessons.filter(isDone).length;
              const complete = lessons.length > 0 && done === lessons.length;
              const nextLesson = lessons.find((lesson) => !isDone(lesson)) || lessons[0];
              return <View key={topic.id} style={[styles.stageRow, index % 2 === 1 && styles.stageRowReverse]}>
                <Pressable onPress={() => nextLesson && openLesson(nextLesson)} style={[styles.stageNode, complete && styles.stageNodeComplete]}><Text style={styles.stageNodeText}>{complete ? '✓' : '★'}</Text></Pressable>
                <View style={[styles.stageCard, complete && styles.stageCardComplete]}>
                  <Text style={styles.stageTitle}>{topic.name}</Text>
                  <Text style={styles.stageTopic}>{topic.description || `Chặng ${index + 1} • ${topic.name}`}</Text>
                  <View style={styles.parts}><Text style={styles.part}>📖 Học bài</Text><Text style={[styles.part, isHigherAge && !hasAllAgeAccess && styles.partDisabled]}>🎙️ Nói AI</Text><Text style={[styles.part, isHigherAge && !hasAllAgeAccess && styles.partDisabled]}>🎯 Quiz</Text><Text style={[styles.part, isHigherAge && !hasAllAgeAccess && styles.partDisabled]}>🎮 Chơi</Text></View>
                  <View style={styles.stageFooter}><Text style={styles.stageProgress}>{complete ? 'Đã học xong chặng' : `${done}/${lessons.length} phần`}</Text>{nextLesson && <Pressable onPress={() => openLesson(nextLesson)} style={styles.studyButton}><Text style={styles.studyButtonText}>HỌC BÀI →</Text></Pressable>}</View>
                </View>
              </View>;
            })}
            {!stages.length && <View style={styles.message}><Text style={styles.muted}>Chưa có chặng học cho bậc này.</Text></View>}
            <View style={[styles.treasure, allComplete && styles.treasureOpen]}><Text style={styles.treasureIcon}>{allComplete ? '🎁' : '🔒'}</Text><Text style={styles.treasureTitle}>{allComplete ? `Rương Quà Bậc ${selectedAge} Tuổi` : 'Rương Quà Cuối Bậc'}</Text><Text style={styles.treasureText}>{allComplete ? 'Bé đã hoàn thành toàn bộ hoạt động của bậc này!' : 'Hãy hoàn thành các chặng học để mở rương nhận thưởng.'}</Text>{allComplete && <Pressable disabled={chestClaimed} onPress={() => void openChest()} style={[styles.treasureButton, chestClaimed && styles.disabled]}><Text style={styles.treasureButtonText}>{chestClaimed ? '✓ ĐÃ MỞ RƯƠNG' : '🎁 MỞ RƯƠNG NHẬN THƯỞNG'}</Text></Pressable>}{chestMessage ? <Text style={styles.muted}>{chestMessage}</Text> : null}</View>
          </View>
        )}

        <View style={styles.sideCard}><Text style={styles.sideTitle}>Hôm Nay Của Bé ⭐</Text><View style={styles.stats}><View style={styles.stat}><Text style={styles.statIcon}>🔥</Text><Text style={styles.statValue}>0 Ngày</Text><Text style={styles.statLabel}>Chuỗi học tập</Text></View><View style={styles.stat}><Text style={styles.statIcon}>★</Text><Text style={styles.statValue}>0</Text><Text style={styles.statLabel}>Ngôi sao vàng</Text></View></View></View>
        <View style={[styles.sideCard, styles.levelSideCard]}><Text style={styles.blueSideTitle}>Lộ Trình Bậc Học 🎯</Text><Text style={styles.sideText}>{hasAllAgeAccess ? 'Tài khoản 8 tuổi đã mở toàn bộ nội dung.' : `Tài khoản ${accountAge} tuổi có thể học trước bài học; hoạt động mở đến Bậc ${accountAge}.`}</Text><View style={styles.sideProgress}><View style={[styles.sideProgressFill, { width: `${Math.min(100, ((accountAge - 2) / 6) * 100)}%` }]} /></View></View>
        <View style={styles.sideCard}><Text style={styles.sideTitle}>Nhiệm Vụ Hôm Nay 🎯</Text><View style={styles.taskRow}><Text style={styles.sideText}>📖 Học một bài kiến thức</Text><Text style={styles.taskValue}>{completedLessons > 0 ? '✓ Xong' : 'Đang chờ'}</Text></View><View style={styles.taskRow}><Text style={styles.sideText}>📚 Hoàn thành chặng</Text><Text style={styles.taskValue}>{progressPercent}%</Text></View></View>
        <View style={styles.lockedCard}><Text style={styles.sideTitle}>Góc Tương Tác 🔒</Text><Text style={styles.sideText}>{hasAllAgeAccess ? 'Bé được chơi và luyện tập toàn bộ nội dung.' : `Bậc cao hơn Bậc ${accountAge} chỉ mở bài học kiến thức; Nói AI, Quiz và Game không được học vượt.`}</Text></View>
      </ScrollView>
    </SafeAreaView>
  );
}

// @ts-nocheck
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#EEF5F9' }, page: { padding: 12, paddingBottom: 36 }, header: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#DCE6ED', marginBottom: 10 }, headerBrand: { color: '#0284C7', fontSize: 22, fontWeight: '900' }, headerSub: { color: '#64748B', fontSize: 12, marginTop: 2 }, logoutButton: { backgroundColor: '#FEE2E2', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 }, logoutText: { color: '#B91C1C', fontSize: 11, fontWeight: '900' }, ageTabs: { paddingVertical: 3, paddingBottom: 12 }, ageTab: { minWidth: 124, height: 58, backgroundColor: '#F6FAFC', borderRadius: 17, borderWidth: 2, borderColor: '#DCE6ED', paddingHorizontal: 10, marginRight: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' }, ageEmoji: { fontSize: 22, marginRight: 7 }, ageTabText: { color: '#7A8CA0', fontSize: 12, fontWeight: '900' }, levelHero: { borderRadius: 23, padding: 19, marginBottom: 12, shadowColor: '#0B8065', shadowOpacity: 0.2, shadowRadius: 0, elevation: 3 }, levelBadge: { alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.22)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 }, levelBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '900' }, levelTitle: { color: '#FFFFFF', fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: 18 }, levelDescription: { color: '#ECFEFF', fontSize: 14, lineHeight: 21, marginTop: 5 }, progressBox: { marginTop: 17, alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.2)', borderRadius: 17, paddingHorizontal: 18, paddingVertical: 11 }, progressLabel: { color: '#E4FFF4', fontSize: 12, fontWeight: '800' }, progressValue: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', marginTop: 3 }, notice: { backgroundColor: '#F0FFF7', borderColor: '#8BE7BD', borderWidth: 1.5, borderRadius: 18, padding: 13, flexDirection: 'row', marginBottom: 15 }, noticeIcon: { fontSize: 20, marginRight: 8 }, noticeText: { flex: 1, color: '#08784E', fontSize: 12, lineHeight: 19 }, noticeStrong: { fontWeight: '900' }, path: { position: 'relative' }, pathLine: { position: 'absolute', left: 40, top: 80, bottom: 90, width: 6, backgroundColor: '#B5EEDB', borderRadius: 6 }, startArea: { minHeight: 130, alignItems: 'center', justifyContent: 'center', position: 'relative' }, startBubble: { position: 'absolute', top: 0, backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 9, borderWidth: 1, borderColor: '#DCE6ED', elevation: 2 }, startBubbleText: { color: '#58C900', fontWeight: '900', fontSize: 14 }, startNode: { width: 83, height: 83, borderRadius: 42, backgroundColor: '#58CC02', borderWidth: 6, borderColor: '#E3EDF2', alignItems: 'center', justifyContent: 'center', marginTop: 20, elevation: 3 }, startStar: { color: '#FFFFFF', fontSize: 39 }, mascot: { position: 'absolute', right: 8, bottom: 10, fontSize: 43, backgroundColor: '#FFFFFF', borderRadius: 28, padding: 7 }, stageRow: { minHeight: 180, flexDirection: 'row', alignItems: 'center', marginBottom: 13, paddingLeft: 2 }, stageRowReverse: { flexDirection: 'row-reverse' }, stageNode: { width: 76, height: 76, borderRadius: 40, backgroundColor: '#58CC02', borderWidth: 6, borderColor: '#E3EDF2', alignItems: 'center', justifyContent: 'center', zIndex: 2, elevation: 3 }, stageNodeComplete: { backgroundColor: '#58CC02' }, stageNodeText: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' }, stageCard: { flex: 1, backgroundColor: '#F5FFF9', borderWidth: 2, borderColor: '#61DDA9', borderRadius: 20, padding: 14, marginLeft: 10, elevation: 2 }, stageRowReverse: { flexDirection: 'row-reverse' }, stageRowReverse: { flexDirection: 'row-reverse' }, stageRowReverse: { flexDirection: 'row-reverse' }, stageRowReverse: { flexDirection: 'row-reverse' }, stageRowReverse: { flexDirection: 'row-reverse' }, stageCardComplete: { backgroundColor: '#F0FFF7', borderColor: '#7BD9AE' }, stageTitle: { color: '#17324D', fontSize: 17, fontWeight: '900' }, stageTopic: { color: '#73879B', fontSize: 11, fontWeight: '800', marginTop: 3, marginBottom: 9 }, parts: { flexDirection: 'row', flexWrap: 'wrap' }, part: { color: '#08784E', backgroundColor: '#EAFBF1', borderRadius: 7, paddingHorizontal: 6, paddingVertical: 4, fontSize: 9, fontWeight: '900', marginRight: 4, marginBottom: 4 }, partDisabled: { color: '#A3AFBB', backgroundColor: '#F2F4F6' }, stageFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }, stageProgress: { color: '#6B8194', fontSize: 10, fontWeight: '800', flex: 1 }, studyButton: { backgroundColor: '#10B981', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 }, studyButtonText: { color: '#FFFFFF', fontSize: 9, fontWeight: '900' }, treasure: { backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 2, borderColor: '#DCE6ED', padding: 20, alignItems: 'center', marginTop: 8, marginBottom: 17 }, treasureOpen: { borderColor: '#F4D264', backgroundColor: '#FFFDF0', elevation: 3 }, treasureIcon: { fontSize: 48 }, treasureTitle: { color: '#516B83', fontSize: 18, fontWeight: '900', marginTop: 6 }, treasureText: { color: '#91A3B4', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 }, treasureButton: { marginTop: 13, backgroundColor: '#F5B700', borderRadius: 11, paddingVertical: 10, paddingHorizontal: 13 }, treasureButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' }, sideCard: { backgroundColor: '#FFFFFF', borderRadius: 21, borderWidth: 2, borderColor: '#DCE6ED', padding: 18, marginBottom: 14, elevation: 2 }, sideTitle: { color: '#122C47', fontSize: 18, fontWeight: '900', marginBottom: 12 }, sideText: { color: '#335473', fontSize: 12, lineHeight: 19 }, stats: { flexDirection: 'row', justifyContent: 'space-around' }, stat: { alignItems: 'center', minWidth: 110 }, statIcon: { fontSize: 28 }, statValue: { color: '#122C47', fontSize: 15, fontWeight: '900', marginTop: 3 }, statLabel: { color: '#73879B', fontSize: 10, marginTop: 2 }, levelSideCard: { borderColor: '#B8D8FF', backgroundColor: '#F3F8FF' }, blueSideTitle: { color: '#245BDD', fontSize: 18, fontWeight: '900', marginBottom: 10 }, sideProgress: { height: 10, borderRadius: 10, backgroundColor: '#D7E7FC', overflow: 'hidden', marginTop: 13 }, sideProgressFill: { height: '100%', backgroundColor: '#2864E8', borderRadius: 10 }, taskRow: { borderTopWidth: 1, borderTopColor: '#EDF2F6', paddingVertical: 9, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, taskValue: { color: '#08784E', fontSize: 11, fontWeight: '900' }, lockedCard: { backgroundColor: '#F8FAFC', borderRadius: 21, borderWidth: 2, borderColor: '#DCE6ED', padding: 18, marginBottom: 14 }, message: { minHeight: 130, backgroundColor: '#FFFFFF', borderRadius: 18, alignItems: 'center', justifyContent: 'center', padding: 18, marginBottom: 14 }, muted: { color: '#73879B', fontSize: 13, marginTop: 8, textAlign: 'center' }, errorCard: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5', borderRadius: 16, padding: 16, marginBottom: 14 }, error: { color: '#B42323', fontSize: 13, fontWeight: '800', marginBottom: 10 }, retryButton: { alignSelf: 'flex-start', backgroundColor: '#10B981', borderRadius: 9, paddingHorizontal: 13, paddingVertical: 8 }, retryText: { color: '#FFFFFF', fontWeight: '900' }, detailPage: { padding: 16, paddingBottom: 40 }, backButton: { paddingVertical: 10, alignSelf: 'flex-start' }, backText: { color: '#0369A1', fontWeight: '900', fontSize: 13 }, detailHero: { backgroundColor: '#0EA5A4', borderRadius: 23, padding: 21, marginTop: 6 }, detailEyebrow: { color: '#CCFBF1', fontSize: 13, fontWeight: '900' }, detailTitle: { color: '#FFFFFF', fontSize: 26, lineHeight: 32, fontWeight: '900', marginTop: 8 }, detailDescription: { color: '#ECFEFF', fontSize: 14, lineHeight: 21, marginTop: 8 }, detailBadges: { flexDirection: 'row', marginTop: 16 }, detailBadge: { color: '#115E59', backgroundColor: '#CCFBF1', borderRadius: 9, paddingVertical: 6, paddingHorizontal: 9, fontSize: 11, fontWeight: '900', marginRight: 7 }, detailCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 19, marginTop: 14, borderWidth: 1, borderColor: '#DCE6ED' }, startLessonButton: { backgroundColor: '#0284C7', borderRadius: 13, paddingVertical: 13, alignItems: 'center', marginTop: 13 }, startLessonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900' },
  pageScroll: { flex: 1 }, ageTabsScroll: { flexGrow: 0 }
});
