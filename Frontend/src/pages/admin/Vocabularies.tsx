import { useState, useEffect } from 'react';
import { adminService, getAdminErrorMessage, type AdminVocabulary, type AdminTopic, type AdminCourse } from '../../services/adminService';
import { speakEnglish } from '../../utils/soundEffects';
import { getVocabularyFallbackImage } from '../../utils/vocabularyVisuals';

export default function Vocabularies() {
  const [vocabs, setVocabs] = useState<AdminVocabulary[]>([]);
  const [topics, setTopics] = useState<AdminTopic[]>([]);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Quick Add Topic Modal State
  const [showQuickTopicModal, setShowQuickTopicModal] = useState(false);
  const [quickTopicName, setQuickTopicName] = useState('');
  const [quickCourseId, setQuickCourseId] = useState(0);

  // Form State
  const [topicId, setTopicId] = useState(0);
  const [word, setWord] = useState('');
  const [meaningVi, setMeaningVi] = useState('');
  const [phonetic, setPhonetic] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageData, setImageData] = useState('');
  const [imageName, setImageName] = useState('');

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      setMessage('⚠️ Vui lòng chọn ảnh PNG, JPG, WEBP hoặc GIF.');
      event.target.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage('⚠️ Ảnh không được vượt quá 5MB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      setImageData(result);
      setImageUrl(result);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    Promise.all([adminService.getVocabularies(), adminService.getTopics(), adminService.getCourses()])
      .then(([vocabRows, topicRows, courseRows]) => {
        setVocabs(vocabRows);
        setTopics(topicRows);
        setCourses(courseRows);
        setTopicId((currentTopicId) => topicRows.some((topic) => topic.id === currentTopicId)
          ? currentTopicId
          : (topicRows[0]?.id || 0));
        setQuickCourseId((currentCourseId) => courseRows.some((course) => course.id === currentCourseId)
          ? currentCourseId
          : (courseRows[0]?.id || 0));
      })
      .catch((error) => setMessage(getAdminErrorMessage(error, 'Không thể tải dữ liệu từ vựng, chủ đề và khóa học.')));
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setTopicId(topics[0]?.id || 0);
    setWord('');
    setMeaningVi('');
    setPhonetic('');
    setImageUrl('');
    setImageData('');
    setImageName('');
    setShowModal(true);
  };

  const openEditModal = (v: AdminVocabulary) => {
    setEditingId(v.id);
    setTopicId(v.topic_id);
    setWord(v.word);
    setMeaningVi(v.meaning_vi);
    setPhonetic(v.phonetic);
    setImageUrl(v.image_url || '');
    setImageData('');
    setImageName('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId || !word.trim() || !meaningVi.trim()) {
      setMessage('⚠️ Vui lòng điền đầy đủ Từ tiếng Anh và Nghĩa tiếng Việt!');
      return;
    }

    try {
      if (editingId) {
        await adminService.updateVocabulary(editingId, {
          topic_id: topicId,
          word,
          meaning_vi: meaningVi,
          phonetic,
          image_url: imageData ? '' : imageUrl,
          image_data: imageData || undefined,
          image_name: imageName || undefined
        });
        setMessage('✅ Cập nhật từ vựng thành công!');
      } else {
        await adminService.createVocabulary({
          topic_id: topicId,
          word,
          meaning_vi: meaningVi,
          phonetic,
          image_url: imageData ? '' : imageUrl,
          image_data: imageData || undefined,
          image_name: imageName || undefined
        });
        setMessage('✅ Thêm từ vựng mới thành công!');
      }

      setShowModal(false);
      const [updatedVocabs, updatedTopics] = await Promise.all([
        adminService.getVocabularies(),
        adminService.getTopics()
      ]);
      setVocabs(updatedVocabs);
      setTopics(updatedTopics);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể lưu từ vựng.'));
    }
  };

  const handleCreateQuickTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTopicName.trim() || !quickCourseId) {
      setMessage('⚠️ Vui lòng nhập tên chủ đề và chọn khóa học.');
      return;
    }

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
    if (window.confirm('Bạn có chắc muốn xóa từ vựng này khỏi CSDL?')) {
      try {
        await adminService.deleteVocabulary(id);
        setMessage('✅ Đã xóa từ vựng thành công!');
        const updatedVocabs = await adminService.getVocabularies();
        setVocabs(updatedVocabs);
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(getAdminErrorMessage(error, 'Không thể xóa từ vựng.'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
            🔤 Quản Lý Từ Vựng & Media (A04)
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
            Kho từ vựng kèm hình ảnh minh họa và phiên âm chuẩn IPA
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
          <span>Thêm Từ Vựng Mới</span>
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

      {/* Vocabularies Table */}
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
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Ảnh</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Từ Tiếng Anh</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Nghĩa Tiếng Việt</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Phiên Âm</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Chủ Đề</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {vocabs.map((v) => (
              <tr key={v.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ width: '52px', height: '52px', borderRadius: '10px', overflow: 'hidden', backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0' }}>
                    <img
                      src={v.image_url || getVocabularyFallbackImage(v.word)}
                      alt={v.word}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>{v.word}</span>
                    <button
                      onClick={() => speakEnglish(v.word)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}
                      title="Nghe phát âm"
                    >
                      🔊
                    </button>
                  </div>
                </td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#2563EB' }}>
                  {v.meaning_vi}
                </td>
                <td style={{ padding: '14px 20px', color: '#64748B', fontFamily: 'monospace' }}>
                  {v.phonetic || '--'}
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#FEF3C7',
                    color: '#B45309'
                  }}>
                    {v.topic_name || `Topic #${v.topic_id}`}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => openEditModal(v)}
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
                    onClick={() => handleDelete(v.id)}
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

      {/* Modal Thêm / Sửa Từ Vựng */}
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
            <h2 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#0F172A' }}>
              {editingId ? '✏️ Sửa Từ Vựng' : '➕ Thêm Từ Vựng Mới (A04)'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
              Nhập thông tin từ tiếng Anh, phiên âm IPA và nghĩa tiếng Việt
            </p>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                      setTopicId(Number(e.target.value));
                    }
                  }}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                  <option value="__NEW__">➕ Tạo chủ đề mới...</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Từ tiếng Anh (Word):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Elephant"
                    value={word}
                    onChange={(e) => setWord(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Nghĩa tiếng Việt:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Con voi"
                    value={meaningVi}
                    onChange={(e) => setMeaningVi(e.target.value)}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Phiên âm quốc tế (Phonetic IPA):
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: /ˈel.ɪ.fənt/"
                  value={phonetic}
                  onChange={(e) => setPhonetic(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Tải ảnh từ máy tính:
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={handleImageFileChange}
                  style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px dashed #94A3B8', backgroundColor: '#F8FAFC', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
                  PNG, JPG, WEBP hoặc GIF · tối đa 5MB{imageName ? ` · ${imageName}` : ''}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Hoặc dán đường dẫn ảnh (Image URL):
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    setImageData('');
                    setImageName('');
                  }}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              {imageUrl && (
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '10px' }}>
                  <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '6px' }}>Xem trước ảnh:</div>
                  <img src={imageUrl} alt="preview" style={{ maxHeight: '90px', borderRadius: '8px' }} />
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
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
                  {editingId ? 'Cập Nhật Từ' : 'Lưu Từ Vựng'}
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
              Chủ đề mới sẽ được lưu vào CSDL và tự động chọn cho từ vựng này
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
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>{course.title}</option>
                  ))}
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
