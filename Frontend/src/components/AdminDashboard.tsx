import React, { useState, useEffect } from 'react';
import API from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'courses' | 'vocabularies'>('vocabularies');
  
  // States quản lý dữ liệu
  const [courses, setCourses] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  
  // Form Từ vựng mới
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Tải danh sách khóa học
    API.get('/courses')
      .then((res) => {
        setCourses(res.data);
        if (res.data.length > 0) {
          // Lấy chủ đề của khóa học đầu tiên
          loadTopics(res.data[0].id);
        }
      })
      .catch((err) => console.error('Lỗi tải khóa học:', err));
  }, []);

  const loadTopics = (courseId: number) => {
    API.get(`/content/courses/${courseId}/topics`)
      .then((res) => {
        setTopics(res.data);
        if (res.data.length > 0) setSelectedTopicId(res.data[0].id.toString());
      })
      .catch((err) => console.error('Lỗi tải chủ đề:', err));
  };

  // Xử lý thêm từ vựng mới (kèm ảnh)
  const handleAddVocabulary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopicId) {
      setMessage('Vui lòng chọn chủ đề trước!');
      return;
    }

    try {
      await API.post('/content/vocabularies', {
        topicId: selectedTopicId,
        word,
        meaning,
        pronunciation,
        imageUrl
      });

      setMessage('✅ Thêm từ vựng mới thành công!');
      setWord('');
      setMeaning('');
      setPronunciation('');
      setImageUrl('');
    } catch (err: any) {
      setMessage('❌ Lỗi khi thêm từ vựng!');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ borderBottom: '2px solid #E5E7EB', paddingBottom: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ color: '#1E293B', margin: 0 }}>⚙️ Bảng Quản Trị Hệ Thống (Admin Dashboard)</h2>
        <div>
          <button 
            onClick={() => setActiveTab('vocabularies')}
            style={{ 
              padding: '8px 16px', 
              marginRight: '8px', 
              backgroundColor: activeTab === 'vocabularies' ? '#4F46E5' : '#E2E8F0', 
              color: activeTab === 'vocabularies' ? '#FFF' : '#334155',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            Quản Lý Từ Vựng & Ảnh
          </button>
          <button 
            onClick={() => setActiveTab('courses')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: activeTab === 'courses' ? '#4F46E5' : '#E2E8F0', 
              color: activeTab === 'courses' ? '#FFF' : '#334155',
              border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            Quản Lý Khóa Học
          </button>
        </div>
      </div>

      {message && (
        <div style={{ padding: '12px', backgroundColor: message.includes('✅') ? '#DEF7EC' : '#FDE8E8', color: message.includes('✅') ? '#03543F' : '#9B1C1C', borderRadius: '8px', marginBottom: '20px', fontWeight: 'bold' }}>
          {message}
        </div>
      )}

      {/* TAB 1: QUẢN LÝ TỪ VỰNG & HÌNH ẢNH */}
      {activeTab === 'vocabularies' && (
        <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
          <h3 style={{ color: '#334155', marginTop: 0 }}>📖 Thêm Từ Vựng Mới Kèm Hình Ảnh</h3>
          
          <form onSubmit={handleAddVocabulary} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Khóa học:</label>
              <select 
                onChange={(e) => loadTopics(Number(e.target.value))}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Chủ đề (Topic):</label>
              <select 
                value={selectedTopicId} 
                onChange={(e) => setSelectedTopicId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
              >
                {topics.map((t) => (
                  <option key={t.id} value={t.id}>{t.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Từ tiếng Anh (Word):</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Apple, Elephant..." 
                value={word} 
                onChange={(e) => setWord(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Nghĩa tiếng Việt:</label>
              <input 
                type="text" 
                placeholder="Ví dụ: Quả táo, Con voi..." 
                value={meaning} 
                onChange={(e) => setMeaning(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Phiên âm (Pronunciation):</label>
              <input 
                type="text" 
                placeholder="Ví dụ: /ˈæp.əl/" 
                value={pronunciation} 
                onChange={(e) => setPronunciation(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '6px', fontSize: '14px' }}>Đường dẫn ảnh (Image URL):</label>
              <input 
                type="text" 
                placeholder="Paste link ảnh online hoặc /images/apple.png" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
              />
            </div>

            {/* Khung Xem Trước Ảnh */}
            {imageUrl && (
              <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#64748B' }}>Xem trước hình ảnh:</p>
                <img src={imageUrl} alt="Preview" style={{ maxHeight: '100px', objectFit: 'contain' }} onError={(e: any) => e.target.alt = "Ảnh không hợp lệ"} />
              </div>
            )}

            <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
              <button 
                type="submit" 
                style={{ width: '100%', padding: '12px', backgroundColor: '#10B981', color: '#FFF', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}
              >
                ➕ Lưu Từ Vựng Vào Hệ Thống
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: QUẢN LÝ KHÓA HỌC */}
      {activeTab === 'courses' && (
        <div style={{ backgroundColor: '#FFF', padding: '24px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid #E2E8F0' }}>
          <h3 style={{ color: '#334155', marginTop: 0 }}>📚 Danh Sách Khóa Học Hiện Có</h3>
          <ul style={{ paddingLeft: '20px' }}>
            {courses.map((c) => (
              <li key={c.id} style={{ marginBottom: '8px', color: '#1E293B' }}>
                <strong>{c.title}</strong> - Độ tuổi: {c.age_group} tuổi ({c.description})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};