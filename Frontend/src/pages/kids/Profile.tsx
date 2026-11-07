import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { userDataService } from '../../services/userDataService';
import { progressService } from '../../services/progressService';
import { getLeagueByStars } from './Rewards';
import { sounds } from '../../utils/soundEffects';
import type { User, UserRewardsData } from '../../types';

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [rewards, setRewards] = useState<UserRewardsData | null>(null);

  // Chỉnh sửa hồ sơ
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [ageGroup, setAgeGroup] = useState('5');
  const [selectedAvatar, setSelectedAvatar] = useState('👧');
  const [savedMsg, setSavedMsg] = useState('');

  const avatarChoices = ['👧', '👦', '🦉', '🐼', '🐱', '🐶', '🐰', '🦁', '🦸', '🧙', '🐲'];

  useEffect(() => {
    const u = authService.getCurrentUser();
    setUser(u);
    setDisplayName(u.display_name || u.username);
    setAgeGroup(u.age_group || '5');
    void userDataService.migrateLegacyLocalData(u.id)
      .then(() => userDataService.getPreferences())
      .then((preferences) => setSelectedAvatar(preferences.avatar))
      .catch((error) => console.error('Không thể tải avatar từ Backend:', error));

    progressService.getUserRewards(u.id).then(setRewards);
  }, []);

  const totalStars = rewards?.total_stars || 120;
  const currentStreak = rewards?.current_streak || 1;
  const completedLessons = rewards?.completed_lessons?.length || 0;
  const league = getLeagueByStars(totalStars);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    if (user) {
      const updated: User = {
        ...user,
        display_name: displayName,
        age_group: ageGroup
      };
      try {
        await userDataService.updatePreferences({ avatar: selectedAvatar });
        authService.setCurrentUser(updated);
        setUser(updated);
        sounds.playVictory();
        setSavedMsg('✅ Đã lưu cập nhật hồ sơ thành công!');
        setIsEditing(false);
        setTimeout(() => setSavedMsg(''), 3000);
      } catch (error) {
        console.error('Không thể lưu avatar lên Backend:', error);
        setSavedMsg('⚠️ Chưa lưu được hồ sơ. Bé hãy thử lại nhé!');
      }
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ================= 1. PROFILE HEADER CARD (DUOLINGO STYLE) ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        border: '3px solid #E5E5E5',
        boxShadow: '0 8px 0 #CBD5E1',
        padding: '36px 32px',
        position: 'relative'
      }}>
        {/* Nút Chỉnh sửa ở góc phải */}
        <button
          onClick={() => { sounds.playClick(); setIsEditing(prev => !prev); }}
          style={{
            position: 'absolute',
            top: '24px',
            right: '24px',
            backgroundColor: isEditing ? '#F1F5F9' : '#FFFFFF',
            border: '2px solid #CBD5E1',
            borderRadius: '16px',
            padding: '8px 18px',
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '14px',
            fontWeight: 800,
            color: '#0284C7',
            cursor: 'pointer',
            boxShadow: '0 2px 0 #CBD5E1'
          }}
        >
          {isEditing ? '✕ Hủy Chỉnh Sửa' : '✏️ Chỉnh Sửa Hồ Sơ'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '28px', flexWrap: 'wrap' }}>
          {/* Avatar to tròn với vòng tròn đứt nét phong cách Duolingo */}
          <div style={{
            width: '110px',
            height: '110px',
            borderRadius: '50%',
            border: '4px dashed #58CC02',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F0FDF4',
            position: 'relative'
          }}>
            <div style={{
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              backgroundColor: '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '54px'
            }}>
              {selectedAvatar}
            </div>

            {/* Online green dot */}
            <div style={{
              position: 'absolute',
              bottom: '4px',
              right: '4px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#22C55E',
              border: '3px solid #FFFFFF'
            }} />
          </div>

          {/* User Details */}
          <div>
            <h1 style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '32px',
              fontWeight: 800,
              color: '#0F172A',
              margin: '0 0 4px 0'
            }}>
              {user?.display_name || user?.username}
            </h1>
            <div style={{ fontSize: '15px', color: '#64748B', fontWeight: 600, marginBottom: '6px' }}>
              @{user?.username} • Bậc học: {user?.age_group || '5'} Tuổi
            </div>
            <div style={{ fontSize: '13px', color: '#94A3B8', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span>📅 Đã tham gia: Tháng 10 2026</span>
              <span>•</span>
              <span>🇺🇸 Học Tiếng Anh Trẻ Em</span>
            </div>
          </div>
        </div>

        {/* Thông báo cập nhật thành công */}
        {savedMsg && (
          <div style={{
            marginTop: '20px',
            backgroundColor: '#DCFCE7',
            border: '2px solid #86EFAC',
            borderRadius: '16px',
            padding: '10px 18px',
            color: '#166534',
            fontSize: '14px',
            fontWeight: 700,
            textAlign: 'center'
          }}>
            {savedMsg}
          </div>
        )}

        {/* Form chỉnh sửa nếu mở */}
        {isEditing && (
          <form onSubmit={handleSaveProfile} style={{
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '2px dashed #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            <div>
              <label style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '8px' }}>
                Chọn nhân vật đại diện của bé:
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {avatarChoices.map(avt => (
                  <button
                    key={avt}
                    type="button"
                    onClick={() => { sounds.playClick(); setSelectedAvatar(avt); }}
                    style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '14px',
                      backgroundColor: selectedAvatar === avt ? '#DCFCE7' : '#F8FAFC',
                      border: selectedAvatar === avt ? '2.5px solid #22C55E' : '2px solid #E2E8F0',
                      fontSize: '22px',
                      cursor: 'pointer'
                    }}
                  >
                    {avt}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Tên gọi thân mật của bé:
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '15px',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 800, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Độ tuổi của bé (3 - 8 tuổi):
                </label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '14px',
                    border: '2px solid #CBD5E1',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '15px',
                    fontWeight: 700,
                    boxSizing: 'border-box',
                    backgroundColor: '#FFFFFF'
                  }}
                >
                  <option value="3">3 Tuổi (Bậc 1: Mầm non)</option>
                  <option value="4">4 Tuổi (Bậc 2: Nhận biết)</option>
                  <option value="5">5 Tuổi (Bậc 3: Tự tin giao tiếp)</option>
                  <option value="6">6 Tuổi (Bậc 4: Chuẩn bị vào lớp 1)</option>
                  <option value="7">7 Tuổi (Bậc 5: Siêu nhí khám phá)</option>
                  <option value="8">8 Tuổi (Bậc 6: Thám hiểm)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
              <button
                type="submit"
                style={{
                  backgroundColor: '#58CC02',
                  color: '#FFFFFF',
                  fontFamily: 'Fredoka, sans-serif',
                  fontSize: '15px',
                  fontWeight: 800,
                  padding: '12px 28px',
                  borderRadius: '14px',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 4px 0 #46A302'
                }}
              >
                💾 Lưu Thay Đổi
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ================= 2. BỐN THẺ THỐNG KÊ (STATISTICS - DUOLINGO STYLE) ================= */}
      <div>
        <h2 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '22px',
          fontWeight: 800,
          color: '#0F172A',
          marginBottom: '14px'
        }}>
          Thống kê 📊
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          {/* 1. Streak */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '2.5px solid #E5E5E5',
            boxShadow: '0 6px 0 #CBD5E1',
            padding: '20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontSize: '36px' }}>🔥</span>
            <div>
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '24px',
                fontWeight: 800,
                color: '#EA580C',
                lineHeight: 1.1
              }}>
                {currentStreak}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                Ngày streak
              </div>
            </div>
          </div>

          {/* 2. Tổng Sao */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '2.5px solid #E5E5E5',
            boxShadow: '0 6px 0 #CBD5E1',
            padding: '20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontSize: '36px' }}>⚡</span>
            <div>
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '24px',
                fontWeight: 800,
                color: '#D97706',
                lineHeight: 1.1
              }}>
                {totalStars}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                Tổng điểm KN (Sao)
              </div>
            </div>
          </div>

          {/* 3. Giải Đấu / Rank Hiện Tại */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '2.5px solid #E5E5E5',
            boxShadow: '0 6px 0 #CBD5E1',
            padding: '20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontSize: '36px' }}>{league.badge}</span>
            <div>
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '20px',
                fontWeight: 800,
                color: league.color,
                lineHeight: 1.1
              }}>
                {league.name.replace('Giải Đấu ', '')}
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                Giải đấu hiện tại
              </div>
            </div>
          </div>

          {/* 4. Số lần đạt Top 3 */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '2.5px solid #E5E5E5',
            boxShadow: '0 6px 0 #CBD5E1',
            padding: '20px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <span style={{ fontSize: '36px' }}>🏆</span>
            <div>
              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '24px',
                fontWeight: 800,
                color: '#2563EB',
                lineHeight: 1.1
              }}>
                1
              </div>
              <div style={{ fontSize: '13px', color: '#64748B', fontWeight: 700 }}>
                Số lần đạt top 3
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. THÀNH TÍCH (ACHIEVEMENTS VỚI THANH TIẾN ĐỘ - DUOLINGO STYLE) ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        border: '3px solid #E5E5E5',
        boxShadow: '0 8px 0 #CBD5E1',
        padding: '28px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h2 style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '22px',
            fontWeight: 800,
            color: '#0F172A',
            margin: 0
          }}>
            Thành tích 🌟
          </h2>
          <span style={{
            fontFamily: 'Fredoka, sans-serif',
            fontSize: '13px',
            fontWeight: 800,
            color: '#1CB0F6'
          }}>
            CÁC CỘT MỐC ĐẠT ĐƯỢC
          </span>
        </div>

        {/* Danh sách thành tích có thanh tiến trình */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Thành tích 1: Lửa rừng (Streak) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#FEE2E2',
              border: '2px solid #FCA5A5',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0
            }}>
              🔥
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#B91C1C' }}>CẤP 1</span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  Lửa rừng
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#EA580C' }}>
                  {Math.min(currentStreak, 3)} / 3
                </span>
              </div>
              <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (currentStreak / 3) * 100)}%`,
                  backgroundColor: '#EA580C',
                  borderRadius: '999px'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                Đạt chuỗi 3 ngày streak học tập chăm chỉ
              </div>
            </div>
          </div>

          {/* Thành tích 2: Cao nhân (Kiếm sao) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#FEF3C7',
              border: '2px solid #FDE68A',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0
            }}>
              🧙
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#B45309' }}>CẤP 1</span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  Cao nhân
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#D97706' }}>
                  {Math.min(totalStars, 100)} / 100
                </span>
              </div>
              <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (totalStars / 100) * 100)}%`,
                  backgroundColor: '#F59E0B',
                  borderRadius: '999px'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                Kiếm đủ 100 KN (Ngôi Sao) qua các bài học
              </div>
            </div>
          </div>

          {/* Thành tích 3: Quán quân (Hoàn thành bài học mở khóa bảng xếp hạng) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#EDE9FE',
              border: '2px solid #DDD6FE',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0
            }}>
              🏅
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#6D28D9' }}>CẤP 1</span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  Quán quân
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#7C3AED' }}>
                  {Math.min(completedLessons, 10)} / 10
                </span>
              </div>
              <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min(100, (completedLessons / 10) * 100)}%`,
                  backgroundColor: '#8B5CF6',
                  borderRadius: '999px'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                Hoàn thành 10 bài học tiếng Anh tương tác
              </div>
            </div>
          </div>

          {/* Thành tích 4: Bách phát bách trúng (Trắc nghiệm đúng tuyệt đối) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#DCFCE7',
              border: '2px solid #86EFAC',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              flexShrink: 0
            }}>
              🎯
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#15803D' }}>CẤP 1</span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '16px', fontWeight: 800, color: '#0F172A' }}>
                  Bách phát bách trúng
                </span>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#16A34A' }}>
                  1 / 1 Hoàn Thành
                </span>
              </div>
              <div style={{ height: '12px', backgroundColor: '#E2E8F0', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: '100%',
                  backgroundColor: '#22C55E',
                  borderRadius: '999px'
                }} />
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', marginTop: '4px', fontWeight: 600 }}>
                Đạt điểm 100% tuyệt đối trong bài mồi khảo sát đầu vào
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
