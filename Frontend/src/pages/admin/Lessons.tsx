import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService, getAdminErrorMessage, type AdminLesson, type AdminTopic } from '../../services/adminService';

const getStageLabel = (topic: { age_group?: string; sort_order?: number }) => {
  if (String(topic.age_group) === '3') {
    const ranges = ['A-J', 'K-T', 'U-Z'];
    return `Chặng ${topic.sort_order || 1}: ${ranges[(topic.sort_order || 1) - 1] || 'chữ cái'}`;
  }
  return `Bậc ${topic.age_group || '?'} tuổi`;
};

export default function Lessons() {
  const [searchParams] = useSearchParams();
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Quick Add Topic Modal State
  const [showQuickTopicModal, setShowQuickTopicModal] = useState(false);
  const [quickTopicName, setQuickTopicName] = useState('');
  const [quickCourseId, setQuickCourseId] = useState(1);

  // Form State (A07)
  const [topicId, setTopicId] = useState(1);
  const [title, setTitle] = useState('');
  const [lessonType, setLessonType] = useState<'VIDEO' | 'FLASHCARD' | 'SPEAKING' | 'QUIZ' | 'GAME'>('FLASHCARD');
  const [difficulty, setDifficulty] = useState(1);
  const [sortOrder, setSortOrder] = useState(1);

  const loadLessons = () => {
    adminService.getLessons().then(setLessons);
  };

  const loadTopics = () => {
    adminService.getTopics().then((res) => {
      setTopics(res);
      const requestedTopicId = Number(searchParams.get('topicId'));
      if (res.length > 0) {
        setTopicId(res.some((topic) => topic.id === requestedTopicId) ? requestedTopicId : res[0].id);
      }
    });
  };

  useEffect(() => {
    loadLessons();
    loadTopics();
  }, []);

  const openCreateModal = () => {
    const initialTopicId = Number(searchParams.get('topicId')) || topicId || topics[0]?.id || 1;
    setEditingId(null);
    setTitle('');
    setTopicId(initialTopicId);
    setLessonType('FLASHCARD');
    setDifficulty(1);
    setSortOrder(Math.max(0, ...lessons.filter((lesson) => lesson.topic_id === initialTopicId).map((lesson) => lesson.sort_order)) + 1);
    setShowModal(true);
  };

  const openEditModal = (l: AdminLesson) => {
    setEditingId(l.id);
    setTitle(l.title);
    setTopicId(l.topic_id);
    setLessonType(l.lesson_type);
    setDifficulty(l.difficulty);
    setSortOrder(l.sort_order);
    setShowModal(true);
  };

  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        topic_id: Number(topicId),
        title,
        lesson_type: lessonType,
        difficulty: Number(difficulty),
        sort_order: Number(sortOrder),
      };

      if (editingId) {
        await adminService.updateLesson(editingId, payload);
        setMessage('✅ Cập nhật thành công! Bài học đang chờ Chuyên Gia duyệt lại.');
      } else {
        await adminService.createLesson(payload);
        setMessage('✅ Tạo bài học thành công! Bài học đang chờ Chuyên Gia duyệt trước khi xuất hiện với học sinh.');
      }

      setShowModal(false);
      loadLessons();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể lưu bài học.'));
    }
  };

  const handleCreateQuickTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopicName.trim()) return;

    try {
      const res = await adminService.createTopic({
        name: quickTopicName,
        course_id: Number(quickCourseId),
        sort_order: topics.length + 1,
        status: 'PUBLISHED'
      });
      setMessage('✅ Đã thêm chủ đề mới thành công!');
      const updatedTopics = await adminService.getTopics();
      setTopics(updatedTopics);
      if (res?.id) {
        setTopicId(res.id);
      }
      setShowQuickTopicModal(false);
      setQuickTopicName('');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể thêm chủ đề mới.'));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài học này khỏi CSDL?')) {
      try {
        await adminService.deleteLesson(id);
        setMessage('✅ Đã xóa bài học thành công!');
        loadLessons();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(getAdminErrorMessage(error, 'Không thể xóa bài học.'));
      }
    }
  };

  const filtered = lessons.filter((l) =>
    (typeFilter === 'ALL' || l.lesson_type === typeFilter) &&
    (topicFilter === 'ALL' || String(l.topic_id) === topicFilter)
  );
  const selectableTopics = topics.filter((topic) => topic.status === 'PUBLISHED' || String(topic.age_group) !== '3');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
            📖 Quản Lý Bài Học (A03)
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
            Thiết lập danh sách bài học Flashcard, Video, Quiz và Game theo lộ trình
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '12px',
            padding: '12px 20px',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(2, 132, 199, 0.3)'
          }}
        >
          <span>➕</span>
          <span>Tạo Bài Học Mới</span>
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: message.includes('✅') ? '#DCFCE7' : '#FEE2E2',
          color: message.includes('✅') ? '#166534' : '#991B1B',
          fontWeight: 700,
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      <div style={{
        backgroundColor: '#EFF6FF',
        border: '1.5px solid #BFDBFE',
        borderRadius: '16px',
        padding: '16px 20px',
        color: '#1E40AF',
        fontSize: '14px',
        lineHeight: 1.6
      }}>
        <strong>➕ Cách thêm bài vào từng chặng:</strong> bấm “Tạo Bài Học Mới”, chọn đúng chặng trong ô Chủ đề, rồi chọn loại bài Học chữ hoặc Quiz. Nếu muốn thêm trò chơi, hãy vào <strong>Quản Lý Mini Game</strong> để hệ thống tự tạo bài Game và nối đúng vào chặng.
      </div>

      {/* Filter Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        backgroundColor: '#FFFFFF',
        padding: '12px',
        borderRadius: '14px',
        border: '1px solid #E2E8F0'
      }}>
        {['ALL', 'FLASHCARD', 'VIDEO', 'SPEAKING', 'QUIZ', 'GAME'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: typeFilter === t ? '#0284C7' : '#F1F5F9',
              color: typeFilter === t ? '#FFFFFF' : '#475569',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer'
            }}
          >
            {t === 'ALL' ? 'Tất Cả Loại' : t}
          </button>
        ))}
        <select
          value={topicFilter}
          onChange={(e) => setTopicFilter(e.target.value)}
          style={{ marginLeft: 'auto', minWidth: '220px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #CBD5E1', color: '#475569', fontWeight: 700 }}
        >
          <option value="ALL">Tất cả chặng / chủ đề</option>
          {selectableTopics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {getStageLabel(topic)} · {topic.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lessons Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>ID</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Tiêu Đề Bài Học</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Chủ Đề (Topic)</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Loại</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Độ Khó</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Kiểm Định Chuyên Gia</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Trạng Thái</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((l) => (
              <tr key={l.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#64748B' }}>#{l.id}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                  {l.title}
                </td>
                <td style={{ padding: '14px 20px', color: '#334155' }}>
                  <div>{l.topic_name || `Chủ đề #${l.topic_id}`}</div>
                  <small style={{ color: '#0284C7', fontWeight: 800 }}>
                    {getStageLabel({ age_group: l.age_group, sort_order: l.topic_sort_order })}
                  </small>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor:
                      l.lesson_type === 'FLASHCARD' ? '#FEF3C7' :
                      l.lesson_type === 'VIDEO' ? '#EFF6FF' :
                      l.lesson_type === 'QUIZ' ? '#FDF2F8' : '#F0FDF4',
                    color:
                      l.lesson_type === 'FLASHCARD' ? '#B45309' :
                      l.lesson_type === 'VIDEO' ? '#1D4ED8' :
                      l.lesson_type === 'QUIZ' ? '#BE185D' : '#15803D'
                  }}>
                    {l.lesson_type}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: '#64748B' }}>
                  Cấp độ {l.difficulty}
                </td>
                <td style={{ padding: '14px 20px', color: '#64748B' }}>
                  Chặng {l.sort_order}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor:
                      l.approval_status === 'APPROVED' ? '#DCFCE7' :
                      l.approval_status === 'REJECTED' ? '#FEE2E2' : '#FEF3C7',
                    color:
                      l.approval_status === 'APPROVED' ? '#166534' :
                      l.approval_status === 'REJECTED' ? '#991B1B' : '#B45309'
                  }}>
                    {l.approval_status === 'APPROVED' ? '✅ Đã Duyệt' :
                     l.approval_status === 'REJECTED' ? '❌ Cần Sửa' : '⏳ Chờ Chuyên Gia Duyệt'}
                  </span>
                  {l.approval_status === 'APPROVED' && (
                    <div style={{ marginTop: '5px', fontSize: '11px', color: '#047857', fontWeight: 700 }}>
                      👩‍🏫 {l.reviewer_name || 'Chuyên gia giáo dục'}
                    </div>
                  )}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: l.status === 'PUBLISHED' ? '#DCFCE7' : '#F1F5F9',
                    color: l.status === 'PUBLISHED' ? '#166534' : '#64748B'
                  }}>
                    {l.status === 'PUBLISHED' ? 'Đã Xuất Bản' : 'Bản Nháp (Chờ Duyệt)'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => openEditModal(l)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#0284C7',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(l.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================= A07 - BIỂU MẪU THÊM & CHỈNH SỬA ================= */}
      {showModal && (
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
            padding: '32px',
            width: '540px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#0F172A' }}>
              {editingId ? '✏️ Chỉnh Sửa Bài Học' : '➕ Tạo Bài Học Mới (A07)'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
              Nhập các trường thông tin bài học theo cấu trúc CSDL `lessons`
            </p>

            <div style={{
              padding: '12px 16px',
              borderRadius: '12px',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              color: '#1E40AF',
              fontSize: '13px',
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '22px' }}>🛡️</span>
              <div>
                <strong>Quy trình kiểm định bắt buộc:</strong> Khi bạn tạo hoặc cập nhật bài học, bài sẽ được gửi sang <strong>Cổng Chuyên Gia Giáo Dục</strong> ở trạng thái <em>Chờ duyệt (PENDING)</em>. Bài học chỉ xuất hiện trên ứng dụng học sinh sau khi chuyên gia phê duyệt đạt chuẩn!
              </div>
            </div>

            <form onSubmit={handleSaveLesson} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Tiêu đề bài học:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Pets - Thú cưng quen thuộc"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                      Chủ đề (Topic):
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQuickTopicModal(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0284C7',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        padding: 0,
                        textDecoration: 'underline'
                      }}
                    >
                      + Thêm chủ đề mới
                    </button>
                  </div>
                  <select
                    value={topicId}
                    onChange={(e) => {
                      if (e.target.value === '__NEW__') {
                        setShowQuickTopicModal(true);
                      } else {
                        const nextTopicId = Number(e.target.value);
                        setTopicId(nextTopicId);
                        if (!editingId) {
                          setSortOrder(Math.max(0, ...lessons.filter((lesson) => lesson.topic_id === nextTopicId).map((lesson) => lesson.sort_order)) + 1);
                        }
                      }
                    }}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  >
                    {selectableTopics.map((t) => (
                      <option key={t.id} value={t.id}>{getStageLabel(t)} · {t.name}</option>
                    ))}
                    <option value="__NEW__">➕ Tạo chủ đề mới...</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Loại bài học:
                  </label>
                  <select
                    value={lessonType}
                    onChange={(e) => setLessonType(e.target.value as any)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  >
                    <option value="FLASHCARD">🃏 FLASHCARD (Thẻ từ)</option>
                    <option value="VIDEO">🎬 VIDEO (Video hoạt hình)</option>
                    <option value="SPEAKING">🎤 SPEAKING (Nghe và nói)</option>
                    <option value="QUIZ">🎯 QUIZ (Trắc nghiệm hình ảnh)</option>
                    <option value="GAME">🎮 GAME (Mini game ghép từ)</option>
                  </select>
                </div>
              </div>

              {lessonType === 'GAME' && (
                <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', color: '#92400E', fontSize: '13px', fontWeight: 700 }}>
                  🎮 Để thêm trò chơi có thể chơi được, hãy dùng trang “Quản Lý Mini Game”. Trang đó sẽ tự tạo bài GAME và liên kết với chặng đã chọn.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Độ khó:
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Thứ tự chặng:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

              </div>

              <div style={{
                padding: '10px 14px',
                borderRadius: '10px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                fontSize: '13px',
                fontWeight: 700
              }}>
                ⏳ Trạng thái xuất bản: Chờ Chuyên Gia duyệt. Hệ thống sẽ tự động đưa bài lên cho học sinh sau khi được phê duyệt.
              </div>

              {/* Form Action buttons */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '14px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: '#0284C7', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingId ? 'Cập Nhật Bài Học' : 'Lưu Bài Học'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL TẠO NHANH CHỦ ĐỀ ================= */}
      {showQuickTopicModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 150,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px',
            width: '460px',
            maxWidth: '100%',
            boxShadow: '0 25px 30px -5px rgba(0,0,0,0.2)'
          }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', color: '#0F172A', fontWeight: 800 }}>
              📁 Thêm Chủ Đề Mới Nhanh
            </h3>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '18px' }}>
              Chủ đề mới sẽ được lưu vào CSDL và tự động chọn cho bài học này
            </p>

            <form onSubmit={handleCreateQuickTopic} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Tên chủ đề mới:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: School - Trường học 🎒, Family 👨‍👩‍👧"
                  value={quickTopicName}
                  onChange={(e) => setQuickTopicName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Thuộc khóa học:
                </label>
                <select
                  value={quickCourseId}
                  onChange={(e) => setQuickCourseId(Number(e.target.value))}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  <option value={1}>Bậc 1: Bé 3 Tuổi - Khám Phá Mầm Non 🐣</option>
                  <option value={2}>Bậc 2: Bé 4 Tuổi - Nhận Biết Xung Quanh 🐥</option>
                  <option value={3}>Bậc 3: Bé 5 Tuổi - Gia Đình & Bạn Bè 🐼</option>
                  <option value={4}>Bậc 4: Bé 6 Tuổi - Chuẩn Bị Vào Lớp 1 🦊</option>
                  <option value={5}>Bậc 5: Bé 7 Tuổi - Tự Tin Giao Tiếp 🦁</option>
                  <option value={6}>Bậc 6: Bé 8 Tuổi - Siêu Nhí Khám Phá 🚀</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickTopicModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#FFF',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    background: '#0284C7',
                    color: '#FFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Lưu & Chọn Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
