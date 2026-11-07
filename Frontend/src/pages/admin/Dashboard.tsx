import { useState, useEffect } from 'react';
import { adminService, type AdminStats } from '../../services/adminService';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats()
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title */}
      <div>
        <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
          📊 Tổng Quan Hệ Thống (Dashboard A01)
        </h1>
        <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
          Báo cáo thống kê hoạt động học tập, tài khoản người dùng và nội dung bài giảng
        </p>
      </div>

      {/* ================= THẺ THỐNG KÊ (STAT CARDS) ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
        {/* Card 1: Users */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              TỔNG NGƯỜI DÙNG
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {loading ? '...' : stats?.total_users || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, marginTop: '4px' }}>
              +12% so với tháng trước
            </div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            👥
          </div>
        </div>

        {/* Card 2: Lessons */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              TỔNG BÀI HỌC
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {loading ? '...' : stats?.total_lessons || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#0284C7', fontWeight: 600, marginTop: '4px' }}>
              Flashcard, Video, Quiz, Game
            </div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            📖
          </div>
        </div>

        {/* Card 3: Vocabularies */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              KHO TỪ VỰNG
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {loading ? '...' : stats?.total_vocabularies || 0}
            </div>
            <div style={{ fontSize: '12px', color: '#D97706', fontWeight: 600, marginTop: '4px' }}>
              Kèm hình ảnh & phiên âm IPA
            </div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🔤
          </div>
        </div>

        {/* Card 4: Completions */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
              LƯỢT HOÀN THÀNH
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#0F172A', marginTop: '6px' }}>
              {loading ? '...' : (stats?.total_completions || 0) + 14}
            </div>
            <div style={{ fontSize: '12px', color: '#9333EA', fontWeight: 600, marginTop: '4px' }}>
              Tích lũy qua bài học & game
            </div>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: '#FAF5FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
            🏆
          </div>
        </div>
      </div>

      {/* ================= BIỂU ĐỒ & DANH SÁCH BÀI HỌC MỚI ================= */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: '24px' }}>
        {/* Biểu đồ hoạt động */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '17px', color: '#0F172A', marginBottom: '4px', fontWeight: 700 }}>
            📈 Hoạt Động Học Tập Trong Tuần
          </h3>
          <p style={{ fontSize: '13px', color: '#64748B', marginBottom: '24px' }}>
            Lượng bé hoàn thành bài học mỗi ngày
          </p>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '180px', paddingBottom: '10px', borderBottom: '1px solid #E2E8F0' }}>
            {[
              { day: 'T2', val: 18, h: 60 },
              { day: 'T3', val: 24, h: 80 },
              { day: 'T4', val: 32, h: 110 },
              { day: 'T5', val: 28, h: 95 },
              { day: 'T6', val: 40, h: 140 },
              { day: 'T7', val: 48, h: 160 },
              { day: 'CN', val: 36, h: 120 }
            ].map((bar, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0284C7' }}>{bar.val}</span>
                <div style={{
                  width: '32px',
                  height: `${bar.h}px`,
                  backgroundColor: i === 5 ? '#0284C7' : '#BAE6FD',
                  borderRadius: '6px 6px 0 0'
                }}></div>
                <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>{bar.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Danh sách bài học mới nhất */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ fontSize: '17px', color: '#0F172A', marginBottom: '16px', fontWeight: 700 }}>
            ⚡ Bài Học Mới Cập Nhật
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(stats?.recent_lessons || []).map((l) => (
              <div
                key={l.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0'
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>
                    {l.title}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748B' }}>
                    Chủ đề: {l.topic_name || 'Động vật'} • {l.lesson_type}
                  </div>
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '999px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: l.status === 'PUBLISHED' ? '#DCFCE7' : '#FEF3C7',
                  color: l.status === 'PUBLISHED' ? '#166534' : '#92400E'
                }}>
                  {l.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}