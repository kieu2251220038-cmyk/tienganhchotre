import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculumService';
import type { SearchMaterialsParams, LessonPedagogyDetailResponse } from '../../services/curriculumService';
import type { CurriculumStage, Lesson } from '../../types';
import { sounds } from '../../utils/soundEffects';

export default function Curriculum() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'roadmap' | 'materials'>('roadmap');
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [keyword, setKeyword] = useState<string>('');
  const [onlyApproved, setOnlyApproved] = useState<boolean>(true);

  const [roadmap, setRoadmap] = useState<CurriculumStage[]>([]);
  const [materials, setMaterials] = useState<Lesson[]>([]);
  const [totalMaterials, setTotalMaterials] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal xem chi tiết giáo án & tài liệu mẫu
  const [pedagogyModal, setPedagogyModal] = useState<LessonPedagogyDetailResponse | null>(null);

  // Fetch roadmap
  useEffect(() => {
    setLoading(true);
    curriculumService.getRoadmap()
      .then((data) => setRoadmap(data))
      .catch((err) => console.error('Lỗi tải roadmap:', err))
      .finally(() => setLoading(false));
  }, []);

  // Fetch materials when filters change
  useEffect(() => {
    const params: SearchMaterialsParams = {
      age: selectedAge,
      type: selectedType,
      keyword: keyword.trim() || undefined,
      approval: onlyApproved ? 'APPROVED' : 'all'
    };
    curriculumService.searchMaterials(params)
      .then((res) => {
        setMaterials(res.lessons);
        setTotalMaterials(res.total);
      })
      .catch((err) => console.error('Lỗi tìm kiếm tài liệu:', err));
  }, [selectedAge, selectedType, keyword, onlyApproved]);

  const handleOpenPedagogy = async (lessonId: number) => {
    sounds.playClick();
    try {
      const data = await curriculumService.getLessonPedagogy(lessonId);
      setPedagogyModal(data);
    } catch (err) {
      console.error('Lỗi xem giáo án:', err);
    }
  };

  const handleStartLesson = (lesson: Lesson) => {
    sounds.playClick();
    if (lesson.lesson_type === 'FLASHCARD') {
      navigate(`/lessons/${lesson.topic_id}/flashcard?lessonId=${lesson.id}`);
    } else if (lesson.lesson_type === 'VIDEO') {
      navigate(`/lessons/${lesson.id}/video`);
    } else if (lesson.lesson_type === 'SPEAKING') {
      navigate(`/speaking?age=${lesson.target_age || lesson.age_group || ''}&topicId=${lesson.topic_id}&lessonId=${lesson.id}`);
    } else if (lesson.lesson_type === 'QUIZ') {
      navigate(`/lessons/${lesson.id}/quiz`);
    } else if (lesson.lesson_type === 'GAME') {
      navigate(`/game?gameId=${lesson.mini_game_id}&lessonId=${lesson.id}`);
    }
  };

  const ageBadges = [
    { key: 'all', label: 'Tất Cả Độ Tuổi', icon: '🌟' },
    { key: '3', label: '3 Tuổi (A-Z, âm chữ cái & từ vựng)', icon: '🐣' },
    { key: '4', label: '4 Tuổi (Số đếm & Hình khối)', icon: '🐥' },
    { key: '5', label: '5 Tuổi (Gia đình & Cơ thể)', icon: '🐼' },
    { key: '6', label: '6 Tuổi (Chuẩn bị vào Lớp 1)', icon: '🦊' },
    { key: '7', label: '7 Tuổi (Sinh hoạt, thời tiết & đồ ăn)', icon: '🦁' },
    { key: '8', label: '8 Tuổi (Nghề nghiệp & Thiên nhiên)', icon: '🚀' },
  ];

  const typeBadges = [
    { key: 'all', label: 'Tất Cả Dạng Bài', icon: '🎯' },
    { key: 'FLASHCARD', label: 'Thẻ Từ Flashcard', icon: '🃏' },
    { key: 'VIDEO', label: 'Video Hoạt Hình', icon: '🎬' },
    { key: 'QUIZ', label: 'Trắc Nghiệm Quiz', icon: '❓' },
    { key: 'GAME', label: 'Trò Chơi Tương Tác', icon: '🎮' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* ================= HERO HEADER ================= */}
      <section style={{
        background: 'linear-gradient(135deg, #F0FDF4 0%, #E0F2FE 50%, #FAF5FF 100%)',
        border: '3px solid #86EFAC',
        borderRadius: '28px',
        padding: '36px 32px',
        boxShadow: '0 8px 0 #BBF7D0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ maxWidth: '720px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              padding: '6px 16px',
              borderRadius: '999px',
              fontWeight: 800,
              fontSize: '13px',
              marginBottom: '14px',
              boxShadow: '0 3px 0 #059669'
            }}>
              <span>📚 KHO TÀI LIỆU & LỘ TRÌNH BÀI MẪU CHO TRẺ (3 - 8 TUỔI)</span>
            </div>

            <h1 style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '34px',
              fontWeight: 800,
              color: '#064E3B',
              lineHeight: 1.25,
              marginBottom: '12px'
            }}>
              Tìm Tài Liệu Phù Hợp Từng Giai Đoạn Phát Triển Của Bé 🎈
            </h1>

            <p style={{ fontSize: '16px', color: '#047857', fontWeight: 600, lineHeight: 1.6, marginBottom: '20px' }}>
              Chương trình chuẩn hóa khoa học theo 6 độ tuổi: <strong>3 tuổi học bảng chữ cái A-B-C</strong>, <strong>4 tuổi học số đếm 1-10 & hình khối</strong>, <strong>5 tuổi học gia đình & cơ thể</strong>, <strong>6 tuổi học trường học & câu ngắn</strong>, <strong>7 tuổi học thời tiết & hội thoại</strong>, <strong>8 tuổi học đọc hiểu & viết câu</strong>. Toàn bộ bài học được kiểm định bởi <strong>Chuyên gia giáo dục</strong>!
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                onClick={() => { sounds.playClick(); setActiveTab('roadmap'); }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '14px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'roadmap' ? '#10B981' : '#FFFFFF',
                  color: activeTab === 'roadmap' ? '#FFFFFF' : '#047857',
                  boxShadow: activeTab === 'roadmap' ? '0 4px 0 #059669' : '0 3px 0 #D1D5DB'
                }}
              >
                🗺️ Lộ Trình 6 Bậc Học (3 - 8T)
              </button>

              <button
                onClick={() => { sounds.playClick(); setActiveTab('materials'); }}
                style={{
                  padding: '10px 22px',
                  borderRadius: '14px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  border: 'none',
                  backgroundColor: activeTab === 'materials' ? '#3B82F6' : '#FFFFFF',
                  color: activeTab === 'materials' ? '#FFFFFF' : '#1D4ED8',
                  boxShadow: activeTab === 'materials' ? '0 4px 0 #1D4ED8' : '0 3px 0 #D1D5DB'
                }}
              >
                🔍 Tìm Kiếm & Học Thử Bài Mẫu ({totalMaterials} bài)
              </button>

              <button
                onClick={() => { sounds.playClick(); navigate('/expert'); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: '2px solid #8B5CF6',
                  backgroundColor: '#F5F3FF',
                  color: '#6D28D9'
                }}
                title="Dành cho chuyên gia giáo dục kiểm định bài học"
              >
                👩‍🏫 Góc Chuyên Gia Duyệt Bài
              </button>

              <button
                onClick={() => { sounds.playClick(); navigate('/parent'); }}
                style={{
                  padding: '10px 18px',
                  borderRadius: '14px',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  border: '2px solid #EC4899',
                  backgroundColor: '#FDF2F8',
                  color: '#BE185D'
                }}
                title="Dành cho phụ huynh theo dõi tiến độ của con"
              >
                👨‍👩‍👧 Dành Cho Phụ Huynh
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'center', minWidth: '180px' }}>
            <div className="animate-float" style={{ fontSize: '90px', lineHeight: 1 }}>
              🦉
            </div>
            <div style={{
              marginTop: '10px',
              backgroundColor: '#FFFFFF',
              border: '2px solid #10B981',
              borderRadius: '16px',
              padding: '6px 14px',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 800,
              fontSize: '13px',
              color: '#065F46'
            }}>
              ✓ Đã Kiểm Định Sư Phạm
            </div>
          </div>
        </div>
      </section>

      {/* ================= TAB 1: ROADMAP CHUẨN 3 - 8 TUỔI ================= */}
      {activeTab === 'roadmap' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '26px', color: '#1E293B', fontWeight: 800 }}>
                Lộ Trình Tiếng Anh Chuẩn Quốc Tế Theo 6 Độ Tuổi
              </h2>
              <p style={{ color: '#64748B', fontSize: '14px', fontWeight: 600 }}>
                Mỗi giai đoạn được thiết kế chuyên biệt phù hợp với tâm lý tiếp thu tự nhiên của bé
              </p>
            </div>

            <button
              onClick={() => { sounds.playClick(); setActiveTab('materials'); }}
              style={{
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                border: '2px solid #93C5FD',
                borderRadius: '12px',
                padding: '8px 16px',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Xem danh sách bài mẫu & tìm kiếm ➔
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', fontFamily: 'Fredoka, sans-serif', fontSize: '18px' }}>
              Đang tải lộ trình học... ⏳
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
              {roadmap.map((stage) => {
                const colorMap: Record<string, { bg: string; border: string; badge: string; accent: string }> = {
                  '3': { bg: '#FEF3C7', border: '#FCD34D', badge: '#D97706', accent: '#B45309' },
                  '4': { bg: '#E0F2FE', border: '#7DD3FC', badge: '#0284C7', accent: '#0369A1' },
                  '5': { bg: '#FCE7F3', border: '#F472B6', badge: '#DB2777', accent: '#BE185D' },
                  '6': { bg: '#DCFCE7', border: '#86EFAC', badge: '#16A34A', accent: '#15803D' },
                  '7': { bg: '#F3E8FF', border: '#C084FC', badge: '#9333EA', accent: '#7E22CE' },
                  '8': { bg: '#FFEDD5', border: '#FDBA74', badge: '#EA580C', accent: '#C2410C' }
                };
                const c = colorMap[stage.age_group] || colorMap['3'];

                return (
                  <div
                    key={stage.course_id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: `2.5px solid ${c.border}`,
                      borderRadius: '24px',
                      padding: '24px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: '0 6px 16px rgba(0,0,0,0.04)',
                      position: 'relative',
                      transition: 'transform 0.15s ease',
                    }}
                  >
                    {/* Header bậc học */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{
                        backgroundColor: c.bg,
                        color: c.badge,
                        padding: '6px 14px',
                        borderRadius: '999px',
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 800,
                        fontSize: '13px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>BẬC {stage.age_group} TUỔI</span>
                        <span>•</span>
                        <span>{stage.cefr}</span>
                      </div>

                      <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                        {stage.topics.length} Chủ đề ({stage.topics.reduce((acc, t) => acc + (t.lesson_count || 0), 0)} bài)
                      </span>
                    </div>

                    <div>
                      <h3 style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '20px',
                        fontWeight: 800,
                        color: '#1E293B',
                        marginBottom: '6px'
                      }}>
                        {stage.title}
                      </h3>
                      <p style={{ fontSize: '13px', color: '#64748B', fontWeight: 600, lineHeight: 1.5 }}>
                        {stage.summary}
                      </p>
                    </div>

                    {/* Trọng tâm cốt lõi */}
                    <div style={{ backgroundColor: '#F8FAFC', padding: '12px 14px', borderRadius: '16px', border: '1.5px solid #E2E8F0' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                        🎯 MỤC TIÊU CỐT LÕI ĐỘ TUỔI {stage.age_group}:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {stage.coreFocus.map((f, i) => (
                          <span
                            key={i}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #CBD5E1',
                              borderRadius: '8px',
                              padding: '3px 8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#334155'
                            }}
                          >
                            ✓ {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Danh sách chủ đề & bài học tiêu biểu */}
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                        📖 CHỦ ĐỀ & BÀI HỌC MẪU:
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {stage.topics.map((t) => (
                          <div
                            key={t.id}
                            style={{
                              backgroundColor: '#F8FAFC',
                              padding: '10px 12px',
                              borderRadius: '12px',
                              border: '1px solid #E2E8F0',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>
                                {t.name}
                              </div>
                              <div style={{ fontSize: '14px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                                Từ vựng: {t.vocabularies?.map(v => v.word).join(', ') || 'Đang cập nhật'}
                              </div>
                            </div>
                            <span style={{ fontSize: '11px', backgroundColor: '#E2E8F0', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                              {t.lesson_count || 0} bài
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nút hành động */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: 'auto', paddingTop: '10px' }}>
                      <button
                        onClick={() => {
                          setSelectedAge(stage.age_group);
                          setActiveTab('materials');
                        }}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: c.bg,
                          color: c.accent,
                          fontFamily: 'Fredoka, sans-serif',
                          fontWeight: 800,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                      >
                        Khám Phá Bài Mẫu {stage.age_group}T ➔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 2: TÌM KIẾM & BÀI HỌC MẪU ================= */}
      {activeTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hộp bộ lọc đa tiêu chí */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: '2px solid #E2E8F0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {/* Ô tìm kiếm từ khóa */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Nhập từ khóa: chữ cái, số đếm, gia đình, động vật, school..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    fontSize: '15px',
                    fontWeight: 600,
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '14px', color: '#047857' }}>
                <input
                  type="checkbox"
                  checked={onlyApproved}
                  onChange={(e) => setOnlyApproved(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>✓ Chỉ bài đã duyệt chuẩn Sư Phạm</span>
              </label>
            </div>

            {/* Lọc theo độ tuổi (3 - 8 tuổi) */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                👶 CHỌN ĐỘ TUỔI CỦA BÉ:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {ageBadges.map((badge) => {
                  const active = selectedAge === badge.key;
                  return (
                    <button
                      key={badge.key}
                      onClick={() => { sounds.playClick(); setSelectedAge(badge.key); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: active ? '2px solid #10B981' : '1.5px solid #E2E8F0',
                        backgroundColor: active ? '#ECFDF5' : '#FFFFFF',
                        color: active ? '#065F46' : '#475569'
                      }}
                    >
                      <span>{badge.icon}</span> {badge.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lọc theo loại bài học */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: '#475569', marginBottom: '8px' }}>
                🎯 LOẠI BÀI HỌC TƯƠNG TÁC:
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {typeBadges.map((badge) => {
                  const active = selectedType === badge.key;
                  return (
                    <button
                      key={badge.key}
                      onClick={() => { sounds.playClick(); setSelectedType(badge.key); }}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '12px',
                        fontFamily: 'Fredoka, sans-serif',
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        border: active ? '2px solid #3B82F6' : '1.5px solid #E2E8F0',
                        backgroundColor: active ? '#EFF6FF' : '#FFFFFF',
                        color: active ? '#1D4ED8' : '#475569'
                      }}
                    >
                      <span>{badge.icon}</span> {badge.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tiêu đề kết quả tìm kiếm */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: 800, color: '#334155' }}>
              Tìm thấy {materials.length} bài học mẫu phù hợp
            </span>
            <span style={{ fontSize: '13px', color: '#64748B' }}>
              Độ tuổi: {selectedAge === 'all' ? 'Tất cả 3 - 8T' : `Bé ${selectedAge} Tuổi`} • Dạng: {selectedType === 'all' ? 'Tất cả' : selectedType}
            </span>
          </div>

          {/* Grid danh sách bài mẫu */}
          {materials.length === 0 ? (
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '20px',
              padding: '48px',
              textAlign: 'center',
              border: '2px dashed #CBD5E1'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🔍</div>
              <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '20px', fontWeight: 700, color: '#475569' }}>
                Không tìm thấy bài học nào phù hợp với bộ lọc!
              </div>
              <p style={{ color: '#94A3B8', fontSize: '14px', marginTop: '6px' }}>
                Thử chọn "Tất cả độ tuổi" hoặc xóa từ khóa tìm kiếm để xem nhiều bài hơn.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
              {materials.map((lesson) => {
                const typeInfo: Record<string, { label: string; icon: string; color: string; bg: string }> = {
                  'FLASHCARD': { label: 'Thẻ Từ Flashcard', icon: '🃏', color: '#D97706', bg: '#FEF3C7' },
                  'VIDEO': { label: 'Video Hoạt Hình', icon: '🎬', color: '#2563EB', bg: '#EFF6FF' },
                  'QUIZ': { label: 'Trắc Nghiệm Quiz', icon: '❓', color: '#7C3AED', bg: '#F5F3FF' },
                  'GAME': { label: 'Mini Game Ghép Từ', icon: '🎮', color: '#059669', bg: '#ECFDF5' },
                };
                const t = typeInfo[lesson.lesson_type] || typeInfo['FLASHCARD'];

                return (
                  <div
                    key={lesson.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '2px solid #E2E8F0',
                      borderRadius: '20px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.03)',
                      position: 'relative'
                    }}
                  >
                    {/* Header card */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        backgroundColor: t.bg,
                        color: t.color,
                        padding: '4px 10px',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 800,
                        fontFamily: 'Fredoka, sans-serif'
                      }}>
                        {t.icon} {t.label}
                      </span>

                      <span style={{
                        backgroundColor: '#F1F5F9',
                        color: '#334155',
                        padding: '3px 10px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}>
                        Độ tuổi: {lesson.target_age || lesson.age_group || '3-8'}T
                      </span>
                    </div>

                    {/* Tên bài học */}
                    <div>
                      <h4 style={{
                        fontFamily: 'Fredoka, sans-serif',
                        fontSize: '18px',
                        fontWeight: 800,
                        color: '#1E293B',
                        marginBottom: '4px',
                        lineHeight: 1.3
                      }}>
                        {lesson.title}
                      </h4>
                      <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                        Thuộc chủ đề: {lesson.topic_name} ({lesson.course_title})
                      </span>
                    </div>

                    {/* Mục tiêu học tập */}
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      color: '#475569',
                      lineHeight: 1.45,
                      border: '1px solid #E2E8F0'
                    }}>
                      <strong>🎯 Mục tiêu đầu ra:</strong> {lesson.learning_outcomes || 'Bé nhận biết mặt chữ/số và luyện phát âm chuẩn qua tương tác trực quan.'}
                    </div>

                    {/* Preview từ vựng mẫu nếu có */}
                    {lesson.vocab_preview && lesson.vocab_preview.length > 0 && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {lesson.vocab_preview.map((v, idx) => (
                          <span
                            key={idx}
                            style={{
                              backgroundColor: '#F1F5F9',
                              padding: '5px 10px',
                              borderRadius: '8px',
                              fontSize: '14px',
                              fontWeight: 700,
                              color: '#334155'
                            }}
                          >
                            {v.word} ({v.meaning_vi})
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Badge kiểm duyệt chuyên gia */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#059669', fontWeight: 700 }}>
                      <span>✓ Đã được {lesson.reviewer_name || 'Chuyên Gia Giáo Dục'} duyệt chuẩn sư phạm</span>
                    </div>

                    {/* Nút thao tác */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '8px' }}>
                      <button
                        onClick={() => handleStartLesson(lesson)}
                        style={{
                          flex: 1,
                          padding: '10px',
                          borderRadius: '12px',
                          border: 'none',
                          backgroundColor: '#10B981',
                          color: '#FFFFFF',
                          fontFamily: 'Fredoka, sans-serif',
                          fontWeight: 700,
                          fontSize: '14px',
                          cursor: 'pointer',
                          boxShadow: '0 3px 0 #059669'
                        }}
                      >
                        🚀 Học Thử Ngay
                      </button>

                      <button
                        onClick={() => handleOpenPedagogy(lesson.id)}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '12px',
                          border: '1.5px solid #CBD5E1',
                          backgroundColor: '#F8FAFC',
                          color: '#475569',
                          fontFamily: 'Fredoka, sans-serif',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer'
                        }}
                        title="Xem tài liệu giáo án và hướng dẫn giảng dạy của chuyên gia"
                      >
                        📄 Giáo Án Mẫu
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= MODAL GIÁO ÁN & HƯỚNG DẪN SƯ PHẠM ================= */}
      {pedagogyModal && (
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
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span style={{
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontWeight: 800,
                  fontSize: '12px',
                  fontFamily: 'Fredoka, sans-serif'
                }}>
                  📄 GIÁO ÁN & TÀI LIỆU SƯ PHẠM MẪU
                </span>
                <h3 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', fontWeight: 800, color: '#1E293B', marginTop: '6px' }}>
                  {pedagogyModal.lesson.title}
                </h3>
                <span style={{ fontSize: '13px', color: '#64748B' }}>
                  Độ tuổi: {pedagogyModal.lesson.target_age || pedagogyModal.lesson.age_group} Tuổi • Chủ đề: {pedagogyModal.lesson.topic_name}
                </span>
              </div>
              <button
                onClick={() => setPedagogyModal(null)}
                style={{
                  border: 'none',
                  background: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#94A3B8'
                }}
              >
                ✕
              </button>
            </div>

            {/* Mục tiêu đầu ra */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '14px', border: '1.5px solid #E2E8F0' }}>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#334155', marginBottom: '4px' }}>
                🎯 MỤC TIÊU ĐẦU RA SƯ PHẠM (LEARNING OUTCOMES):
              </div>
              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: 0 }}>
                {pedagogyModal.lesson.learning_outcomes}
              </p>
            </div>

            {/* Hướng dẫn dành cho phụ huynh */}
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#047857', marginBottom: '8px' }}>
                👨‍👩‍👧 Lời khuyên dành cho phụ huynh khi đồng hành cùng bé:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                {pedagogyModal.teaching_guide.parent_tips.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Tiêu chuẩn kiểm định chuyên gia */}
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#6D28D9', marginBottom: '8px' }}>
                👩‍🏫 Tiêu chí thẩm định của chuyên gia giáo dục:
              </div>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', lineHeight: 1.6 }}>
                {pedagogyModal.teaching_guide.expert_standards.map((std, idx) => (
                  <li key={idx} style={{ marginBottom: '4px' }}>{std}</li>
                ))}
              </ul>
            </div>

            {/* Từ vựng đi kèm */}
            {pedagogyModal.vocabularies.length > 0 && (
              <div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#475569', marginBottom: '8px' }}>
                  📚 Danh mục từ vựng trọng tâm trong bài:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                  {pedagogyModal.vocabularies.map((v) => (
                    <div key={v.id} style={{ backgroundColor: '#F1F5F9', padding: '8px 10px', borderRadius: '10px', fontSize: '12px' }}>
                      <strong style={{ color: '#0F172A' }}>{v.word}</strong> <span style={{ color: '#64748B' }}>{v.phonetic}</span>
                      <div style={{ color: '#475569', marginTop: '2px' }}>{v.meaning_vi}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nút hành động trong modal */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                onClick={() => {
                  setPedagogyModal(null);
                  handleStartLesson(pedagogyModal.lesson);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '14px',
                  border: 'none',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontWeight: 700,
                  fontSize: '15px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #059669'
                }}
              >
                🚀 Vào Học Bài Ngay
              </button>

              <button
                onClick={() => setPedagogyModal(null)}
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
    </div>
  );
}
