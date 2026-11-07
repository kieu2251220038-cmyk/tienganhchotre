import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminService, getAdminErrorMessage, type AdminTopic, type AdminCourse } from '../../services/adminService';

const getStageLabel = (topic: AdminTopic) => {
  if (String(topic.age_group) === '3') {
    const ranges = ['A-J', 'K-T', 'U-Z'];
    return `Chặng ${topic.sort_order}: ${ranges[topic.sort_order - 1] || 'chữ cái'}`;
  }
  return `Bậc ${topic.age_group || '?'} tuổi`;
};

export default function TopicsManager() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [courseId, setCourseId] = useState(0);
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState(1);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');

  useEffect(() => {
    Promise.all([adminService.getTopics(), adminService.getCourses()])
      .then(([topicRows, courseRows]) => {
        setTopics(topicRows);
        setCourses(courseRows);
        setCourseId((currentCourseId) => courseRows.some((course) => course.id === currentCourseId)
          ? currentCourseId
          : (courseRows[0]?.id || 0));
      })
      .catch((error) => setMessage(getAdminErrorMessage(error, 'Không thể tải chủ đề và khóa học.')));
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setCourseId(courses[0]?.id || 0);
    setDescription('');
    setSortOrder(topics.length + 1);
    setStatus('PUBLISHED');
    setShowModal(true);
  };

  const openEditModal = (t: AdminTopic) => {
    setEditingId(t.id);
    setName(t.name);
    setCourseId(t.course_id);
    setDescription(t.description || '');
    setSortOrder(t.sort_order);
    setStatus(t.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !courseId) {
      setMessage('⚠️ Vui lòng nhập tên chủ đề!');
      return;
    }

    try {
      const payload = {
        name,
        course_id: Number(courseId),
        description,
        sort_order: Number(sortOrder),
        status
      };

      if (editingId) {
        await adminService.updateTopic(editingId, payload);
        setMessage('✅ Cập nhật chủ đề thành công!');
      } else {
        await adminService.createTopic(payload);
        setMessage('✅ Thêm chủ đề mới thành công!');
      }

      setShowModal(false);
      const updatedTopics = await adminService.getTopics();
      setTopics(updatedTopics);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể lưu chủ đề vào CSDL.'));
    }
  };

  const handleDelete = async (id: number, topicName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${topicName}"? Các bài học và từ vựng thuộc chủ đề này cũng sẽ bị xóa!`)) {
      try {
        await adminService.deleteTopic(id);
        setMessage('✅ Đã xóa chủ đề thành công!');
        const updatedTopics = await adminService.getTopics();
        setTopics(updatedTopics);
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(getAdminErrorMessage(error, 'Không thể xóa chủ đề.'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
            📁 Quản Lý Chủ Đề (Topics)
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
            Thiết lập danh mục chủ đề học tập cho các bé theo độ tuổi và khóa học
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            backgroundColor: '#0284C7',
            color: '#FFFFFF',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 800,
            fontSize: '15px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 6px -1px rgba(2, 132, 199, 0.2)'
          }}
        >
          ➕ Thêm Chủ Đề Mới
        </button>
      </div>

      {/* Thông báo Message */}
      {message && (
        <div style={{
          padding: '14px 20px',
          backgroundColor: message.includes('✅') ? '#F0FDF4' : '#FEF2F2',
          border: `1.5px solid ${message.includes('✅') ? '#86EFAC' : '#FCA5A5'}`,
          borderRadius: '12px',
          color: message.includes('✅') ? '#166534' : '#991B1B',
          fontWeight: 700,
          fontSize: '15px'
        }}>
          {message}
        </div>
      )}

      {/* Bảng danh sách chủ đề */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
              <th style={{ padding: '16px 20px' }}>ID</th>
              <th style={{ padding: '16px 20px' }}>Tên Chủ Đề</th>
              <th style={{ padding: '16px 20px' }}>Khóa Học / Độ Tuổi</th>
              <th style={{ padding: '16px 20px' }}>Mô Tả</th>
              <th style={{ padding: '16px 20px' }}>Số Bài Học</th>
              <th style={{ padding: '16px 20px' }}>Số Từ Vựng</th>
              <th style={{ padding: '16px 20px' }}>Thứ Tự</th>
              <th style={{ padding: '16px 20px' }}>Trạng Thái</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {topics.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94A3B8' }}>
                  Chưa có chủ đề nào trong CSDL. Hãy bấm "+ Thêm Chủ Đề Mới" để tạo!
                </td>
              </tr>
            ) : (
              topics.map((t) => (
                <tr key={t.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#94A3B8' }}>
                    #{t.id}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>
                    <div style={{ color: '#0284C7', fontSize: '12px', marginBottom: '4px' }}>{getStageLabel(t)}</div>
                    {t.name}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      backgroundColor: '#EFF6FF',
                      color: '#1D4ED8',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700
                    }}>
                      {t.course_title || (t.course_id === 1 ? 'Tiếng Anh 3-4 tuổi' : 'Tiếng Anh 5-6 tuổi')}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748B', maxWidth: '240px' }}>
                    {t.description || 'Chưa có mô tả'}
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#0284C7' }}>
                    📚 {t.lesson_count ?? 0} bài
                  </td>
                  <td style={{ padding: '16px 20px', fontWeight: 700, color: '#16A34A' }}>
                    🔤 {t.vocab_count ?? 0} từ
                  </td>
                  <td style={{ padding: '16px 20px', color: '#64748B', fontWeight: 600 }}>
                    Thứ tự {t.sort_order}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      backgroundColor: t.status === 'PUBLISHED' ? '#DCFCE7' : '#F1F5F9',
                      color: t.status === 'PUBLISHED' ? '#15803D' : '#64748B',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 800
                    }}>
                      {t.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openEditModal(t)}
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
                      onClick={() => navigate(`/admin/lessons?topicId=${t.id}`)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        border: '1px solid #BAE6FD',
                        backgroundColor: '#F0F9FF',
                        color: '#0369A1',
                        fontWeight: 700,
                        cursor: 'pointer',
                        marginRight: '8px'
                      }}
                    >
                      ➕ Thêm bài
                    </button>
                    <button
                      onClick={() => handleDelete(t.id, t.name)}
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
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Thêm & Sửa Chủ Đề */}
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
            width: '520px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#0F172A', fontWeight: 800 }}>
              {editingId ? '✏️ Chỉnh Sửa Chủ Đề' : '➕ Tạo Chủ Đề Mới'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
              Nhập các trường thông tin chủ đề theo cấu trúc CSDL `topics`
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Tên chủ đề (kèm emoji ngộ nghĩnh):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Fruits - Hoa quả 🍎, Vehicles - Xe cộ 🚗"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Thuộc khóa học / Độ tuổi:
                </label>
                <select
                  value={courseId}
                  onChange={(e) => setCourseId(Number(e.target.value))}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Mô tả chủ đề:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Bé học nhận biết và phát âm các loại trái cây quen thuộc..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Thứ tự sắp xếp:
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={sortOrder}
                    onChange={(e) => setSortOrder(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Trạng thái:
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  >
                    <option value="PUBLISHED">Xuất bản (Hiển thị cho bé)</option>
                    <option value="DRAFT">Bản nháp (Ẩn)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    backgroundColor: '#FFFFFF',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 24px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0284C7',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {editingId ? 'Cập Nhật' : 'Lưu Chủ Đề'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
