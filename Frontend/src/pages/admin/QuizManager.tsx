import { useState, useEffect } from 'react';
import { adminService, getAdminErrorMessage, type AdminQuizQuestion, type AdminLesson } from '../../services/adminService';

const getStageLabel = (lesson: AdminLesson) => {
  if (String(lesson.age_group) === '3') {
    const ranges = ['A-J', 'K-T', 'U-Z'];
    return `Chặng ${lesson.topic_sort_order || 1}: ${ranges[(lesson.topic_sort_order || 1) - 1] || 'chữ cái'}`;
  }
  return `Bậc ${lesson.age_group || '?'} tuổi`;
};

export default function QuizManager() {
  const [questions, setQuestions] = useState<AdminQuizQuestion[]>([]);
  const [lessonsList, setLessonsList] = useState<AdminLesson[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  // Form State for Question + 4 Answers
  const [lessonId, setLessonId] = useState(3);
  const [questionText, setQuestionText] = useState('');
  const [points, setPoints] = useState(10);
  const [answers, setAnswers] = useState([
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
  ]);

  const createEmptyAnswers = () => [
    { answer_text: '', is_correct: true },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false }
  ];

  const openCreateModal = () => {
    setEditingQuestionId(null);
    setQuestionText('');
    setPoints(10);
    setAnswers(createEmptyAnswers());
    setShowModal(true);
  };

  const openEditModal = (question: AdminQuizQuestion) => {
    const existingAnswers = question.answers || [];
    setEditingQuestionId(question.id);
    setLessonId(question.lesson_id);
    setQuestionText(question.question_text);
    setPoints(question.points);
    setAnswers(Array.from({ length: 4 }, (_, index) => ({
      answer_text: existingAnswers[index]?.answer_text || '',
      is_correct: Boolean(existingAnswers[index]?.is_correct === true || Number(existingAnswers[index]?.is_correct) === 1)
    })));
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingQuestionId(null);
  };

  const loadQuestions = async () => {
    try {
      const [questionsData, lessonsData] = await Promise.all([
        adminService.getQuestions(),
        adminService.getLessons()
      ]);
      setQuestions(questionsData);
      setLessonsList(lessonsData);
      const quizLessons = lessonsData.filter((lesson) => lesson.lesson_type === 'QUIZ');
      if (quizLessons.length > 0 && !quizLessons.some((lesson) => lesson.id === lessonId)) {
        setLessonId(quizLessons[0].id);
      }
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể tải dữ liệu Quiz từ Backend.'));
    }
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const handleAnswerChange = (index: number, text: string) => {
    const updated = [...answers];
    if (updated[index]) {
      updated[index].answer_text = text;
      setAnswers(updated);
    }
  };

  const handleSelectCorrect = (index: number) => {
    const updated = answers.map((ans, i) => ({
      ...ans,
      is_correct: i === index
    }));
    setAnswers(updated);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionText.trim()) {
      setMessage('⚠️ Vui lòng nhập nội dung câu hỏi!');
      return;
    }
    if (answers.some((answer) => !answer.answer_text.trim())) {
      setMessage('⚠️ Vui lòng nhập đủ 4 phương án trả lời!');
      return;
    }
    if (answers.filter((answer) => answer.is_correct).length !== 1) {
      setMessage('⚠️ Vui lòng chọn đúng 1 đáp án đúng!');
      return;
    }

    try {
      const payload = {
        lesson_id: lessonId,
        question_text: questionText,
        points: Number(points),
        answers
      };
      if (editingQuestionId) {
        await adminService.updateQuestion(editingQuestionId, payload);
      } else {
        await adminService.createQuestion(payload);
      }

      setMessage(editingQuestionId ? '✅ Đã cập nhật thứ tự đáp án đúng!' : '✅ Tạo câu hỏi Quiz và 4 đáp án thành công!');
      closeModal();
      setQuestionText('');
      loadQuestions();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể tạo câu hỏi Quiz.'));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi Quiz này?')) {
      try {
        await adminService.deleteQuestion(id);
        setMessage('✅ Đã xóa câu hỏi thành công!');
        loadQuestions();
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage(getAdminErrorMessage(error, 'Không thể xóa câu hỏi.'));
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
            🎯 Quản Lý Bộ Câu Hỏi Quiz (A05)
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
            Thiết lập câu hỏi trắc nghiệm, hình ảnh minh họa và thiết lập đáp án đúng
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
          <span>Tạo Câu Hỏi Mới</span>
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

      <div style={{ backgroundColor: '#EFF6FF', border: '1.5px solid #BFDBFE', borderRadius: '16px', padding: '16px 20px', color: '#1E40AF', fontSize: '14px', lineHeight: 1.6 }}>
        <strong>➕ Thêm nhiều câu hỏi cho một chặng:</strong> trước hết chọn bài có loại <strong>QUIZ</strong> thuộc đúng chặng, sau đó bấm “Tạo Câu Hỏi Mới”. Mỗi lần lưu sẽ thêm một câu mới vào bộ quiz của chặng đó.
      </div>

      {/* Questions List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {questions.map((q) => (
          <div
            key={q.id}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              padding: '24px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '12px',
                  fontWeight: 700,
                  backgroundColor: '#EFF6FF',
                  color: '#2563EB',
                  marginRight: '8px'
                }}>
                  {q.lesson_title || `Bài học #${q.lesson_id}`}
                </span>
                <span style={{ fontSize: '13px', color: '#CA8A04', fontWeight: 700 }}>
                  ⭐ {q.points} Điểm
                </span>
                <h3 style={{ fontSize: '18px', color: '#0F172A', marginTop: '8px', margin: 0 }}>
                  {q.question_text}
                </h3>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => openEditModal(q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    border: '1px solid #93C5FD',
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  ✏️ Sửa đáp án
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
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
              </div>
            </div>

            {/* Answers Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px'
            }}>
              {(q.answers || []).map((ans, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '10px',
                    backgroundColor: ans.is_correct ? '#DCFCE7' : '#F8FAFC',
                    border: `1.5px solid ${ans.is_correct ? '#86EFAC' : '#E2E8F0'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <span style={{ fontWeight: 700, color: ans.is_correct ? '#166534' : '#334155', fontSize: '14px' }}>
                    {ans.answer_text}
                  </span>
                  {ans.is_correct ? (
                    <span style={{ color: '#166534', fontWeight: 800, fontSize: '12px' }}>✓ ĐÚNG</span>
                  ) : (
                    <span style={{ color: '#94A3B8', fontSize: '12px' }}>Sai</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tạo Câu Hỏi & 4 Đáp Án */}
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
            width: '560px',
            maxWidth: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ fontSize: '20px', margin: '0 0 6px 0', color: '#0F172A' }}>
              {editingQuestionId ? '✏️ Sửa Câu Hỏi Quiz & Thứ Tự Đáp Án' : '➕ Thêm Câu Hỏi Quiz & Đáp Án (A05)'}
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '20px' }}>
                  Nhập câu hỏi và 4 phương án, chọn 1 phương án là đáp án đúng. Có thể đổi đáp án đúng sang vị trí 1, 2, 3 hoặc 4.
            </p>

            <form onSubmit={handleSaveQuestion} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                  Nội dung câu hỏi:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Where is the Cat? 🐱"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Gắn vào bài học (Lesson):
                  </label>
                  <select
                    value={lessonId}
                    onChange={(e) => setLessonId(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  >
                    {lessonsList.filter((lesson) => lesson.lesson_type === 'QUIZ').length === 0 ? (
                      <option value={3}>Đang tải danh sách bài học...</option>
                    ) : (
                      lessonsList.filter((lesson) => lesson.lesson_type === 'QUIZ').map((l) => (
                        <option key={l.id} value={l.id}>
                          {getStageLabel(l)} · {l.course_title ? `[${l.course_title}] ` : ''}
                          {l.topic_name ? `${l.topic_name} ➔ ` : ''}
                          {l.title} ({l.lesson_type})
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                    Điểm thưởng:
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={50}
                    value={points}
                    onChange={(e) => setPoints(Number(e.target.value))}
                    style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* 4 Answers */}
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                  4 Phương án trả lời (Tích chọn đáp án đúng):
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {answers.map((ans, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <input
                        type="radio"
                        name="correct_ans"
                        checked={ans.is_correct}
                        onChange={() => handleSelectCorrect(idx)}
                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                        title="Đánh dấu là đáp án đúng"
                      />
                      <input
                        type="text"
                        required
                        placeholder={`Đáp án ${idx + 1} (Ví dụ: Cat, Dog...)`}
                        value={ans.answer_text}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                      />
                      {ans.is_correct && (
                        <span style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>
                          Đáp án đúng
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: '12px 20px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer', fontWeight: 600 }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '12px 28px', borderRadius: '10px', border: 'none', background: '#0284C7', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  {editingQuestionId ? 'Lưu thay đổi' : 'Lưu Câu Hỏi Quiz'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
