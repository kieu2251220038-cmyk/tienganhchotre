import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { expertService } from '../../services/expertService';
import type { Lesson, ExpertStats, CurriculumStandard, ApprovalStatus } from '../../types';
import { sounds } from '../../utils/soundEffects';

export default function ExpertDashboard() {
  const navigate = useNavigate();
  const [expertUser, setExpertUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'reviews' | 'standards'>('reviews');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAge, setFilterAge] = useState<string>('ALL');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [stats, setStats] = useState<ExpertStats | null>(null);
  const [standards, setStandards] = useState<CurriculumStandard[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal phản biện / góp ý
  const [rejectModalLesson, setRejectModalLesson] = useState<Lesson | null>(null);
  const [reviewNote, setReviewNote] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const fetchStats = () => {
    expertService.getStats().then(setStats).catch(console.error);
  };

  const fetchLessons = () => {
    setLoading(true);
    expertService.getLessonsForReview({
      status: filterStatus,
      age: filterAge
    })
      .then(setLessons)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const initExpert = async () => {
      try {
        const u = authService.getCurrentUser();
        if (!u || (u.role !== 'EXPERT' && u.role !== 'ADMIN')) {
          navigate('/expert/login', { replace: true });
          return;
        }
        setExpertUser(u);
      } catch (err) {
        console.error('Không thể kích hoạt tài khoản chuyên gia:', err);
      }
      fetchStats();
      fetchLessons();
      expertService.getStandards().then(setStandards).catch(console.error);
    };
    initExpert();
  }, [filterStatus, filterAge, navigate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Duyệt trực tiếp (Approve)
  const handleApprove = async (lesson: Lesson) => {
    sounds.playCorrect();
    try {
      await expertService.reviewLesson(lesson.id, {
        approval_status: 'APPROVED',
        review_notes: 'Đạt chuẩn nội dung sư phạm, phát âm chuẩn và hình ảnh phù hợp lứa tuổi.'
      });
      showToast(`✓ Đã phê duyệt bài học "${lesson.title}" đạt chuẩn!`);
      fetchLessons();
      fetchStats();
    } catch (err) {
      console.error('Lỗi khi duyệt bài:', err);
      showToast('❌ Lỗi lưu trạng thái duyệt');
    }
  };

  // Mở modal từ chối / góp ý (Reject / Needs revision)
  const handleOpenRejectModal = (lesson: Lesson) => {
    sounds.playClick();
    setRejectModalLesson(lesson);
    setReviewNote(lesson.review_notes || '');
  };

  const handleSubmitReject = async () => {
    if (!rejectModalLesson) return;
    setSubmittingReview(true);
    try {
      await expertService.reviewLesson(rejectModalLesson.id, {
        approval_status: 'REJECTED',
        review_notes: reviewNote || 'Cần điều chỉnh lại hình ảnh và giảm độ khó câu hỏi cho phù hợp lứa tuổi.'
      });
      sounds.playClick();
      showToast(`Đã gửi phản biện sư phạm cho bài "${rejectModalLesson.title}"!`);
      setRejectModalLesson(null);
      setReviewNote('');
      fetchLessons();
      fetchStats();
    } catch (err) {
      console.error('Lỗi khi gửi phản biện:', err);
      showToast('❌ Lỗi khi lưu phản biện');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Cổng Chuyên Gia */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        padding: '16px 24px',
        borderRadius: '20px',
        border: '2px solid #DDD6FE',
        boxShadow: '0 4px 12px rgba(109, 40, 217, 0.05)',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span style={{ fontSize: '36px' }}>👩‍🏫</span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#581C87', margin: 0 }}>
                Cổng Kiểm Định Sư Phạm - Hội Đồng Chuyên Gia
              </h1>
              <span style={{
                backgroundColor: '#F3E8FF',
                color: '#7E22CE',
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                EXPERT
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#6D28D9', margin: '4px 0 0', fontWeight: 600 }}>
              Xin chào {expertUser?.display_name || 'Chuyên gia'}! Thẩm định nội dung và phê duyệt bài học chuẩn hóa cho trẻ 3-8 tuổi.
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
              navigate('/expert/login');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '12px',
              border: '1.5px solid #D8B4FE',
              backgroundColor: '#F3E8FF',
              color: '#7E22CE',
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
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#065F46',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 1000,
          fontFamily: 'Fredoka, sans-serif',
          fontWeight: 700,
          fontSize: '15px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* ================= EXPERT HEADER ================= */}
      <section style={{
        background: 'linear-gradient(135deg, #FAF5FF 0%, #EFF6FF 50%, #ECFDF5 100%)',
        border: '3px solid #C084FC',
        borderRadius: '28px',
        padding: '32px',
        boxShadow: '0 8px 0 #E9D5FF',
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
            backgroundColor: '#8B5CF6',
            color: '#FFFFFF',
            padding: '6px 16px',
            borderRadius: '999px',
            fontWeight: 800,
            fontSize: '13px',
            marginBottom: '12px',
            boxShadow: '0 3px 0 #7C3AED'
          }}>
            <span>👩‍🏫 CỔNG KIỂM ĐỊNH SƯ PHẠM • CHUYÊN GIA GIÁO DỤC</span>
          </div>

          <h1 style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '32px',
            fontWeight: 800,
            color: '#4C1D95',
            lineHeight: 1.25,
            marginBottom: '10px'
          }}>
            Hội Đồng Đánh Giá & Phê Duyệt Bài Học (3 - 8 Tuổi)
          </h1>

          <p style={{ fontSize: '15px', color: '#5B21B6', fontWeight: 600, lineHeight: 1.6, marginBottom: '18px' }}>
            Xin chào <strong>{expertUser?.display_name || 'Chuyên gia giáo dục'}</strong>. Tại đây bạn có quyền thẩm định chất lượng bài học, đối chiếu khung chuẩn CEFR Pre-A1/A1 và phê duyệt xuất bản bài học lên hệ thống cho trẻ em học tập.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => { sounds.playClick(); setActiveTab('reviews'); }}
              style={{
                padding: '10px 20px',
                borderRadius: '14px',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'reviews' ? '#8B5CF6' : '#FFFFFF',
                color: activeTab === 'reviews' ? '#FFFFFF' : '#6D28D9',
                boxShadow: activeTab === 'reviews' ? '0 4px 0 #6D28D9' : '0 3px 0 #E2E8F0'
              }}
            >
              📋 Danh Sách Bài Học Cần Duyệt
            </button>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('standards'); }}
              style={{
                padding: '10px 20px',
                borderRadius: '14px',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                border: 'none',
                backgroundColor: activeTab === 'standards' ? '#10B981' : '#FFFFFF',
                color: activeTab === 'standards' ? '#FFFFFF' : '#065F46',
                boxShadow: activeTab === 'standards' ? '0 4px 0 #059669' : '0 3px 0 #E2E8F0'
              }}
            >
              📖 Khung Tiêu Chuẩn Sư Phạm 3 - 8T
            </button>

            <button
              onClick={() => { sounds.playClick(); navigate('/curriculum'); }}
              style={{
                padding: '10px 18px',
                borderRadius: '14px',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer',
                border: '2px solid #3B82F6',
                backgroundColor: '#EFF6FF',
                color: '#1D4ED8'
              }}
            >
              🌐 Xem Trang Chủ Lộ Trình ➔
            </button>
          </div>
        </div>

        {/* Mascot / Avatar chuyên gia */}
        <div style={{ textAlign: 'center', minWidth: '160px' }}>
          <div style={{ fontSize: '80px', lineHeight: 1 }}>
            🎓
          </div>
          <div style={{
            marginTop: '8px',
            backgroundColor: '#FFFFFF',
            border: '2px solid #8B5CF6',
            borderRadius: '16px',
            padding: '6px 12px',
            fontFamily: 'Fredoka, sans-serif',
            fontWeight: 800,
            fontSize: '13px',
            color: '#6D28D9'
          }}>
            {expertUser?.display_name || 'Chuyên gia giáo dục'}
          </div>
        </div>
      </section>

      {/* ================= STATS CARDS ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px',
          border: '2px solid #E2E8F0',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>TỔNG BÀI HỌC HỆ THỐNG</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#1E293B', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
            {stats?.total_lessons || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 600, marginTop: '4px' }}>
            Gồm 6 khóa học từ 3 đến 8 tuổi
          </div>
        </div>

        <div style={{
          backgroundColor: '#ECFDF5',
          borderRadius: '20px',
          padding: '20px',
          border: '2px solid #86EFAC',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '13px', color: '#047857', fontWeight: 700 }}>ĐÃ DUYỆT ĐẠT CHUẨN</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#065F46', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
            {stats?.approved_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px' }}>
            ✓ Đang phục vụ trẻ học tập
          </div>
        </div>

        <div style={{
          backgroundColor: '#FFFBEB',
          borderRadius: '20px',
          padding: '20px',
          border: '2px solid #FCD34D',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '13px', color: '#B45309', fontWeight: 700 }}>CHỜ CHUYÊN GIA DUYỆT</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#92400E', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
            {stats?.pending_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 700, marginTop: '4px' }}>
            ⏳ Cần kiểm định nội dung
          </div>
        </div>

        <div style={{
          backgroundColor: '#FEF2F2',
          borderRadius: '20px',
          padding: '20px',
          border: '2px solid #FCA5A5',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '13px', color: '#B91C1C', fontWeight: 700 }}>CẦN CHỈNH SỬA / GÓP Ý</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#991B1B', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
            {stats?.rejected_count || 0}
          </div>
          <div style={{ fontSize: '12px', color: '#DC2626', fontWeight: 700, marginTop: '4px' }}>
            ✍️ Đã gửi phản biện sư phạm
          </div>
        </div>

        <div style={{
          backgroundColor: '#F5F3FF',
          borderRadius: '20px',
          padding: '20px',
          border: '2px solid #C084FC',
          boxShadow: '0 4px 10px rgba(0,0,0,0.02)'
        }}>
          <div style={{ fontSize: '13px', color: '#6D28D9', fontWeight: 700 }}>TỶ LỆ CHUẨN HÓA</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#5B21B6', fontFamily: 'Fredoka, sans-serif', marginTop: '4px' }}>
            {stats?.approval_rate || 0}%
          </div>
          <div style={{ fontSize: '12px', color: '#7C3AED', fontWeight: 700, marginTop: '4px' }}>
            Theo chuẩn mầm non & tiểu học
          </div>
        </div>
      </div>

      {/* ================= TAB 1: DANH SÁCH BÀI HỌC KIỂM DUYỆT ================= */}
      {activeTab === 'reviews' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Bộ lọc kiểm duyệt */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '18px 24px',
            border: '2px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px'
          }}>
            {/* Lọc trạng thái */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Trạng thái:</span>
              {[
                { key: 'ALL', label: 'Tất cả bài học' },
                { key: 'PENDING', label: '⏳ Chờ duyệt' },
                { key: 'APPROVED', label: '✓ Đã duyệt' },
                { key: 'REJECTED', label: '✍️ Cần sửa' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => { sounds.playClick(); setFilterStatus(s.key); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: filterStatus === s.key ? '2px solid #8B5CF6' : '1px solid #CBD5E1',
                    backgroundColor: filterStatus === s.key ? '#F5F3FF' : '#FFFFFF',
                    color: filterStatus === s.key ? '#6D28D9' : '#475569'
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Lọc độ tuổi */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Lứa tuổi:</span>
              {[
                { key: 'ALL', label: 'Tất cả tuổi' },
                { key: '3', label: '3T' },
                { key: '4', label: '4T' },
                { key: '5', label: '5T' },
                { key: '6', label: '6T' },
                { key: '7', label: '7T' },
                { key: '8', label: '8T' },
              ].map((a) => (
                <button
                  key={a.key}
                  onClick={() => { sounds.playClick(); setFilterAge(a.key); }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 700,
                    fontSize: '13px',
                    cursor: 'pointer',
                    border: filterAge === a.key ? '2px solid #10B981' : '1px solid #CBD5E1',
                    backgroundColor: filterAge === a.key ? '#ECFDF5' : '#FFFFFF',
                    color: filterAge === a.key ? '#065F46' : '#475569'
                  }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bảng danh sách bài học */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontFamily: 'Fredoka, sans-serif' }}>
              Đang tải danh sách bài học... ⏳
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lessons.map((lesson) => {
                const statusBadge: Record<ApprovalStatus, { label: string; bg: string; color: string; border: string }> = {
                  'APPROVED': { label: '✓ ĐÃ DUYỆT ĐẠT CHUẨN', bg: '#DCFCE7', color: '#166534', border: '#86EFAC' },
                  'PENDING': { label: '⏳ ĐANG CHỜ KIỂM ĐỊNH', bg: '#FEF3C7', color: '#92400E', border: '#FCD34D' },
                  'REJECTED': { label: '✍️ YÊU CẦU CHỈNH SỬA', bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5' },
                };
                const s = statusBadge[lesson.approval_status || 'PENDING'];

                return (
                  <div
                    key={lesson.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      borderRadius: '18px',
                      padding: '20px',
                      border: '2px solid #E2E8F0',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '16px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                    }}
                  >
                    <div style={{ flex: '1 1 500px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{
                          backgroundColor: s.bg,
                          color: s.color,
                          border: `1.5px solid ${s.border}`,
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11px',
                          fontWeight: 800,
                          fontFamily: 'Fredoka, sans-serif'
                        }}>
                          {s.label}
                        </span>

                        <span style={{
                          backgroundColor: '#F1F5F9',
                          color: '#334155',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          Trẻ {lesson.target_age || lesson.age_group} Tuổi
                        </span>

                        <span style={{
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700
                        }}>
                          {lesson.lesson_type}
                        </span>
                      </div>

                      <h3 style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#1E293B',
                        marginBottom: '4px'
                      }}>
                        {lesson.title}
                      </h3>

                      <div style={{ fontSize: '13px', color: '#64748B', marginBottom: '8px' }}>
                        Chủ đề: <strong>{lesson.topic_name}</strong> • Khóa học: <strong>{lesson.course_title}</strong>
                      </div>

                      {/* Mục tiêu & ghi chú phản biện nếu có */}
                      <div style={{
                        backgroundColor: '#F8FAFC',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        color: '#475569',
                        lineHeight: 1.45
                      }}>
                        <strong>🎯 Tiêu chí sư phạm:</strong> {lesson.learning_outcomes || 'Nhận biết mặt chữ/số và luyện phát âm bản xứ.'}
                        {lesson.review_notes && (
                          <div style={{ marginTop: '4px', color: '#B91C1C', fontWeight: 600 }}>
                            💬 Nhận xét chuyên gia: "{lesson.review_notes}" (bởi {lesson.reviewer_name || 'Chuyên gia chưa xác định'})
                          </div>
                        )}
                        {lesson.approval_status === 'APPROVED' && (
                          <div style={{ marginTop: '4px', color: '#047857', fontWeight: 700 }}>
                            ✅ Được duyệt bởi: {lesson.reviewer_name || 'Chuyên gia giáo dục'}
                            {lesson.reviewed_at ? ` • ${new Date(lesson.reviewed_at).toLocaleDateString('vi-VN')}` : ''}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nút hành động của chuyên gia */}
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {lesson.approval_status !== 'APPROVED' && (
                        <button
                          onClick={() => handleApprove(lesson)}
                          style={{
                            backgroundColor: '#10B981',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '12px',
                            padding: '10px 16px',
                            fontFamily: 'Fredoka, sans-serif',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            boxShadow: '0 3px 0 #059669'
                          }}
                        >
                          ✓ Phê Duyệt Chuẩn
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenRejectModal(lesson)}
                        style={{
                          backgroundColor: '#FEE2E2',
                          color: '#B91C1C',
                          border: '1.5px solid #FCA5A5',
                          borderRadius: '12px',
                          padding: '10px 16px',
                          fontFamily: 'Fredoka, sans-serif',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        ✍️ Góp Ý / Trả Về
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: KHUNG TIÊU CHUẨN SƯ PHẠM 3 - 8 TUỔI ================= */}
      {activeTab === 'standards' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: '2px solid #E2E8F0'
          }}>
            <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '24px', fontWeight: 800, color: '#1E293B', marginBottom: '8px' }}>
              Khung Đánh Giá & Thẩm Định Sư Phạm Tiếng Anh Mầm Non & Tiểu Học
            </h2>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.6 }}>
              Dành cho chuyên gia giáo dục tham chiếu khi phê duyệt giáo án, bài học tương tác, video và trắc nghiệm cho trẻ từ 3 đến 8 tuổi.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '18px' }}>
            {standards.map((std, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  padding: '22px',
                  border: '2px solid #E2E8F0',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.02)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                <div style={{
                  backgroundColor: '#F5F3FF',
                  color: '#6D28D9',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 800,
                  fontSize: '13px',
                  display: 'inline-block',
                  width: 'fit-content'
                }}>
                  ĐỘ TUỔI: {std.age}
                </div>

                <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: 800, color: '#1E293B' }}>
                  {std.focus}
                </h3>

                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '6px' }}>
                    TIÊU CHÍ BẮT BUỘC KHI PHÊ DUYỆT:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                    {std.criteria.map((c, cIdx) => (
                      <li key={cIdx} style={{ marginBottom: '4px' }}>{c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= MODAL GÓP Ý / TRẢ VỀ CHỈNH SỬA ================= */}
      {rejectModalLesson && (
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
            maxWidth: '560px',
            width: '100%',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  backgroundColor: '#FEE2E2',
                  color: '#991B1B',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '12px',
                  fontFamily: 'Fredoka, sans-serif'
                }}>
                  ✍️ PHẢN HỒI KIỂM ĐỊNH SƯ PHẠM
                </span>
                <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 800, color: '#1E293B', marginTop: '6px' }}>
                  Góp Ý Bài Học: {rejectModalLesson.title}
                </h3>
              </div>
              <button
                onClick={() => setRejectModalLesson(null)}
                style={{ border: 'none', background: 'none', fontSize: '24px', cursor: 'pointer', color: '#94A3B8' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#64748B', lineHeight: 1.5, margin: 0 }}>
              Ghi chú phản biện sư phạm của chuyên gia sẽ được lưu trực tiếp vào cơ sở dữ liệu để đội ngũ biên soạn nội dung hoàn thiện lại bài học.
            </p>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: '#334155', marginBottom: '6px' }}>
                Nội dung góp ý sư phạm (Review Notes):
              </label>
              <textarea
                rows={4}
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="Ví dụ: Giọng đọc audio cần giảm tốc độ cho trẻ 3-4 tuổi, hình ảnh minh họa cần tươi sáng hơn..."
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #CBD5E1',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
              <button
                onClick={handleSubmitReject}
                disabled={submittingReview}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#DC2626',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #991B1B'
                }}
              >
                {submittingReview ? 'Đang lưu...' : 'Gửi Phản Biện & Yêu Cầu Sửa'}
              </button>

              <button
                onClick={() => setRejectModalLesson(null)}
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
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
