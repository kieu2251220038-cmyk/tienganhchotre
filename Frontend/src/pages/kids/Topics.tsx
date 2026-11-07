import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import type { Course, Topic } from '../../types';
import { sounds } from '../../utils/soundEffects';

export default function Topics() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    courseService.getCourses()
      .then(setCourses)
      .catch(() => setError('Không thể tải danh sách khóa học từ Backend.'))
      .finally(() => setCoursesLoading(false));
  }, []);

  useEffect(() => {
    setTopicsLoading(true);
    setError('');
    const courseId = selectedCourseId === 'all' ? 'all' : Number(selectedCourseId);
    courseService.getTopicsByCourse(courseId)
      .then(setTopics)
      .catch(() => setError('Không thể tải danh sách chủ đề từ Backend.'))
      .finally(() => setTopicsLoading(false));
  }, [selectedCourseId]);

  const getTopicProgress = (_id: number) => ({ status: 'NOT_STARTED', label: 'Chưa học', color: '#94A3B8', percent: 0 });
  const filteredTopics = topics.filter((topic) => selectedStatus === 'all' || getTopicProgress(topic.id).status === selectedStatus);
  const loading = coursesLoading || topicsLoading;

  const getTopicEmoji = (name: string, index: number) => {
    const emojis = ['🐶', '🎨', '🍎', '🧸', '👃', '👨‍👩‍👧', '🔢', '🔺', '🎒', '👕', '😊', '🍕', '☀️', '🏃', '🌲', '👨‍🚒', '⏰'];
    return emojis.find((emoji) => name.includes(emoji)) || emojis[index % emojis.length];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px', backgroundColor: '#FFFFFF', padding: '24px 28px', borderRadius: '24px', border: '2.5px solid #E2E8F0', boxShadow: '0 4px 0 #E2E8F0' }}>
        <div>
          <h1 style={{ fontSize: '32px', color: '#1E293B', margin: 0, fontWeight: 800 }}>Kho Từ Vựng Kỳ Diệu 📚</h1>
          <p style={{ color: '#64748B', fontSize: '16px', fontWeight: 600, marginTop: '4px' }}>Khám phá các chủ đề từ Bậc 1 (3 tuổi) đến Bậc 6 (8 tuổi), đồng bộ trực tiếp từ CSDL!</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <select value={selectedStatus} onChange={(event) => setSelectedStatus(event.target.value)} style={{ padding: '10px 16px', borderRadius: '14px', border: '2px solid #CBD5E1', fontFamily: 'Fredoka, sans-serif', fontWeight: 600, fontSize: '14px', backgroundColor: '#F8FAFC', cursor: 'pointer', color: '#334155' }}>
            <option value="all">🌟 Tất cả trạng thái</option><option value="NOT_STARTED">Chưa học</option><option value="IN_PROGRESS">Đang học</option><option value="COMPLETED">Đã hoàn thành</option>
          </select>
          <select value={selectedCourseId} onChange={(event) => setSelectedCourseId(event.target.value)} style={{ padding: '10px 16px', borderRadius: '14px', border: '2px solid #CBD5E1', fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '14px', backgroundColor: '#EFF6FF', cursor: 'pointer', color: '#1D4ED8' }}>
            <option value="all">👶 Tất cả khóa học</option>
            {courses.map((course) => <option key={course.id} value={course.id}>Bậc {course.age_group}: {course.title}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '24px', color: '#94A3B8', fontWeight: 700 }}>Đang tải danh sách chủ đề từ CSDL MySQL...</div> : error ? <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '24px', color: '#B91C1C', fontWeight: 700 }}>{error}</div> : filteredTopics.length === 0 ? <div style={{ padding: '60px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '24px', color: '#94A3B8', fontWeight: 700 }}>Không tìm thấy chủ đề phù hợp với bộ lọc đã chọn.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredTopics.map((topic, index) => {
            const progress = getTopicProgress(topic.id);
            return (
              <div key={topic.id} className="card-kid" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ width: '82px', height: '82px', borderRadius: '20px', backgroundColor: '#FEF3C7', border: '2px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', boxShadow: '0 4px 0 #FDE68A' }}>{getTopicEmoji(topic.name, index)}</div>
                  <span style={{ padding: '6px 12px', borderRadius: '999px', fontSize: '13px', fontWeight: 700, fontFamily: 'Fredoka, sans-serif', backgroundColor: '#F1F5F9', color: '#64748B', border: `1.5px solid ${progress.color}` }}>{progress.label}</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '25px', color: '#1E293B', marginBottom: '6px', fontWeight: 800 }}>{topic.name}</h3>
                  <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginBottom: '20px', lineHeight: 1.4 }}>{topic.description || 'Bé học từ vựng và câu ngắn qua hình ảnh sinh động'}</p>
                  <div style={{ marginBottom: '20px' }}><div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700, color: '#64748B', marginBottom: '6px' }}><span>Tiến độ học</span><span>{progress.percent}%</span></div><div style={{ height: '10px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}><div style={{ width: `${progress.percent}%`, height: '100%', backgroundColor: progress.color, borderRadius: '999px' }} /></div></div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}><button onClick={() => { sounds.playClick(); navigate(`/lessons/${topic.id}/flashcard`); }} className="btn-kid btn-primary" style={{ width: '100%', fontSize: '15px', padding: '12px' }}>🚀 Học ngay</button></div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
