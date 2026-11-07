import React, { useEffect, useState } from 'react';
import API from '../services/api';

export const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    API.get('/courses')
      .then((res) => setCourses(res.data))
      .catch(() => setError('Không thể kết nối Backend. Hãy đảm bảo Backend cổng 5000 đang chạy!'));
  }, []);

  return (
    <div style={{ padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <h3 style={{ color: '#1F2937', fontSize: '22px' }}>📚 Khóa Học Dành Cho Bé</h3>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {courses.map((course) => (
          <div key={course.id} style={{ border: '1px solid #E5E7EB', padding: '20px', borderRadius: '12px', backgroundColor: '#FFFFFF', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h4 style={{ color: '#2563EB', margin: '0 0 10px 0', fontSize: '18px' }}>{course.title}</h4>
            <p style={{ fontSize: '14px', color: '#4B5563', marginBottom: '15px' }}>{course.description}</p>
            <span style={{ fontSize: '12px', backgroundColor: '#FEF3C7', color: '#D97706', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold' }}>
              Độ tuổi: {course.age_group} tuổi
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};