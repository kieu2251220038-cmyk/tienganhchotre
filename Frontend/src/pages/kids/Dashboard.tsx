import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { progressService, type ChestRewardResult, type ChestStatus } from '../../services/progressService';
import { authService } from '../../services/authService';
import type { Course, Lesson, UserRewardsData } from '../../types';
import { sounds } from '../../utils/soundEffects';
import ChestRewardModal from '../../components/kids/ChestRewardModal';

interface LevelTab {
  age: number;
  courseId: number;
  label: string;
  emoji: string;
  color: string;
  title: string;
  description: string;
}

interface LessonWithTopic extends Lesson {
  topic_name?: string;
}

interface PathStage {
  id: number;
  title: string;
  topicName: string;
  lessons: LessonWithTopic[];
}

const LEVEL_STYLES: Record<number, { emoji: string; color: string }> = {
  3: { emoji: '🐣', color: '#10B981' },
  4: { emoji: '🐥', color: '#1CB0F6' },
  5: { emoji: '🐼', color: '#FF6489' },
  6: { emoji: '🦊', color: '#8B5CF6' },
  7: { emoji: '🦁', color: '#F59E0B' },
  8: { emoji: '🚀', color: '#EF4444' }
};

function toLevelTab(course: Course, index: number): LevelTab {
  const age = getAge(course.age_group, Math.min(8, Math.max(3, 3 + index)));
  const style = LEVEL_STYLES[age] || { emoji: '📚', color: '#64748B' };
  return {
    age,
    courseId: course.id,
    label: `Bậc ${age}: ${age} Tuổi`,
    emoji: style.emoji,
    color: style.color,
    title: course.title,
    description: course.description || `Lộ trình tiếng Anh dành cho trẻ ${age} tuổi.`
  };
}

const STUDY_TYPES = new Set<Lesson['lesson_type']>(['FLASHCARD', 'VIDEO']);

const EMPTY_LEVEL: LevelTab = {
  age: 3,
  courseId: 0,
  label: 'Đang tải khóa học',
  emoji: '📚',
  color: '#64748B',
  title: 'Đang tải lộ trình học',
  description: 'Đang tải dữ liệu khóa học từ Backend.'
};

function getAge(value: string | number | undefined, fallback = 3) {
  const age = Number(value);
  return Number.isInteger(age) && age >= 3 && age <= 8 ? age : fallback;
}

function isStudyLesson(lesson: LessonWithTopic) {
  return STUDY_TYPES.has(lesson.lesson_type);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  const accountAge = getAge(user.age_group);
  const hasAllAgeAccess = accountAge >= 8;
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const [levels, setLevels] = useState<LevelTab[]>([]);
  const [lessons, setLessons] = useState<LessonWithTopic[]>([]);
  const [rewards, setRewards] = useState<UserRewardsData | null>(null);
  const [chestStatus, setChestStatus] = useState<ChestStatus | null>(null);
  const [chestReward, setChestReward] = useState<ChestRewardResult | null>(null);
  const [chestLoading, setChestLoading] = useState(false);
  const [chestError, setChestError] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentLevel = levels.find((level) => level.courseId === selectedCourseId) || levels[0] || EMPTY_LEVEL;
  const selectedAge = currentLevel.age;
  const completedIds = useMemo(() => new Set((rewards?.completed_lessons || []).map((item) => Number(item.lesson_id))), [rewards]);
  const isComplete = (lesson: LessonWithTopic) => completedIds.has(lesson.id) || Boolean(lesson.is_completed);
  const canAccessInteractive = hasAllAgeAccess || selectedAge <= accountAge;
  const isAvailableLesson = (lesson: LessonWithTopic) => isStudyLesson(lesson) || canAccessInteractive;

  const stages = useMemo<PathStage[]>(() => {
    const groups: LessonWithTopic[][] = [];
    lessons.forEach((lesson) => {
      const last = groups[groups.length - 1];
      if (!last || last[0]?.topic_id !== lesson.topic_id) groups.push([lesson]);
      else last.push(lesson);
    });
    return groups.map((group, index) => ({
      id: group[0]?.topic_id || index + 1,
      title: group[0]?.topic_name || `Chặng ${index + 1}`,
      topicName: group[0]?.topic_name || '',
      lessons: group
    }));
  }, [lessons]);

  const studyLessons = stages.flatMap((stage) => stage.lessons.filter(isStudyLesson));
  const availableLessons = stages.flatMap((stage) => stage.lessons.filter(isAvailableLesson));
  const completedStudyLessons = studyLessons.filter(isComplete).length;
  const completedAvailableLessons = availableLessons.filter(isComplete).length;
  const pathProgress = availableLessons.length ? Math.round((completedAvailableLessons / availableLessons.length) * 100) : 0;
  const stageIsComplete = (stage: PathStage) => {
    const stageLessons = stage.lessons.filter(isAvailableLesson);
    return stageLessons.length > 0 && stageLessons.every(isComplete);
  };
  const completedStages = stages.filter(stageIsComplete).length;
  const allComplete = stages.length > 0 && stages.every(stageIsComplete);
  const currentStageIndex = stages.findIndex((stage) => !stageIsComplete(stage));

  const loadGrade = async (courseId: number) => {
    setLoading(true);
    setError('');
    try {
      const topics = await courseService.getTopicsByCourse(courseId);
      const orderedTopics = [...topics].sort((left, right) => left.sort_order - right.sort_order);
      const groups = await Promise.all(orderedTopics.map(async (topic) => {
        const topicLessons = await courseService.getLessonsByTopic(topic.id);
        return topicLessons
          .sort((left, right) => left.sort_order - right.sort_order)
          .map((lesson) => ({ ...lesson, topic_name: topic.name }));
      }));
      setLessons(groups.flat());
    } catch (requestError) {
      console.error('Không thể tải lộ trình:', requestError);
      setError('Không thể tải lộ trình từ Backend. Bé hãy thử lại nhé.');
      setLessons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;
    courseService.getCourses()
      .then((courses) => {
        if (!mounted) return;
        const nextLevels = courses
          .map((course, index) => toLevelTab(course, index))
          .sort((left, right) => left.age - right.age || left.courseId - right.courseId);
        setLevels(nextLevels);
        if (nextLevels.length > 0) {
          setSelectedCourseId((previousCourseId) => {
            if (previousCourseId && nextLevels.some((level) => level.courseId === previousCourseId)) return previousCourseId;
            return nextLevels.find((level) => level.age === accountAge)?.courseId || nextLevels[0].courseId;
          });
        }
      })
      .catch((requestError) => {
        console.error('Không thể tải danh sách khóa học:', requestError);
        if (mounted) setError('Không thể tải danh sách khóa học từ Backend. Bé hãy thử lại nhé.');
      })
      .finally(() => {
        if (mounted && levels.length === 0) setLoading(false);
      });

    return () => { mounted = false; };
  }, [accountAge]);

  useEffect(() => {
    if (levels.length > 0 && currentLevel.courseId > 0) void loadGrade(currentLevel.courseId);
  }, [levels, selectedCourseId]);

  useEffect(() => {
    progressService.getUserRewards(user.id).then(setRewards).catch(() => setRewards(null));
  }, [user.id]);

  useEffect(() => {
    let mounted = true;
    setChestStatus(null);
    setChestError('');
    progressService.getChestStatus(selectedAge)
      .then((status) => {
        if (mounted) setChestStatus(status);
      })
      .catch((requestError) => {
        console.error('Không thể tải trạng thái rương:', requestError);
      });
    return () => { mounted = false; };
  }, [selectedAge]);

  const openLesson = (lesson: LessonWithTopic) => {
    sounds.playClick();
    if (lesson.lesson_type === 'FLASHCARD') navigate(`/lessons/${lesson.topic_id}/flashcard?lessonId=${lesson.id}`);
    else if (lesson.lesson_type === 'VIDEO') navigate(`/lessons/${lesson.id}/video`);
    else if (lesson.lesson_type === 'SPEAKING') navigate(`/speaking?age=${lesson.target_age || lesson.age_group || ''}&topicId=${lesson.topic_id}&lessonId=${lesson.id}`);
    else if (lesson.lesson_type === 'QUIZ') navigate(`/lessons/${lesson.id}/quiz`);
    else if (lesson.lesson_type === 'GAME') navigate(`/game?gameId=${lesson.mini_game_id}&lessonId=${lesson.id}`);
  };

  const openStage = (stage: PathStage) => {
    const nextLesson = stage.lessons.filter(isAvailableLesson).find((lesson) => !isComplete(lesson)) || stage.lessons.find(isAvailableLesson);
    if (nextLesson) openLesson(nextLesson);
  };

  const openChest = async () => {
    if (!allComplete || chestLoading || chestStatus?.claimed) return;
    setChestLoading(true);
    setChestError('');
    try {
      const result = await progressService.claimChest(selectedAge);
      setChestReward(result);
      setChestStatus((previous) => ({
        ...(previous || {}),
        ageGroup: selectedAge,
        eligible: true,
        claimed: true,
        rewardStars: result.rewardStars,
        rewardCoins: result.rewardCoins,
        claimedAt: new Date().toISOString()
      }));
    } catch (requestError) {
      console.error('Không thể mở rương:', requestError);
      setChestError('Chưa thể mở rương lúc này. Bé hãy thử lại nhé.');
    } finally {
      setChestLoading(false);
    }
  };

  const goToNextLevel = () => {
    const nextAge = chestReward?.nextAge;
    setChestReward(null);
    if (nextAge) {
      sounds.playClick();
      const nextLevel = levels.find((level) => level.age === nextAge && level.courseId !== currentLevel.courseId)
        || levels.find((level) => level.age === nextAge);
      if (nextLevel) setSelectedCourseId(nextLevel.courseId);
    }
  };

  return (
    <div className="classic-roadmap-page">
      {chestReward && (
        <ChestRewardModal
          reward={chestReward}
          onNextLevel={goToNextLevel}
          onClose={() => setChestReward(null)}
        />
      )}
      <div className="classic-roadmap-layout">
        <main className="classic-roadmap-main">
          <div className="classic-age-tabs" role="tablist" aria-label="Chọn bậc tuổi">
            {levels.map((level) => {
              return (
                <button key={level.courseId} type="button" role="tab" aria-selected={currentLevel.courseId === level.courseId} className={currentLevel.courseId === level.courseId ? 'is-active' : ''} onClick={() => { sounds.playClick(); setSelectedCourseId(level.courseId); }} title={`${level.title} - Có thể học trước`}>
                  <span>{level.emoji}</span><strong>{level.label}</strong>
                </button>
              );
            })}
          </div>

          <section className="classic-level-hero" style={{ '--level-color': currentLevel.color } as React.CSSProperties}>
            <div className="classic-level-badge">{currentLevel.label.toUpperCase()} • KHÁM PHÁ MỖI NGÀY</div>
            <h1>{currentLevel.title} {currentLevel.emoji}</h1>
            <p>{currentLevel.description}</p>
            <div className="classic-level-progress"><span>Tiến độ bậc:</span><strong>{completedStages} / {stages.length || 0} Chặng ✓</strong></div>
          </section>

          <div className="classic-roadmap-note">📚 <span><strong>{studyLessons.length || 0} bài học kiến thức</strong> trong bậc này. {hasAllAgeAccess ? 'Tài khoản 8 tuổi được mở toàn bộ bài học, Nói, Quiz và Game của mọi độ tuổi.' : selectedAge > accountAge ? `Bé có thể học trước bài học kiến thức; Nói, Quiz và Game chỉ mở đến Bậc ${accountAge} tuổi.` : 'Trong Bậc này, bé có thể học bài và hoạt động; khi học vượt lên Bậc cao hơn chỉ bài học kiến thức được mở.'}</span> ✨</div>

          {loading ? <div className="classic-roadmap-message">Đang tải lộ trình từ Backend...</div> : error ? <div className="classic-roadmap-message is-error">{error}{currentLevel && <button onClick={() => void loadGrade(currentLevel.courseId)}>Thử lại</button>}</div> : (
            <section className="classic-path" aria-label="Các chặng học">
              <div className="classic-path-line" />
              <div className="classic-start-area">
                <div className="classic-start-bubble">BẮT ĐẦU</div>
                <button className="classic-start-node" onClick={() => currentStageIndex >= 0 && openStage(stages[currentStageIndex])} disabled={currentStageIndex < 0} aria-label="Bắt đầu chặng học">
                  <span>★</span>
                </button>
                <div className="classic-mascot">🦉</div>
              </div>

              {stages.map((stage, index) => {
                const availableLessons = stage.lessons.filter(isAvailableLesson);
                const completedCount = availableLessons.filter(isComplete).length;
                const stageComplete = stageIsComplete(stage);
                const stageProgress = availableLessons.length ? Math.min(100, Math.round((completedCount / availableLessons.length) * 100)) : 0;
                const nextLesson = availableLessons.find((lesson) => !isComplete(lesson));
                return (
                  <article key={stage.id} className={`classic-stage-row ${index % 2 ? 'is-reverse' : ''} ${stageComplete ? 'is-complete' : ''}`}>
                    <button className="classic-stage-node" style={{ '--stage-progress': `${stageProgress}%` } as React.CSSProperties} onClick={() => openStage(stage)} disabled={availableLessons.length === 0} aria-label={`Mở ${stage.title}`}>
                      <span>{stageComplete ? '✓' : '★'}</span>
                    </button>
                    <div className="classic-stage-card">
                      <h2>{stage.title}</h2>
                      <p className="classic-stage-topic">{stage.topicName}</p>
                      <div className="classic-stage-parts">
                        <span className={completedCount > 0 ? 'is-done' : ''}>📖 Học bài</span>
                        <span className={!canAccessInteractive ? 'is-disabled' : ''}>🎙️ Nói AI</span>
                        <span className={!canAccessInteractive ? 'is-disabled' : ''}>🎯 Quiz</span>
                        <span className={!canAccessInteractive ? 'is-disabled' : ''}>🎮 Chơi</span>
                      </div>
                      <div className="classic-stage-footer">
                        <strong>{stageComplete ? 'Đã học xong chặng' : `${completedCount}/${availableLessons.length} phần`}</strong>
                        {nextLesson && <button onClick={() => openLesson(nextLesson)}>HỌC BÀI →</button>}
                      </div>
                    </div>
                  </article>
                );
              })}

              {!stages.length && <div className="classic-roadmap-message">Chưa có chặng học cho bậc này.</div>}

              <section className={`classic-treasure ${allComplete ? 'is-open' : ''}`}>
                <div className="classic-treasure-icon">{allComplete ? '🎁' : '🔒'}</div>
                <h2>{allComplete ? `Rương Quà Bậc ${selectedAge} Tuổi` : 'Rương Quà Cuối Bậc'}</h2>
                <p>{allComplete ? (hasAllAgeAccess ? 'Bé đã hoàn thành toàn bộ hoạt động của bậc này!' : 'Bé đã hoàn thành phần được mở của bậc này. Các bậc cao hơn vẫn chỉ mở bài học kiến thức.') : 'Hãy hoàn thành các phần được mở của tất cả các chặng để mở rương.'}</p>
                {chestError && <div style={{ color: '#B42323', fontSize: '13px', fontWeight: 700, marginBottom: '10px' }}>{chestError}</div>}
                {allComplete && (
                  <button onClick={() => void openChest()} disabled={chestLoading || Boolean(chestStatus?.claimed)}>
                    {chestLoading ? '⏳ ĐANG MỞ RƯƠNG...' : chestStatus?.claimed ? '✅ ĐÃ MỞ RƯƠNG' : '🎁 MỞ RƯƠNG NHẬN THƯỞNG'}
                  </button>
                )}
              </section>
            </section>
          )}
        </main>

        <aside className="classic-roadmap-sidebar">
          <section className="classic-side-card classic-today-card">
            <h2>Hôm Nay Của Bé ⭐</h2>
            <div className="classic-stat-grid">
              <div><span>🔥</span><strong>{rewards?.current_streak ?? 0} Ngày</strong><small>Chuỗi học tập</small></div>
              <div><span>★</span><strong>{rewards?.total_stars ?? 0}</strong><small>Ngôi sao vàng</small></div>
            </div>
          </section>

          <section className="classic-side-card classic-level-card">
            <h2>Lộ Trình Bậc Học 🎯</h2>
            <p>{hasAllAgeAccess ? 'Tài khoản 8 tuổi đã mở toàn bộ nội dung của mọi bậc.' : `Tài khoản ${accountAge} tuổi có thể học trước bài học; hoạt động tương tác chỉ mở đến Bậc ${accountAge} tuổi.`}</p>
            <div className="classic-side-progress"><span style={{ width: `${Math.min(100, ((accountAge - 2) / 6) * 100)}%` }} /></div>
            <Link to="/dashboard">Về Trang Chủ 🏠</Link>
          </section>

          <section className="classic-side-card classic-task-card">
            <h2>Nhiệm Vụ Hôm Nay 🎯</h2>
            <div className="classic-task-item"><span>📖 Học một bộ Flashcard</span><strong>{completedStudyLessons > 0 ? '✓ Xong' : 'Đang chờ'}</strong></div>
            <div className="classic-task-item"><span>📚 Hoàn thành phần kiến thức</span><strong>{allComplete ? '✓ Xong' : `${pathProgress}%`}</strong></div>
          </section>

          <section className="classic-side-card classic-locked-card">
            <h2>Góc Tương Tác 🔒</h2>
            <p>{hasAllAgeAccess ? 'Tài khoản 8 tuổi được chơi và luyện tập toàn bộ nội dung của mọi độ tuổi.' : `Bậc cao hơn Bậc ${accountAge} chỉ mở bài học kiến thức; Nói AI, Quiz và Game không được học vượt.`}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

