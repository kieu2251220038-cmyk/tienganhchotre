import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { parentService } from '../../services/parentService';
import type { ParentChild, ChildOverview, ChildActivity, ChildSkill, ChildVocabularyProgress } from '../../types';
import speakingSummaryService from '../../services/speakingSummaryService';
import type { SpeakingSummary } from '../../services/speakingSummaryService';
import { sounds } from '../../utils/soundEffects';

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [parentUser, setParentUser] = useState<any>(null);

  const [children, setChildren] = useState<ParentChild[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<number>(6); // Bé Nga mặc định
  const [overview, setOverview] = useState<ChildOverview | null>(null);
  const [activities, setActivities] = useState<ChildActivity[]>([]);
  const [skills, setSkills] = useState<ChildSkill[]>([]);
  const [vocabularyProgress, setVocabularyProgress] = useState<ChildVocabularyProgress | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [latestSpeakingSummary, setLatestSpeakingSummary] = useState<SpeakingSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal đổi mục tiêu học tập hàng ngày
  const [goalModalOpen, setGoalModalOpen] = useState<boolean>(false);
  const [newGoalMinutes, setNewGoalMinutes] = useState<number>(15);
  const [savingGoal, setSavingGoal] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string>('');

  // Modal liên kết hồ sơ con có sẵn (xác minh an toàn)
  const [linkModalOpen, setLinkModalOpen] = useState<boolean>(false);
  const [linkUsername, setLinkUsername] = useState<string>('');
  const [linkPassword, setLinkPassword] = useState<string>('123456');
  const [linkRelationship, setLinkRelationship] = useState<string>('Mẹ');
  const [linking, setLinking] = useState<boolean>(false);
  const [linkError, setLinkError] = useState<string>('');

  // Modal tạo hồ sơ con mới trực tiếp từ tài khoản phụ huynh
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [createDisplayName, setCreateDisplayName] = useState<string>('');
  const [createUsername, setCreateUsername] = useState<string>('');
  const [createPassword, setCreatePassword] = useState<string>('123456');
  const [createAgeGroup, setCreateAgeGroup] = useState<string>('3');
  const [createRelationship, setCreateRelationship] = useState<string>('Mẹ');
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const loadParentData = async () => {
    try {
      const u = authService.getCurrentUser();
      if (!u || (u.role !== 'PARENT' && u.role !== 'ADMIN')) {
        navigate('/parent/login', { replace: true });
        return;
      }
      setParentUser(u);
      const activeParentId = u.id || 12;
      const data = await parentService.getChildren(activeParentId);
      if (Array.isArray(data) && data.length > 0) {
        setChildren(data);
        if (!data.some(c => c.id === selectedChildId)) {
          setSelectedChildId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Lỗi tải danh sách con:', err);
    }
  };

  // 1. Kiểm tra quyền Phụ Huynh và tải danh sách con em
  useEffect(() => {
    loadParentData();
  }, [navigate]);

  // Xử lý liên kết tài khoản bé đã có bằng mật khẩu xác thực an toàn
  const handleLinkChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setLinkError('');
    setLinking(true);
    try {
      const res = await parentService.linkChild({
        username: linkUsername,
        password: linkPassword,
        relationship: linkRelationship
      });
      sounds.playVictory();
      showToast(res.message || '✓ Liên kết hồ sơ bé thành công!');
      setLinkModalOpen(false);
      setLinkUsername('');
      await loadParentData();
      if (res.child?.id) {
        setSelectedChildId(res.child.id);
      }
    } catch (err: any) {
      sounds.playWrong();
      setLinkError(err?.response?.data?.message || err.message || 'Lỗi khi liên kết tài khoản bé');
    } finally {
      setLinking(false);
    }
  };

  // Xử lý tạo mới hồ sơ bé trực tiếp từ phụ huynh
  const handleCreateChild = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreating(true);
    try {
      const res = await parentService.createChild({
        displayName: createDisplayName,
        username: createUsername,
        password: createPassword,
        ageGroup: createAgeGroup,
        relationship: createRelationship
      });
      sounds.playVictory();
      showToast(res.message || '✓ Tạo hồ sơ bé mới thành công!');
      setCreateModalOpen(false);
      setCreateDisplayName('');
      setCreateUsername('');
      await loadParentData();
      if (res.child?.id) {
        setSelectedChildId(res.child.id);
      }
    } catch (err: any) {
      sounds.playWrong();
      setCreateError(err?.response?.data?.message || err.message || 'Lỗi khi tạo hồ sơ bé');
    } finally {
      setCreating(false);
    }
  };

  // Chuyển sang chế độ bé học ngay với tài khoản của bé
  const handleSwitchToKidLearning = (child: any) => {
    if (!child) return;
    authService.setCurrentUser({
      id: child.id,
      username: child.username,
      display_name: child.display_name,
      role: 'USER',
      age_group: child.age_group || '5'
    });
    sounds.playVictory();
    navigate('/dashboard');
  };

  // 2. Tải chi tiết tiến độ khi chọn bé
  useEffect(() => {
    if (!selectedChildId) return;
    setLoading(true);

    Promise.all([
      parentService.getChildOverview(selectedChildId),
      parentService.getChildActivities(selectedChildId),
      parentService.getChildSkills(selectedChildId),
      parentService.getChildVocabularyProgress(selectedChildId)
    ])
      .then(([ov, act, sk, vocab]) => {
        setOverview(ov);
        setNewGoalMinutes(ov.daily_goal_minutes || 15);
        setActivities(act);
        setSkills(sk.skills);
        setRecommendations(sk.recommendations);
        setVocabularyProgress(vocab);
      })
      .catch((err) => console.error('Lỗi tải tiến độ con:', err))
      .finally(() => setLoading(false));
  }, [selectedChildId]);

  useEffect(() => {
    void speakingSummaryService.getLatest(selectedChildId).then(setLatestSpeakingSummary);
  }, [selectedChildId]);

  // Cập nhật mục tiêu học tập vào MySQL
  const handleSaveGoal = async () => {
    setSavingGoal(true);
    try {
      await parentService.updateStudyGoals(selectedChildId, newGoalMinutes);
      sounds.playCorrect();
      showToast(`✓ Đã cập nhật mục tiêu học tập ${newGoalMinutes} phút/ngày cho bé!`);
      if (overview) {
        setOverview({ ...overview, daily_goal_minutes: newGoalMinutes });
      }
      setGoalModalOpen(false);
    } catch (err) {
      console.error('Lỗi lưu mục tiêu:', err);
      showToast('❌ Lỗi khi cập nhật mục tiêu');
    } finally {
      setSavingGoal(false);
    }
  };

  const currentChild = children.find(c => c.id === selectedChildId) || overview?.child;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Cổng Phụ Huynh */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: '20px',
        border: '2px solid #FBCFE8',
        boxShadow: '0 4px 12px rgba(190, 24, 93, 0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '36px' }}>👨‍👩‍👧</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#9F1239', margin: 0 }}>
                Cổng Phụ Huynh - Đồng Hành Cùng Bé
              </h1>
              <span style={{
                backgroundColor: '#FFE4E6',
                color: '#BE123C',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                PARENT
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#BE185D', margin: '4px 0 0', fontWeight: 600 }}>
              Xin chào {parentUser?.display_name || 'Phụ huynh'}! Theo dõi kết quả và quản lý mục tiêu học tập của con.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link
            to="/"
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              backgroundColor: '#F1F5F9',
              color: '#475569',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🏠</span>
            <span>Trang Học Bé</span>
          </Link>

          <button
            onClick={() => {
              authService.logout();
              navigate('/parent/login');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1.5px solid #FDA4AF',
              backgroundColor: '#FFE4E6',
              color: '#E11D48',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>🚪</span>
            <span>Đăng Xuất</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#047857',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontFamily: 'Fredoka, sans-serif',
          fontWeight: 700,
          fontSize: '15px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* ================= PARENT HEADER ================= */}
      <section style={{
        background: 'linear-gradient(135deg, #FDF2F8 0%, #EFF6FF 50%, #ECFDF5 100%)',
        border: '3px solid #F472B6',
        borderRadius: '28px',
        padding: '32px',
        boxShadow: '0 8px 0 #FBCFE8',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px'
      }}>
        <div style={{ maxWidth: '720px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#EC4899',
            color: '#FFFFFF',
            padding: '6px 16px',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '13px',
            marginBottom: '12px',
            boxShadow: '0 3px 0 #DB2777'
          }}>
            <span>👨‍👩‍👧 CỔNG QUẢN LÝ DÀNH CHO PHỤ HUYNH</span>
          </div>

          <h1 style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '32px',
            fontWeight: 800,
            color: '#831843',
            lineHeight: 1.25,
            marginBottom: '10px'
          }}>
            Đồng Hành Cùng Con Chinh Phục Tiếng Anh Mỗi Ngày 💖
          </h1>

          <p style={{ fontSize: '15px', color: '#9D174D', fontWeight: 600, lineHeight: 1.6, marginBottom: '20px' }}>
            Theo dõi sát sao từng bước tiến của bé: Xem bài học đã hoàn thành theo từng độ tuổi (3 - 8 tuổi), thời lượng học, điểm số bài quiz và nhận những lời khuyên hữu ích từ <strong>Chuyên gia giáo dục</strong>!
          </p>

          {/* Selector chọn bé & Hành động quản lý con em */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#831843' }}>
                Hồ sơ con em ({children.length}):
              </span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {children.map((child) => {
                  const active = child.id === selectedChildId;
                  return (
                    <button
                      key={child.id}
                      onClick={() => { sounds.playClick(); setSelectedChildId(child.id); }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 16px',
                        borderRadius: '12px',
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 700,
                        fontSize: '14px',
                        cursor: 'pointer',
                        border: active ? '2px solid #EC4899' : '1.5px solid #E2E8F0',
                        backgroundColor: active ? '#FDF2F8' : '#FFFFFF',
                        color: active ? '#BE185D' : '#475569',
                        boxShadow: active ? '0 3px 0 #F472B6' : 'none'
                      }}
                    >
                      <span>👧</span>
                      <span>{child.display_name}</span>
                      <span style={{ fontSize: '11px', backgroundColor: active ? '#FCE7F3' : '#F1F5F9', padding: '2px 6px', borderRadius: '6px' }}>
                        {child.relationship || 'Con'}
                      </span>
                    </button>
                  );
                })}

                {/* Nút liên kết thêm bé đã có */}
                <button
                  onClick={() => { sounds.playClick(); setLinkModalOpen(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: '1.5px dashed #EC4899',
                    backgroundColor: '#FFFFFF',
                    color: '#BE185D'
                  }}
                  title="Liên kết thêm tài khoản bé đã có"
                >
                  <span>🔗</span>
                  <span>Liên Kết Bé</span>
                </button>

                {/* Nút tạo mới hồ sơ bé */}
                <button
                  onClick={() => { sounds.playClick(); setCreateModalOpen(true); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '8px 14px',
                    borderRadius: '12px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    boxShadow: '0 3px 0 #059669'
                  }}
                  title="Tạo mới tài khoản học cho bé"
                >
                  <span>👶</span>
                  <span>+ Thêm Bé Mới</span>
                </button>
              </div>
            </div>

            {/* Chuyển nhanh sang chế độ bé học với tài khoản của bé đang chọn */}
            {currentChild && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '13px', color: '#9D174D', fontWeight: 600 }}>
                  Chuyển nhanh sang chế độ học:
                </span>
                <button
                  onClick={() => handleSwitchToKidLearning(currentChild)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 18px',
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '999px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 0 #1D4ED8'
                  }}
                  title={`Đăng nhập bé ${currentChild.display_name} và vào học ngay`}
                >
                  <span>🚀</span>
                  <span>Cùng {currentChild.display_name} vào học ngay ➔</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mascot gia đình & Tên Phụ Huynh */}
        <div style={{ textAlign: 'center', minWidth: '160px' }}>
          <div style={{ fontSize: '76px', lineHeight: 1 }}>
            👨‍👩‍👧
          </div>
          <div style={{
            marginTop: '8px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #EC4899',
            borderRadius: '16px',
            padding: '6px 14px',
            fontFamily: 'Fredoka, sans-serif',
            fontWeight: 800,
            fontSize: '13.5px',
            color: '#BE185D',
            boxShadow: '0 3px 0 #FBCFE8'
          }}>
            {parentUser?.display_name || 'Mẹ Thu Hương'}
          </div>
          <div style={{ fontSize: '11px', color: '#9D174D', marginTop: '4px', fontWeight: 600 }}>
            Tài khoản: @{parentUser?.username || 'phuhuynh_huong'}
          </div>
        </div>
      </section>

      {/* ================= THẺ TỔNG QUAN TIẾN ĐỘ CỦA BÉ ================= */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontFamily: 'Fredoka, sans-serif', fontSize: '18px' }}>
          Đang tải dữ liệu tiến độ của bé... ⏳
        </div>
      ) : overview && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
            {/* Tỷ lệ hoàn thành */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              border: '2px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>TIẾN ĐỘ TỔNG THỂ</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#10B981', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
                {overview.overall_completion_percent}%
              </div>
              <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600, marginTop: '4px' }}>
                {overview.total_completed_lessons} / {overview.system_total_lessons} bài học
              </div>
            </div>

            {/* Thời gian học */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              border: '2px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>THỜI LƯỢNG HỌC TÍCH LŨY</div>
              <div style={{ fontSize: '32px', fontWeight: 800, color: '#3B82F6', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
                {overview.estimated_study_minutes} <span style={{ fontSize: '18px' }}>phút</span>
              </div>
              <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, marginTop: '4px' }}>
                Đều đặn mỗi ngày
              </div>
            </div>

            {/* Sao & Streak */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '20px',
              border: '2px solid #E2E8F0',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
            }}>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>THƯỞNG & CHĂM CHỈ</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#D97706', fontFamily: 'Fredoka, sans-serif' }}>
                  ⭐ {overview.rewards.total_stars}
                </span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: '#EA580C', fontFamily: 'Fredoka, sans-serif' }}>
                  🔥 {overview.rewards.current_streak} ngày
                </span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, marginTop: '6px' }}>
                {overview.badges.length} Huy hiệu đạt được
              </div>
            </div>

            {/* Mục tiêu hàng ngày */}
            <div style={{
              backgroundColor: '#FDF2F8',
              borderRadius: '20px',
              padding: '20px',
              border: '2px solid #F472B6',
              boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '13px', color: '#BE185D', fontWeight: 700 }}>MỤC TIÊU HẰNG NGÀY</div>
                <div style={{ fontSize: '28px', fontWeight: 800, color: '#831843', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
                  {overview.daily_goal_minutes} phút/ngày
                </div>
              </div>
              <button
                onClick={() => setGoalModalOpen(true)}
                style={{
                  backgroundColor: '#EC4899',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '6px 12px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '12px',
                  cursor: 'pointer',
                  width: 'fit-content',
                  marginTop: '6px'
                }}
              >
                ⚙️ Đổi Mục Tiêu
              </button>
            </div>
          </div>

          {vocabularyProgress && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '2px solid #BFDBFE',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
                    📚 Từ vựng bé đã học
                  </h2>
                  <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600, margin: '5px 0 0' }}>
                    Từ các thẻ Flashcard bé đã hoàn thành trong lộ trình hiện tại.
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: '#2563EB' }}>
                    {vocabularyProgress.learnedVocabulary} / {vocabularyProgress.totalVocabulary} từ
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
                    Đã ghi nhận {vocabularyProgress.masteryPercent}%
                  </div>
                </div>
              </div>

              <div style={{ height: '10px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ width: `${vocabularyProgress.masteryPercent}%`, height: '100%', backgroundColor: '#2563EB', borderRadius: '999px' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '10px' }}>
                {vocabularyProgress.byTopic.map((topic) => (
                  <div key={topic.topicId} style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', fontSize: '13px', fontWeight: 800, color: '#334155' }}>
                      <span>{topic.topicName}</span>
                      <span style={{ color: '#2563EB' }}>{topic.learnedWords}/{topic.totalWords}</span>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden', marginTop: '8px' }}>
                      <div style={{ width: `${topic.percent}%`, height: '100%', backgroundColor: '#60A5FA', borderRadius: '999px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================= TIẾN ĐỘ THEO 6 BẬC TUỔI (3 -> 8 TUỔI) ================= */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px',
            border: '2px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', fontWeight: 800, color: '#1E293B' }}>
                  Tiến Độ Học Tập Của {currentChild?.display_name || 'Bé'} Qua 6 Bậc Học
                </h2>
                <p style={{ color: '#64748B', fontSize: '13px', fontWeight: 600 }}>
                  Từ nền tảng chữ cái mầm non (3T) đến đọc hiểu và câu văn hoàn chỉnh tiểu học (8T)
                </p>
              </div>

              <button
                onClick={() => { sounds.playClick(); navigate('/curriculum'); }}
                style={{
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1.5px solid #93C5FD',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Xem chi tiết tài liệu bài mẫu ➔
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {overview.progress_by_age.map((p) => {
                const ageColors: Record<string, { bg: string; fill: string; badge: string }> = {
                  '3': { bg: '#FEF3C7', fill: '#D97706', badge: '3 Tuổi (Chữ cái & Màu)' },
                  '4': { bg: '#E0F2FE', fill: '#0284C7', badge: '4 Tuổi (Số đếm & Hình khối)' },
                  '5': { bg: '#FCE7F3', fill: '#DB2777', badge: '5 Tuổi (Gia đình & Cơ thể)' },
                  '6': { bg: '#DCFCE7', fill: '#16A34A', badge: '6 Tuổi (Chuẩn bị vào Lớp 1)' },
                  '7': { bg: '#F3E8FF', fill: '#9333EA', badge: '7 Tuổi (Thời tiết & Hội thoại)' },
                  '8': { bg: '#FFEDD5', fill: '#EA580C', badge: '8 Tuổi (Đọc hiểu & Viết câu)' },
                };
                const ac = ageColors[p.age_group] || ageColors['3'];

                return (
                  <div
                    key={p.course_id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '16px',
                      padding: '16px',
                      border: '1.5px solid #E2E8F0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 800,
                        color: '#334155'
                      }}>
                        {ac.badge}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: ac.fill }}>
                        {p.percent}%
                      </span>
                    </div>

                    <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
                      {p.title}
                    </div>

                    {/* Progress Bar */}
                    <div style={{
                      height: '10px',
                      backgroundColor: '#E2E8F0',
                      borderRadius: '999px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.max(5, p.percent)}%`,
                        backgroundColor: ac.fill,
                        borderRadius: '999px',
                        transition: 'width 0.4s ease'
                      }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#64748B' }}>
                      <span>Đã học: {p.completed_lessons} bài</span>
                      <span>Tổng số: {p.total_lessons} bài</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ================= ĐÁNH GIÁ 4 KỸ NĂNG & LỜI KHUYÊN CHUYÊN GIA ================= */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
            {/* Đánh giá 4 kỹ năng */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '2px solid #E2E8F0',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>
                📊 Phân Tích 4 Kỹ Năng Ngôn Ngữ Của Bé
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {skills.map((skill, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                      <span style={{ color: '#334155' }}>{skill.label}</span>
                      <span style={{ color: '#10B981', fontWeight: 800 }}>{skill.score}%</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${skill.score}%`, backgroundColor: '#10B981', borderRadius: '999px' }} />
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {skill.comment}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Lời khuyên chuyên gia giáo dục */}
            <div style={{
              backgroundColor: '#F5F3FF',
              borderRadius: '24px',
              padding: '24px',
              border: '2px solid #C084FC',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '24px' }}>👩‍🏫</span>
                <div>
                  <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: 800, color: '#4C1D95' }}>
                    Lời Khuyên Chuyên Gia Dành Cho Phụ Huynh
                  </h3>
                  <span style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 600 }}>
                    Từ TS. Minh Anh - Cố vấn sư phạm
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '12px',
                      padding: '12px',
                      fontSize: '13px',
                      color: '#4C1D95',
                      fontWeight: 600,
                      lineHeight: 1.5,
                      border: '1px solid #DDD6FE'
                    }}
                  >
                    💡 {rec}
                  </div>
                ))}
              </div>

              <div style={{
                marginTop: 'auto',
                backgroundColor: '#EDE9FE',
                borderRadius: '12px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#5B21B6',
                fontWeight: 700
              }}>
                💬 Cần hỗ trợ riêng? Phụ huynh có thể trao đổi thêm tại Góc Chuyên Gia để điều chỉnh lộ trình cho bé.
              </div>
            </div>
          </div>

          {latestSpeakingSummary && (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px',
              border: '2px solid #BFDBFE',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.06)'
            }}>
              <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1E3A8A', margin: '0 0 14px' }}>
                🎙️ Kết quả luyện nói gần nhất
              </h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                <span style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8', padding: '7px 12px', borderRadius: '10px', fontWeight: 800 }}>
                  Trung bình: {latestSpeakingSummary.averageScore}%
                </span>
                <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '7px 12px', borderRadius: '10px', fontWeight: 800 }}>
                  Đúng: {latestSpeakingSummary.correctCount}
                </span>
                <span style={{ backgroundColor: '#FFEDD5', color: '#C2410C', padding: '7px 12px', borderRadius: '10px', fontWeight: 800 }}>
                  Cần luyện: {latestSpeakingSummary.incorrectCount}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {latestSpeakingSummary.attempts.map((attempt) => (
                  <div key={`${attempt.index}-${attempt.word}`} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '7px 10px', borderRadius: '9px', backgroundColor: '#F8FAFC', fontSize: '13px' }}>
                    <span><strong>{attempt.word}</strong> → {attempt.recognized || 'chưa nhận diện'}</span>
                    <span style={{ color: attempt.correct ? '#15803D' : '#C2410C', fontWeight: 800 }}>{attempt.score}%</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '10px', color: '#64748B', fontSize: '12px' }}>
                Cập nhật: {new Date(latestSpeakingSummary.completedAt).toLocaleString('vi-VN')}
              </div>
            </div>
          )}

          {/* ================= NHẬT KÝ HỌC TẬP GẦN ĐÂY ================= */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: '2px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>
              🕒 Nhật Ký Bài Học Hoàn Thành Gần Đây Của Bé
            </h3>

            {activities.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94A3B8', fontSize: '14px' }}>
                Bé chưa hoàn thành bài học nào. Hãy cùng bé bắt đầu bài học đầu tiên nhé!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activities.map((act) => (
                  <div
                    key={act.id}
                    style={{
                      backgroundColor: '#F8FAFC',
                      borderRadius: '14px',
                      padding: '14px 18px',
                      border: '1px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#1E293B' }}>
                        {act.lesson_title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748B', marginTop: '2px' }}>
                        Chủ đề: {act.topic_name} • {act.course_title} • Dạng bài: {act.lesson_type}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        backgroundColor: '#DCFCE7',
                        color: '#166534',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontWeight: 800,
                        fontSize: '13px'
                      }}>
                        Điểm: {act.score} / 100
                      </span>

                      <span style={{ fontSize: '12px', color: '#94A3B8' }}>
                        {act.completed_at ? new Date(act.completed_at).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ================= MODAL CÀI ĐẶT MỤC TIÊU HỌC TẬP ================= */}
      {goalModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1E293B' }}>
                ⚙️ Cài Đặt Mục Tiêu Hằng Ngày Cho Bé
              </h3>
              <button
                onClick={() => setGoalModalOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Chuyên gia khuyến nghị trẻ 3 - 8 tuổi chỉ nên tiếp xúc tiếng Anh từ 10 - 20 phút mỗi buổi để bảo vệ mắt và giữ sự tập trung cao nhất.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '8px' }}>
                Chọn thời lượng học mỗi ngày:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {[10, 15, 20, 30].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setNewGoalMinutes(mins)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: '12px',
                      fontFamily: 'Fredoka, sans-serif',
                      fontWeight: 700,
                      fontSize: '14px',
                      cursor: 'pointer',
                      border: newGoalMinutes === mins ? '2px solid #EC4899' : '1.5px solid #CBD5E1',
                      backgroundColor: newGoalMinutes === mins ? '#FDF2F8' : '#FFFFFF',
                      color: newGoalMinutes === mins ? '#BE185D' : '#475569'
                    }}
                  >
                    {mins} Phút
                  </button>
                ))}
              </div>

              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                backgroundColor: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0',
                color: '#166534',
                fontSize: '12px',
                lineHeight: 1.5,
                fontWeight: 600
              }}>
                🌿 <strong>Cam kết thân thiện:</strong> Thời lượng đặt ra chỉ để tham khảo định hướng thói quen. Website <strong>hoàn toàn không giới hạn</strong> số phút/ngày, không tự động khóa bài, không đăng xuất hay ép kết thúc bài học khi học lâu. Bé được tự do khám phá theo nhịp độ tự nhiên!
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                onClick={handleSaveGoal}
                disabled={savingGoal}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#EC4899',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #DB2777'
                }}
              >
                {savingGoal ? 'Đang lưu...' : 'Lưu Mục Tiêu Vào Hệ Thống'}
              </button>

              <button
                onClick={() => setGoalModalOpen(false)}
                style={{
                  padding: '12px 20px',
                  borderRadius: '14px',
                  border: '1.5px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#64748B',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL LIÊN KẾT HỒ SƠ BÉ ĐÃ CÓ (XÁC MINH AN TOÀN) ================= */}
      {linkModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '3px solid #EC4899',
            maxWidth: '460px',
            width: '100%',
            padding: '32px 28px',
            boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.3)',
            position: 'relative'
          }}>
            <button
              onClick={() => setLinkModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#94A3B8'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔗👧</div>
              <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', color: '#831843', margin: '0 0 6px', fontWeight: 800 }}>
                Liên Kết Hồ Sơ Trẻ Em
              </h2>
              <p style={{ fontSize: '13.5px', color: '#9D174D', margin: 0 }}>
                Nhập thông tin tài khoản của bé và xác thực an toàn bằng mật khẩu
              </p>
            </div>

            {linkError && (
              <div style={{
                backgroundColor: '#FFF1F2',
                border: '1.5px solid #F43F5E',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#BE123C',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                ⚠️ {linkError}
              </div>
            )}

            <form onSubmit={handleLinkChild} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4C0519', marginBottom: '4px' }}>
                  Tên đăng nhập tài khoản của bé (Username)
                </label>
                <input
                  type="text"
                  required
                  value={linkUsername}
                  onChange={(e) => setLinkUsername(e.target.value)}
                  placeholder="Ví dụ: nga, Tuong, hiền..."
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #FECDD3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4C0519', marginBottom: '4px' }}>
                  Mật khẩu tài khoản bé (Xác minh quyền quản lý)
                </label>
                <input
                  type="password"
                  required
                  value={linkPassword}
                  onChange={(e) => setLinkPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #FECDD3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4C0519', marginBottom: '4px' }}>
                  Quan hệ với bé
                </label>
                <select
                  value={linkRelationship}
                  onChange={(e) => setLinkRelationship(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #FECDD3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="Mẹ">Mẹ</option>
                  <option value="Bố">Bố</option>
                  <option value="Người giám hộ">Người giám hộ</option>
                  <option value="Gia sư">Gia sư đồng hành</option>
                </select>
              </div>

              <div style={{
                backgroundColor: '#FFF1F2',
                border: '1px dashed #FB7185',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#9F1239'
              }}>
                💡 Tài khoản học sinh mẫu có sẵn trong hệ thống: <code>nga</code>, <code>Tuong</code>, <code>hiền</code> (mật khẩu: <code>123456</code>)
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setLinkModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#EC4899',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 0 #DB2777'
                  }}
                >
                  {linking ? 'Đang liên kết...' : 'Xác Nhận Liên Kết ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO HỒ SƠ BÉ MỚI TRỰC TIẾP ================= */}
      {createModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '3px solid #10B981',
            maxWidth: '460px',
            width: '100%',
            padding: '32px 28px',
            boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setCreateModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#94A3B8'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>👶✨</div>
              <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', color: '#065F46', margin: '0 0 6px', fontWeight: 800 }}>
                Thêm Hồ Sơ Bé Mới
              </h2>
              <p style={{ fontSize: '13.5px', color: '#047857', margin: 0 }}>
                Tạo tài khoản học tiếng Anh cho bé và tự động liên kết vào gia đình
              </p>
            </div>

            {createError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1.5px solid #EF4444',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#B91C1C',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateChild} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#064E3B', marginBottom: '4px' }}>
                  Tên hiển thị của bé
                </label>
                <input
                  type="text"
                  required
                  value={createDisplayName}
                  onChange={(e) => setCreateDisplayName(e.target.value)}
                  placeholder="Ví dụ: Bé Bắp, Bé Sam, Bé Cherry..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #A7F3D0',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#064E3B', marginBottom: '4px' }}>
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    required
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    placeholder="bebap2026"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #A7F3D0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#064E3B', marginBottom: '4px' }}>
                    Mật khẩu bé
                  </label>
                  <input
                    type="password"
                    required
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="123456"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #A7F3D0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#064E3B', marginBottom: '4px' }}>
                    Độ tuổi của bé
                  </label>
                  <select
                    value={createAgeGroup}
                    onChange={(e) => setCreateAgeGroup(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #A7F3D0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="3">3 Tuổi (Mầm Non)</option>
                    <option value="4">4 Tuổi (Chồi)</option>
                    <option value="5">5 Tuổi (Lá)</option>
                    <option value="6">6 Tuổi (Lớp 1)</option>
                    <option value="7">7 Tuổi (Lớp 2)</option>
                    <option value="8">8 Tuổi (Lớp 3)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#064E3B', marginBottom: '4px' }}>
                    Quan hệ
                  </label>
                  <select
                    value={createRelationship}
                    onChange={(e) => setCreateRelationship(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '12px',
                      border: '1.5px solid #A7F3D0',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                      backgroundColor: '#FFFFFF'
                    }}
                  >
                    <option value="Mẹ">Mẹ</option>
                    <option value="Bố">Bố</option>
                    <option value="Người giám hộ">Người giám hộ</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#10B981',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 0 #059669'
                  }}
                >
                  {creating ? 'Đang tạo...' : '+ Tạo Hồ Sơ Bé ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
