import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminService, getAdminErrorMessage, type AdminCourse } from '../../services/adminService';

const getAgeLabel = (ageGroup: string) => `Bậc ${ageGroup} tuổi`;

export default function Courses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadCourses = async () => {
    setLoading(true);
    try {
      setCourses(await adminService.getCourses());
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể tải danh sách khóa học từ CSDL.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const handleDelete = async (course: AdminCourse) => {
    const confirmed = window.confirm(
      `Bạn có chắc muốn xóa khóa học "${course.title}"? Các chủ đề, bài học, câu hỏi, từ vựng và mini-game thuộc khóa học cũng sẽ bị xóa.`
    );
    if (!confirmed) return;

    try {
      await adminService.deleteCourse(course.id);
      setMessage('✅ Đã xóa khóa học và nội dung liên quan.');
      await loadCourses();
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể xóa khóa học.'));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>📚 Quản Lý Khóa Học</h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
            Dữ liệu được tải và lưu trực tiếp trong bảng courses của MySQL.
          </p>
        </div>
        <Link
          to="/admin/courses/new"
          style={{ backgroundColor: '#0284C7', color: '#FFFFFF', padding: '12px 20px', borderRadius: '12px', fontWeight: 800, textDecoration: 'none' }}
        >
          ➕ Thêm khóa học
        </Link>
      </div>

      {message && (
        <div style={{ padding: '14px 20px', backgroundColor: message.startsWith('✅') ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${message.startsWith('✅') ? '#86EFAC' : '#FCA5A5'}`, borderRadius: '12px', color: message.startsWith('✅') ? '#166534' : '#991B1B', fontWeight: 700 }}>
          {message}
        </div>
      )}

      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B', fontWeight: 700 }}>Đang tải khóa học từ CSDL...</div>
        ) : courses.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#64748B' }}>Chưa có khóa học nào trong CSDL.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#475569' }}>
                  <th style={{ padding: '16px 20px' }}>ID</th>
                  <th style={{ padding: '16px 20px' }}>Tên khóa học</th>
                  <th style={{ padding: '16px 20px' }}>Độ tuổi</th>
                  <th style={{ padding: '16px 20px' }}>Chủ đề</th>
                  <th style={{ padding: '16px 20px' }}>Bài học</th>
                  <th style={{ padding: '16px 20px' }}>Trạng thái</th>
                  <th style={{ padding: '16px 20px', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '16px 20px', color: '#94A3B8', fontWeight: 700 }}>#{course.id}</td>
                    <td style={{ padding: '16px 20px', minWidth: '240px' }}>
                      <div style={{ color: '#0F172A', fontWeight: 800 }}>{course.title}</div>
                      <div style={{ color: '#64748B', marginTop: '4px', maxWidth: '360px' }}>{course.description || 'Chưa có mô tả'}</div>
                    </td>
                    <td style={{ padding: '16px 20px', whiteSpace: 'nowrap' }}>{getAgeLabel(course.age_group)}</td>
                    <td style={{ padding: '16px 20px', color: '#0284C7', fontWeight: 700 }}>{course.topic_count}</td>
                    <td style={{ padding: '16px 20px', color: '#16A34A', fontWeight: 700 }}>{course.lesson_count}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ backgroundColor: course.status === 'PUBLISHED' ? '#DCFCE7' : '#F1F5F9', color: course.status === 'PUBLISHED' ? '#15803D' : '#64748B', padding: '5px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 800 }}>
                        {course.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button onClick={() => navigate(`/admin/courses/edit/${course.id}`)} style={{ padding: '7px 12px', marginRight: '8px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#0284C7', fontWeight: 700, cursor: 'pointer' }}>
                        ✏️ Sửa
                      </button>
                      <button onClick={() => void handleDelete(course)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #FCA5A5', backgroundColor: '#FFF', color: '#DC2626', fontWeight: 700, cursor: 'pointer' }}>
                        🗑️ Xóa
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
