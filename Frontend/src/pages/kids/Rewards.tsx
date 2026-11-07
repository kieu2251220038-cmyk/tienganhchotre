import { useState, useEffect } from 'react';
import { progressService } from '../../services/progressService';
import { authService } from '../../services/authService';
import { userDataService } from '../../services/userDataService';
import type { UserRewardsData } from '../../types';
import { sounds } from '../../utils/soundEffects';

// ================= CÁC BẬC RANK GIẢI ĐẤU (DUOLINGO LEAGUES) =================
export interface LeagueRank {
  id: string;
  name: string;
  minStars: number;
  maxStars: number;
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  desc: string;
}

export const LEAGUE_RANKS: LeagueRank[] = [
  {
    id: 'bronze',
    name: 'Giải Đấu Đồng',
    minStars: 0,
    maxStars: 49,
    badge: '🥉',
    color: '#B45309',
    bgColor: '#FEF3C7',
    borderColor: '#F59E0B',
    desc: 'Bậc khởi đầu cho các chiến binh nhí làm quen với tiếng Anh!'
  },
  {
    id: 'silver',
    name: 'Giải Đấu Bạc',
    minStars: 50,
    maxStars: 119,
    badge: '🥈',
    color: '#475569',
    bgColor: '#F1F5F9',
    borderColor: '#94A3B8',
    desc: 'Cần đạt 50 ⭐ để thăng hạng Bạc. Bé đang tiến bộ rất nhanh!'
  },
  {
    id: 'gold',
    name: 'Giải Đấu Vàng',
    minStars: 120,
    maxStars: 199,
    badge: '🥇',
    color: '#D97706',
    bgColor: '#FFFBEB',
    borderColor: '#FBBF24',
    desc: 'Cần đạt 120 ⭐ để thăng hạng Vàng. Phong độ học tập xuất sắc!'
  },
  {
    id: 'sapphire',
    name: 'Giải Đấu Lam Ngọc',
    minStars: 200,
    maxStars: 349,
    badge: '💎',
    color: '#0284C7',
    bgColor: '#F0F9FF',
    borderColor: '#38BDF8',
    desc: 'Cần đạt 200 ⭐ để thăng hạng Lam Ngọc. Bé là tay đua cừ khôi!'
  },
  {
    id: 'ruby',
    name: 'Giải Đấu Hồng Ngọc',
    minStars: 350,
    maxStars: 499,
    badge: '🔮',
    color: '#DB2777',
    bgColor: '#FDF2F8',
    borderColor: '#F472B6',
    desc: 'Cần đạt 350 ⭐ để thăng hạng Hồng Ngọc. Thuộc top những bạn giỏi nhất!'
  },
  {
    id: 'diamond',
    name: 'Giải Đấu Kim Cương',
    minStars: 500,
    maxStars: 99999,
    badge: '👑',
    color: '#7C3AED',
    bgColor: '#F5F3FF',
    borderColor: '#A78BFA',
    desc: 'Bậc rank danh giá nhất thế giới Duolingo! Bạn là Siêu Sao Thần Đồng!'
  }
];

export const getLeagueByStars = (stars: number): LeagueRank => {
  return LEAGUE_RANKS.slice().reverse().find(r => stars >= r.minStars) || LEAGUE_RANKS[0];
};

// Sticker trạng thái cho bé
const STATUS_STICKERS = [
  '😎', '🎉', '💪', '🍿', '🇺🇸', '🦉',
  '🏆', '🐱', '🚀', '⭐', '🔥', '👑'
];

export default function Rewards() {
  const currentUser = authService.getCurrentUser();
  const [rewards, setRewards] = useState<UserRewardsData | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sticker trạng thái hiện tại của bé
  const [selectedSticker, setSelectedSticker] = useState<string>('🦉');

  // Modal xem hồ sơ của user khác
  const [inspectedUser, setInspectedUser] = useState<any | null>(null);

  useEffect(() => {
    void userDataService.migrateLegacyLocalData(currentUser.id)
      .then(() => userDataService.getPreferences())
      .then((preferences) => setSelectedSticker(preferences.sticker))
      .catch((error) => console.error('Không thể tải sticker từ Backend:', error));

    // 1. Tải phần thưởng user hiện tại
    progressService.getUserRewards(currentUser.id).then((r) => {
      setRewards(r);
    });

    // 2. Tải bảng xếp hạng đua rank thật từ database
    progressService.getLeaderboard().then((data) => {
      setLeaderboard(data);
      setLoading(false);
    });
  }, [currentUser.id]);

  const totalStars = rewards?.total_stars ?? 0;
  const currentLeague = getLeagueByStars(totalStars);

  // Tính số sao còn thiếu để thăng hạng tiếp theo
  const currentLeagueIdx = LEAGUE_RANKS.findIndex(l => l.id === currentLeague.id);
  const nextLeague = currentLeagueIdx < LEAGUE_RANKS.length - 1 ? LEAGUE_RANKS[currentLeagueIdx + 1] : null;
  const starsNeededForNext = nextLeague ? Math.max(0, nextLeague.minStars - totalStars) : 0;
  const progressToNext = nextLeague 
    ? Math.min(100, Math.round(((totalStars - currentLeague.minStars) / (nextLeague.minStars - currentLeague.minStars)) * 100))
    : 100;

  const handleSelectSticker = async (stk: string) => {
    sounds.playClick();
    setSelectedSticker(stk);
    try {
      await userDataService.updatePreferences({ sticker: stk });
    } catch (error) {
      console.error('Không thể lưu sticker lên Backend:', error);
    }
  };

  const handleInspectUser = async (u: any) => {
    sounds.playClick();
    try {
      const full = await progressService.getUserRewards(u.id);
      setInspectedUser({
        ...u,
        badges: full.badges || [],
        completedCount: full.completed_lessons?.length || 0,
        stars: full.total_stars ?? u.total_stars ?? 0,
        streak: full.current_streak ?? u.current_streak ?? 1
      });
    } catch {
      setInspectedUser({
        ...u,
        badges: [],
        completedCount: 0,
        stars: u.total_stars || 0,
        streak: u.current_streak || 1
      });
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ================= 1. HEADER LEAGUE SHIELDS (GIẢI ĐẤU DUOLINGO) ================= */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '32px',
        border: '3px solid #E5E5E5',
        boxShadow: '0 8px 0 #CBD5E1',
        padding: '36px 32px 28px',
        textAlign: 'center',
        position: 'relative'
      }}>
        {/* Dãy các khiên giải đấu phía trên */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          flexWrap: 'wrap'
        }}>
          {LEAGUE_RANKS.map((rk) => {
            const isUnlocked = totalStars >= rk.minStars;
            const isCurrent = currentLeague.id === rk.id;

            return (
              <div
                key={rk.id}
                title={`${rk.name} (Yêu cầu ${rk.minStars} ⭐)`}
                style={{
                  width: isCurrent ? '72px' : '52px',
                  height: isCurrent ? '82px' : '62px',
                  borderRadius: '20px 20px 28px 28px',
                  backgroundColor: isUnlocked ? rk.bgColor : '#F1F5F9',
                  border: isCurrent ? `3.5px solid ${rk.borderColor}` : isUnlocked ? `2px solid ${rk.borderColor}` : '2px dashed #CBD5E1',
                  boxShadow: isCurrent ? `0 6px 0 ${rk.borderColor}` : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  filter: isUnlocked ? 'none' : 'grayscale(100%) opacity(0.4)',
                  transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: isCurrent ? '34px' : '24px', lineHeight: 1 }}>{rk.badge}</span>
                {isCurrent && (
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: rk.color,
                    fontFamily: 'Fredoka, sans-serif',
                    marginTop: '4px'
                  }}>
                    HIỆN TẠI
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Tên giải đấu hiện tại & thời gian còn lại */}
        <h1 style={{
          fontFamily: 'Fredoka, sans-serif',
          fontSize: '34px',
          fontWeight: 800,
          color: currentLeague.color,
          margin: '0 0 6px 0'
        }}>
          {currentLeague.badge} {currentLeague.name}
        </h1>
        <p style={{
          fontSize: '15px',
          color: '#64748B',
          fontWeight: 600,
          margin: '0 auto 16px',
          maxWidth: '560px'
        }}>
          {currentLeague.desc}
        </p>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#FEF3C7',
          border: '1.5px solid #FDE68A',
          padding: '6px 18px',
          borderRadius: '999px',
          fontSize: '13px',
          fontWeight: 700,
          color: '#B45309',
          marginBottom: '20px'
        }}>
          <span>⏱️</span>
          <span>Bảng xếp hạng tuần này sẽ tổng kết sau: <strong>2 ngày 14 giờ</strong></span>
        </div>

        {/* Thanh tiến trình leo rank */}
        {nextLeague && (
          <div style={{
            maxWidth: '540px',
            margin: '0 auto',
            backgroundColor: '#F8FAFC',
            borderRadius: '20px',
            padding: '16px 20px',
            border: '2px solid #E2E8F0'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '13px',
              fontWeight: 800,
              fontFamily: 'Fredoka, sans-serif',
              marginBottom: '8px'
            }}>
              <span style={{ color: currentLeague.color }}>
                {currentLeague.name} ({totalStars} ⭐)
              </span>
              <span style={{ color: nextLeague.color }}>
                Lên {nextLeague.name} (cần {nextLeague.minStars} ⭐)
              </span>
            </div>

            <div style={{
              height: '14px',
              backgroundColor: '#E2E8F0',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${progressToNext}%`,
                backgroundColor: currentLeague.borderColor,
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }} />
            </div>

            <div style={{ fontSize: '13px', color: '#64748B', marginTop: '8px', fontWeight: 600 }}>
              🚀 Bé chỉ cần tích lũy thêm <strong>{starsNeededForNext} ⭐</strong> nữa là sẽ được vinh danh thăng hạng <strong>{nextLeague.name}</strong>!
            </div>
          </div>
        )}
      </div>

      {/* ================= 2. HAI CỘT: BẢNG XẾP HẠNG & BIỂU TƯỢNG TRẠNG THÁI ================= */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
        gap: '24px',
        alignItems: 'start'
      }}>
        {/* ================= CỘT TRÁI: BẢNG XẾP HẠNG LEADERBOARD ================= */}
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '28px',
          border: '3px solid #E5E5E5',
          boxShadow: '0 8px 0 #CBD5E1',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '18px 24px',
            borderBottom: '2px solid #F1F5F9',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '19px',
              fontWeight: 800,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span>🛡️</span>
              <span>Bảng Xếp Hạng Đua Rank ({currentLeague.name})</span>
            </div>
            <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 700 }}>
              Bấm vào tên để xem hồ sơ 👉
            </span>
          </div>

          {/* Vùng Thăng Hạng Indicator */}
          <div style={{
            backgroundColor: '#DCFCE7',
            padding: '8px 20px',
            fontSize: '12px',
            fontWeight: 800,
            color: '#166534',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            borderBottom: '1px solid #BBF7D0'
          }}>
            <span>⬆️</span>
            <span>TOP 3 ĐƯỢC THĂNG HẠNG VÀO GIẢI ĐẤU TIẾP THEO KHI HẾT TUẦN</span>
          </div>

          {/* Leaderboard List */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                Đang nạp bảng xếp hạng... ⏳
              </div>
            ) : leaderboard.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748B' }}>
                Chưa có dữ liệu người học. Hãy là người đầu tiên leo rank!
              </div>
            ) : (
              leaderboard.map((u, idx) => {
                const rankNum = idx + 1;
                const isMe = u.id === currentUser.id;
                const userLeague = getLeagueByStars(u.total_stars);

                let rankBadge: React.ReactNode = (
                  <span style={{ fontSize: '15px', fontWeight: 800, color: '#64748B', width: '28px', textAlign: 'center' }}>
                    {rankNum}
                  </span>
                );

                if (rankNum === 1) rankBadge = <span style={{ fontSize: '24px' }}>🥇</span>;
                else if (rankNum === 2) rankBadge = <span style={{ fontSize: '24px' }}>🥈</span>;
                else if (rankNum === 3) rankBadge = <span style={{ fontSize: '24px' }}>🥉</span>;

                return (
                  <div
                    key={u.id}
                    onClick={() => handleInspectUser(u)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px 20px',
                      borderBottom: idx === 2 ? '2.5px solid #22C55E' : '1px solid #F1F5F9',
                      backgroundColor: isMe ? '#F0FDF4' : idx < 3 ? '#FAFAFA' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease'
                    }}
                    title="Bấm để xem hồ sơ bạn nhỏ này"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '32px', display: 'flex', justifyContent: 'center' }}>
                        {rankBadge}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        backgroundColor: isMe ? '#DCFCE7' : '#F1F5F9',
                        border: isMe ? '2px solid #58CC02' : '2px solid #E2E8F0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '22px',
                        position: 'relative'
                      }}>
                        {isMe ? selectedSticker : '👧'}
                        {/* Sticker badge */}
                        <span style={{
                          position: 'absolute',
                          bottom: '-2px',
                          right: '-4px',
                          fontSize: '13px'
                        }}>
                          {userLeague.badge}
                        </span>
                      </div>

                      {/* Name & Title */}
                      <div>
                        <div style={{
                          fontFamily: 'Fredoka, sans-serif',
                          fontSize: '16px',
                          fontWeight: 800,
                          color: isMe ? '#15803D' : '#1E293B',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}>
                          <span>{u.display_name || u.username}</span>
                          {isMe && (
                            <span style={{
                              backgroundColor: '#58CC02',
                              color: '#FFFFFF',
                              fontSize: '10px',
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontWeight: 800
                            }}>
                              BẠN NÈ
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                          {userLeague.name} • 🔥 {u.current_streak || 1} ngày
                        </div>
                      </div>
                    </div>

                    {/* Stars count */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontFamily: 'Fredoka, sans-serif',
                      fontSize: '16px',
                      fontWeight: 800,
                      color: '#D97706'
                    }}>
                      <span>⭐</span>
                      <span>{u.total_stars || 0}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ================= CỘT PHẢI: ĐẶT BIỂU TƯỢNG TRẠNG THÁI (STATUS STICKERS - DUOLINGO STYLE) ================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Card Đặt biểu tượng trạng thái */}
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '28px',
            border: '3px solid #E5E5E5',
            boxShadow: '0 8px 0 #CBD5E1',
            padding: '24px'
          }}>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '18px',
              fontWeight: 800,
              color: '#0F172A',
              marginBottom: '14px'
            }}>
              Đặt biểu tượng trạng thái ✨
            </div>

            {/* Avatar bé xem trước với sticker */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginBottom: '18px'
            }}>
              <div style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                border: '3.5px dashed #22C55E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '44px',
                position: 'relative',
                backgroundColor: '#F0FDF4'
              }}>
                <span>👧</span>
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-6px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#FFFFFF',
                  border: '2px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                  {selectedSticker}
                </div>
              </div>

              <div style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '16px',
                fontWeight: 800,
                color: '#1E293B',
                marginTop: '8px'
              }}>
                {currentUser.display_name || currentUser.username}
              </div>
              <div style={{ fontSize: '12px', color: '#16A34A', fontWeight: 700 }}>
                {currentLeague.badge} {currentLeague.name}
              </div>
            </div>

            {/* Grid 12 biểu tượng trạng thái */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: '8px',
              backgroundColor: '#F8FAFC',
              borderRadius: '20px',
              padding: '14px',
              border: '1.5px solid #E2E8F0'
            }}>
              {STATUS_STICKERS.map((stk) => {
                const isSelected = selectedSticker === stk;
                return (
                  <button
                    key={stk}
                    type="button"
                    onClick={() => handleSelectSticker(stk)}
                    style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '12px',
                      backgroundColor: isSelected ? '#DCFCE7' : '#FFFFFF',
                      border: isSelected ? '2.5px solid #22C55E' : '1.5px solid #E2E8F0',
                      fontSize: '20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: isSelected ? 'scale(1.15)' : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {stk}
                  </button>
                );
              })}
            </div>
            <div style={{ fontSize: '11px', color: '#64748B', textAlign: 'center', marginTop: '8px', fontWeight: 600 }}>
              Biểu tượng này sẽ xuất hiện bên cạnh tên bé trên Bảng Xếp Hạng!
            </div>
          </div>

          {/* Quick Rank Milestones Info Card */}
          <div style={{
            backgroundColor: '#EFF6FF',
            border: '2px solid #BAE6FD',
            borderRadius: '24px',
            padding: '20px'
          }}>
            <div style={{
              fontFamily: 'Fredoka, sans-serif',
              fontSize: '16px',
              fontWeight: 800,
              color: '#0284C7',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📜</span>
              <span>Quy Tắc Thăng Hạng Rank Game:</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#334155' }}>
              <div>🥉 <strong>Hạng Đồng</strong>: Dành cho bé mới bắt đầu (0 - 49 ⭐)</div>
              <div>🥈 <strong>Hạng Bạc</strong>: Yêu cầu đạt từ <strong>50 ⭐</strong></div>
              <div>🥇 <strong>Hạng Vàng</strong>: Yêu cầu đạt từ <strong>120 ⭐</strong></div>
              <div>💎 <strong>Hạng Lam Ngọc</strong>: Yêu cầu đạt từ <strong>200 ⭐</strong></div>
              <div>🔮 <strong>Hạng Hồng Ngọc</strong>: Yêu cầu đạt từ <strong>350 ⭐</strong></div>
              <div>👑 <strong>Hạng Kim Cương</strong>: Đỉnh cao tinh hoa (từ <strong>500 ⭐</strong>)</div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL XEM HỒ SƠ USER / BẠN NHỎ ĐƯỢC CHỌN ================= */}
      {inspectedUser && (
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
            borderRadius: '28px',
            border: '3px solid #E5E5E5',
            boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
            maxWidth: '480px',
            width: '100%',
            overflow: 'hidden',
            position: 'relative'
          }}>
            {/* Header modal */}
            <div style={{
              background: 'linear-gradient(135deg, #0284C7 0%, #38BDF8 100%)',
              padding: '28px 24px 20px',
              color: '#FFFFFF',
              textAlign: 'center',
              position: 'relative'
            }}>
              <button
                onClick={() => setInspectedUser(null)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>

              <div style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                border: '3px solid #BAE6FD',
                margin: '0 auto 10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}>
                👧
              </div>

              <h2 style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '24px',
                fontWeight: 800,
                margin: '0 0 4px 0'
              }}>
                {inspectedUser.display_name || inspectedUser.username}
              </h2>
              <div style={{ fontSize: '13px', opacity: 0.9 }}>
                @{inspectedUser.username} • Độ tuổi: {inspectedUser.age_group || '5'} Tuổi
              </div>
            </div>

            {/* Stats body */}
            <div style={{ padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '20px'
              }}>
                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E2E8F0',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px' }}>⭐</div>
                  <div style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#D97706'
                  }}>
                    {inspectedUser.stars}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Tổng Điểm Sao</div>
                </div>

                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E2E8F0',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px' }}>🔥</div>
                  <div style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#EA580C'
                  }}>
                    {inspectedUser.streak}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Ngày Streak</div>
                </div>

                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E2E8F0',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px' }}>{getLeagueByStars(inspectedUser.stars).badge}</div>
                  <div style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '16px',
                    fontWeight: 800,
                    color: getLeagueByStars(inspectedUser.stars).color
                  }}>
                    {getLeagueByStars(inspectedUser.stars).name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Giải Đấu Hiện Tại</div>
                </div>

                <div style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '16px',
                  border: '2px solid #E2E8F0',
                  padding: '14px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '20px' }}>📖</div>
                  <div style={{
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '20px',
                    fontWeight: 800,
                    color: '#2563EB'
                  }}>
                    {inspectedUser.completedCount}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700 }}>Bài Đã Hoàn Thành</div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playVictory();
                    alert(`🎉 Bé đã gửi lời khen ngợi & cổ vũ đến bạn ${inspectedUser.display_name}!`);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: '#58CC02',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '15px',
                    fontWeight: 800,
                    padding: '12px',
                    borderRadius: '16px',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 0 #46A302'
                  }}
                >
                  🎉 Gửi Lời Cổ Vũ Bạn!
                </button>

                <button
                  type="button"
                  onClick={() => setInspectedUser(null)}
                  style={{
                    padding: '12px 20px',
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '14px',
                    fontWeight: 700,
                    borderRadius: '16px',
                    border: '1.5px solid #CBD5E1',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
