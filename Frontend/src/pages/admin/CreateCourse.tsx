import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { adminService, getAdminErrorMessage, type AdminCourse } from '../../services/adminService';

export default function CreateCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId?: string }>();
  const editingId = courseId ? Number(courseId) : null;
  const isEditing = editingId !== null && Number.isInteger(editingId) && editingId > 0;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [ageGroup, setAgeGroup] = useState('3');
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>('DRAFT');
  const [loading, setLoading] = useState(Boolean(isEditing));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isEditing || !editingId) return;

    adminService.getCourses()
      .then((courses: AdminCourse[]) => {
        const course = courses.find((item) => item.id === editingId);
        if (!course) {
          setMessage('Không tìm thấy khóa học trong CSDL.');
          return;
        }
        setTitle(course.title);
        setDescription(course.description || '');
        setAgeGroup(String(course.age_group));
        setStatus(course.status);
      })
      .catch((error) => setMessage(getAdminErrorMessage(error, 'Không thể tải khóa học.')))
      .finally(() => setLoading(false));
  }, [editingId, isEditing]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setSaving(true);

    const payload = { title, description, age_group: ageGroup, status };
    try {
      if (isEditing && editingId) {
        await adminService.updateCourse(editingId, payload);
      } else {
        await adminService.createCourse(payload);
      }
      navigate('/admin/courses');
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể lưu khóa học vào CSDL.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>Đang tải khóa học...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', background: '#FFFFFF', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(15,23,42,.06)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'center', marginBottom: '22px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>{isEditing ? '✏️ Sửa khóa học' : '➕ Tạo khóa học mới'}</h1>
          <p style={{ color: '#64748B', fontSize: '14px', margin: '6px 0 0' }}>Thông tin được lưu trực tiếp vào bảng courses.</p>
        </div>
        <Link to="/admin/courses" style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'none' }}>← Danh sách</Link>
      </div>

      {message && <div style={{ padding: '12px 16px', marginBottom: '18px', borderRadius: '10px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', fontWeight: 700 }}>{message}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontWeight: 700, color: '#334155' }}>
          Tên khóa học
          <input required maxLength={255} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Tiếng Anh giao tiếp cho bé" style={{ padding: '12px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '15px' }} />
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontWeight: 700, color: '#334155' }}>
          Mô tả
          <textarea rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Mô tả ngắn về mục tiêu và nội dung khóa học" style={{ padding: '12px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '15px', resize: 'vertical' }} />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontWeight: 700, color: '#334155' }}>
            Độ tuổi
            <select value={ageGroup} onChange={(event) => setAgeGroup(event.target.value)} style={{ padding: '12px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '15px' }}>
              {[3, 4, 5, 6, 7, 8].map((age) => <option key={age} value={age}>Bậc {age} tuổi</option>)}
            </select>
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '7px', fontWeight: 700, color: '#334155' }}>
            Trạng thái
            <select value={status} onChange={(event) => setStatus(event.target.value as 'DRAFT' | 'PUBLISHED')} style={{ padding: '12px', borderRadius: '9px', border: '1px solid #CBD5E1', fontSize: '15px' }}>
              <option value="DRAFT">Bản nháp</option>
              <option value="PUBLISHED">Xuất bản</option>
            </select>
          </label>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Link to="/admin/courses" style={{ padding: '12px 20px', borderRadius: '9px', border: '1px solid #CBD5E1', color: '#475569', textDecoration: 'none', fontWeight: 700 }}>Hủy</Link>
          <button type="submit" disabled={saving} style={{ padding: '12px 22px', borderRadius: '9px', border: 'none', backgroundColor: '#0284C7', color: '#FFFFFF', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>
            {saving ? 'Đang lưu...' : 'Lưu vào CSDL'}
          </button>
        </div>
      </form>
    </div>
  );
}
