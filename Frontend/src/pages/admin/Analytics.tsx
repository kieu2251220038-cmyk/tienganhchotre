import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService';

interface AnalyticsData {
  dau: number;
  mau: number;
  wau: number;
  top_lessons: Array<{
    id: number;
    title: string;
    lesson_type: string;
    topic_name: string;
    completion_count: number;
    avg_score: number;
  }>;
  course_completion: Array<{
    id: number;
    title: string;
    age_group: string;
    total_lessons: number;
    completed_lessons: number;
    active_learners: number;
  }>;
  daily_activity: Array<{ date: string; completions: number; active_users: number }>;
  score_distribution: { excellent: number; good: number; average: number; needs_improvement: number };
  total_badges_awarded: number;
  total_stars_earned: number;
  new_users_7days: Array<{ date: string; count: number }>;
}

const LESSON_TYPE_COLOR: Record<string, string> = {
  FLASHCARD: '#3B82F6',
  VIDEO: '#8B5CF6',
  QUIZ: '#F59E0B',
  GAME: '#10B981',
};

const LESSON_TYPE_LABEL: Record<string, string> = {
  FLASHCARD: '📚 Flashcard',
  VIDEO: '🎬 Video',
  QUIZ: '🎯 Quiz',
  GAME: '🎮 Game',
};

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', fontSize: '18px', color: '#64748B' }}>
        ⏳ Đang tải dữ liệu thống kê...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#64748B' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <div>Không thể tải dữ liệu thống kê. Vui lòng kiểm tra kết nối Backend.</div>
      </div>
    );
  }

  const maxTopLesson = Math.max(...data.top_lessons.map(l => l.completion_count), 1);
  const scoreTotal = (data.score_distribution.excellent || 0) + (data.score_distribution.good || 0) + (data.score_distribution.average || 0) + (data.score_distribution.needs_improvement || 0);
  const maxDaily = Math.max(...data.daily_activity.map(d => d.completions), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
          📈 Báo Cáo & Thống Kê Hệ Thống (A09)
        </h1>
        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
          Phân tích người dùng hoạt động, tỷ lệ hoàn thành và bài học phổ biến nhất
        </p>
      </div>

      {/* ===== DAU / MAU / WAU ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        {[
          { label: 'DAU', sublabel: 'Người dùng hôm nay', value: data.dau, icon: '👤', color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
          { label: 'WAU', sublabel: 'Người dùng tuần này', value: data.wau, icon: '📅', color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE' },
          { label: 'MAU', sublabel: 'Người dùng 30 ngày', value: data.mau, icon: '🗓️', color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' },
          { label: 'Huy Hiệu', sublabel: 'Tổng huy hiệu đã trao', value: data.total_badges_awarded, icon: '🏅', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
          { label: 'Ngôi Sao', sublabel: 'Tổng sao học sinh tích lũy', value: data.total_stars_earned, icon: '⭐', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
        ].map((stat) => (
          <div key={stat.label} style={{
            backgroundColor: stat.bg,
            border: `1.5px solid ${stat.border}`,
            borderRadius: '16px',
            padding: '22px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '52px', height: '52px',
              borderRadius: '14px',
              backgroundColor: 'rgba(255,255,255,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '26px',
              flexShrink: 0
            }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: stat.color, fontWeight: 700, textTransform: 'uppercase' as const }}>{stat.label}</div>
              <div style={{ fontSize: '30px', fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{stat.sublabel}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ===== HOẠT ĐỘNG 7 NGÀY ===== */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '24px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <h2 style={{ fontSize: '18px', color: '#0F172A', margin: '0 0 20px', fontWeight: 700 }}>
          📊 Hoạt Động 7 Ngày Gần Nhất
        </h2>
        {data.daily_activity.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '160px', paddingBottom: '12px', borderBottom: '2px solid #E2E8F0' }}>
            {data.daily_activity.map((day, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#3B82F6' }}>{day.completions}</div>
                <div style={{
                  width: '100%',
                  maxWidth: '52px',
                  height: `${Math.max(8, (day.completions / maxDaily) * 120)}px`,
                  background: 'linear-gradient(180deg, #3B82F6, #1D4ED8)',
                  borderRadius: '8px 8px 0 0',
                  transition: 'height 0.4s ease'
                }} />
                <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, textAlign: 'center' as const }}>
                  {new Date(day.date).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8', fontSize: '15px' }}>
            Chưa có dữ liệu hoạt động. Học sinh cần hoàn thành bài học để tạo dữ liệu.
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* ===== TOP LESSONS ===== */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <h2 style={{ fontSize: '18px', color: '#0F172A', margin: '0 0 20px', fontWeight: 700 }}>
            🏆 Top Bài Học Được Hoàn Thành Nhiều Nhất
          </h2>
          {data.top_lessons.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.top_lessons.map((lesson, i) => (
                <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '28px', height: '28px',
                    borderRadius: '50%',
                    backgroundColor: i === 0 ? '#FEF9C3' : i === 1 ? '#F1F5F9' : '#FFF7ED',
                    color: i === 0 ? '#92400E' : i === 1 ? '#475569' : '#9A3412',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', fontWeight: 800, flexShrink: 0
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap' as const, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {lesson.title}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px', alignItems: 'center' }}>
                      <span style={{
                        fontSize: '11px',
                        backgroundColor: LESSON_TYPE_COLOR[lesson.lesson_type] + '22',
                        color: LESSON_TYPE_COLOR[lesson.lesson_type],
                        padding: '1px 6px',
                        borderRadius: '6px',
                        fontWeight: 700
                      }}>
                        {LESSON_TYPE_LABEL[lesson.lesson_type] || lesson.lesson_type}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>
                        TB: {Math.round(lesson.avg_score)} điểm
                      </span>
                    </div>
                    <div style={{ marginTop: '6px', height: '6px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${(lesson.completion_count / maxTopLesson) * 100}%`,
                        backgroundColor: LESSON_TYPE_COLOR[lesson.lesson_type] || '#3B82F6',
                        borderRadius: '999px'
                      }} />
                    </div>
                  </div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', flexShrink: 0 }}>
                    {lesson.completion_count}
                    <div style={{ fontSize: '10px', color: '#94A3B8', fontWeight: 600 }}>lần</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
              Chưa có dữ liệu
            </div>
          )}
        </div>

        {/* ===== PHÂN BỐ ĐIỂM SỐ ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{ fontSize: '18px', color: '#0F172A', margin: '0 0 16px', fontWeight: 700 }}>
              🎯 Phân Bố Điểm Số
            </h2>
            {scoreTotal > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Xuất sắc (≥90đ)', value: data.score_distribution.excellent, color: '#10B981' },
                  { label: 'Tốt (70-89đ)',    value: data.score_distribution.good,      color: '#3B82F6' },
                  { label: 'Trung bình (50-69đ)', value: data.score_distribution.average, color: '#F59E0B' },
                  { label: 'Cần cải thiện (<50đ)', value: data.score_distribution.needs_improvement, color: '#EF4444' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600, width: '145px', flexShrink: 0 }}>{row.label}</div>
                    <div style={{ flex: 1, height: '10px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${scoreTotal > 0 ? ((row.value || 0) / scoreTotal) * 100 : 0}%`,
                        backgroundColor: row.color,
                        borderRadius: '999px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', width: '32px', textAlign: 'right' as const }}>
                      {row.value || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: '14px' }}>
                Chưa có dữ liệu điểm số
              </div>
            )}
          </div>

          {/* Tỷ lệ hoàn thành khóa học */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '16px',
            border: '1px solid #E2E8F0',
            padding: '24px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
          }}>
            <h2 style={{ fontSize: '18px', color: '#0F172A', margin: '0 0 16px', fontWeight: 700 }}>
              📚 Tỷ Lệ Hoàn Thành Khóa Học
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {data.course_completion.map((course) => {
                const pct = course.total_lessons > 0
                  ? Math.round((course.completed_lessons / course.total_lessons) * 100)
                  : 0;
                return (
                  <div key={course.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>{course.title}</div>
                        <div style={{ fontSize: '11px', color: '#64748B' }}>
                          {course.age_group} tuổi · {course.active_learners} học sinh · {course.completed_lessons}/{course.total_lessons} bài
                        </div>
                      </div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444' }}>
                        {pct}%
                      </div>
                    </div>
                    <div style={{ height: '8px', backgroundColor: '#F1F5F9', borderRadius: '999px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${pct}%`,
                        backgroundColor: pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444',
                        borderRadius: '999px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
