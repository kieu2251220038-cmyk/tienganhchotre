import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../services/courseService';
import { progressService, type LessonRewardResult } from '../../services/progressService';
import { authService } from '../../services/authService';
import type { Lesson, Vocabulary } from '../../types';
import { speakEnglish, sounds } from '../../utils/soundEffects';
import RewardPopup from '../../components/RewardPopup';

export default function VideoLesson() {
  const { lessonId = '2' } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [vocabList, setVocabList] = useState<Vocabulary[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [reward, setReward] = useState<LessonRewardResult | null>(null);
  const videoSource = lesson?.sample_materials_url?.startsWith('http')
    ? lesson.sample_materials_url
    : 'https://www.youtube.com/embed/t99ULJjCsaM?autoplay=0';

  useEffect(() => {
    courseService.getLessonDetail(Number(lessonId)).then((res) => {
      setLesson(res.lesson);
      setVocabList(res.vocabularies);
    });
  }, [lessonId]);

  const handleMarkComplete = () => {
    setIsCompleted(true);
    const user = authService.getCurrentUser();
    progressService.completeLesson(user.id, Number(lessonId), 100, 3).then((r) => {
      if (r) setReward(r);
    });
  };

  const handlePronounceWord = (word: string) => {
    sounds.playClick();
    speakEnglish(word);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '28px', alignItems: 'start' }}>
      {reward && (
        <RewardPopup
          reward={reward}
          lessonTitle={lesson?.title || 'Bài Học Video'}
          onContinue={() => { setReward(null); navigate('/dashboard'); }}
          onClose={() => setReward(null)}
        />
      )}
      {/* ================= KHUNG VIDEO CHÍNH VÀ THÔNG TIN ================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Khung Video trung tâm */}
        <div style={{
          backgroundColor: '#000000',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '3px solid #E2E8F0',
          boxShadow: '0 8px 0 #CBD5E1',
          aspectRatio: '16/9',
          position: 'relative'
        }}>
          <iframe
            src={videoSource}
            title="Kids English Video Lesson"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>

        {/* Thông tin bài học & Nút hoàn thành */}
        <div className="card-kid">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{
                display: 'inline-block',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                padding: '4px 12px',
                borderRadius: '999px',
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '8px'
              }}>
                🎬 BÀI HỌC VIDEO
              </div>
              <h1 style={{ fontSize: '26px', color: '#1E293B', margin: 0 }}>
                {lesson?.title || 'Wild Animals - Bài Hát Muông Thú 🦁'}
              </h1>
              <p style={{ color: '#64748B', fontSize: '15px', fontWeight: 600, marginTop: '6px' }}>
                Cùng hòa theo giai điệu vui nhộn để luyện nghe và ghi nhớ các con vật trong rừng xanh nhé!
              </p>
            </div>

            <button
              onClick={handleMarkComplete}
              disabled={isCompleted}
              className={`btn-kid ${isCompleted ? 'btn-outline' : 'btn-primary'}`}
              style={{ padding: '14px 28px', fontSize: '16px' }}
            >
              {isCompleted ? '✓ Đã Hoàn Thành' : '🌟 Đánh Dấu Hoàn Thành'}
            </button>
          </div>

          {isCompleted && (
            <div style={{
              marginTop: '16px',
              backgroundColor: '#DCFCE7',
              border: '2px solid #86EFAC',
              borderRadius: '16px',
              padding: '12px 20px',
              color: '#166534',
              fontWeight: 700,
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🎉</span>
              <span>Tuyệt vời! Bé đã nhận được +3 Ngôi Sao ⭐ và hoàn thành bài học video!</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= CỘT TỪ VỰNG LIÊN QUAN & BÀI TIẾP THEO ================= */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Từ vựng trong Video */}
        <div className="card-kid">
          <h3 style={{ fontSize: '22px', color: '#1E293B', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '32px' }}>🔤</span>
            <span>Từ Vựng Trong Video</span>
          </h3>
            <p style={{ fontSize: '15px', color: '#64748B', fontWeight: 600, marginBottom: '14px' }}>
            Bé chạm vào từng từ để nghe phát âm chuẩn nhé:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {vocabList.slice(0, 4).map((v) => (
              <div
                key={v.id}
                onClick={() => handlePronounceWord(v.word)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  backgroundColor: '#F8FAFC',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '40px' }}>
                    {v.word === 'Dog' ? '🐶' : v.word === 'Cat' ? '🐱' : v.word === 'Bird' ? '🐦' : '🐘'}
                  </span>
                  <div>
                    <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 800, fontSize: '21px', color: '#1E293B' }}>
                      {v.word}
                    </div>
                    <div style={{ fontSize: '15px', color: '#64748B' }}>
                      {v.meaning_vi} • {v.phonetic}
                    </div>
                  </div>
                </div>
                <button
                  className="btn-kid btn-primary"
                  style={{ width: '48px', height: '48px', padding: 0, borderRadius: '50%', fontSize: '23px' }}
                >
                  🔊
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Bài tiếp theo */}
        <div className="card-kid">
          <h3 style={{ fontSize: '18px', color: '#1E293B', marginBottom: '12px' }}>
            Chặng Tiếp Theo 🚀
          </h3>
          <div
            onClick={() => { sounds.playClick(); navigate('/lessons/3/quiz'); }}
            style={{
              padding: '14px',
              backgroundColor: '#FEF3C7',
              border: '2px solid #FDE68A',
              borderRadius: '16px',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '32px' }}>🎯</span>
              <div>
                <div style={{ fontFamily: 'Fredoka, sans-serif', fontWeight: 700, fontSize: '15px', color: '#92400E' }}>
                  Quiz: Đoán Tên Con Vật
                </div>
                <div style={{ fontSize: '12px', color: '#B45309', fontWeight: 600 }}>
                  Thử thách 3 câu hỏi trắc nghiệm hình ảnh
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
