import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { progressService } from '../services/progressService';
import { userDataService } from '../services/userDataService';
import type { User, UserRewardsData } from '../types';

export default function KidsLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [rewards, setRewards] = useState<UserRewardsData | null>(null);

  // Modal xác thực an toàn trước khi vào khu vực phụ huynh
  const [parentGateOpen, setParentGateOpen] = useState(false);
  const [gateUsername, setGateUsername] = useState('phuhuynh_huong');
  const [gatePassword, setGatePassword] = useState('123456');
  const [gateError, setGateError] = useState('');
  const [gateLoading, setGateLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const token = authService.getToken();
    if (!token) {
      if (mounted) {
        authService.logout();
        setUser(null);
        setRewards(null);
        navigate('/login', { replace: true });
      }
      return () => {
        mounted = false;
      };
    }

    authService.getProfile()
      .then((u) => {
        if (!mounted) return null;
        setUser(u);
        return userDataService.migrateLegacyLocalData(u.id)
          .catch((error) => console.error('Không thể đồng bộ dữ liệu cũ lên Backend:', error))
          .then(() => progressService.getUserRewards(u.id));
      })
      .then((nextRewards) => {
        if (mounted && nextRewards) setRewards(nextRewards);
      })
      .catch(() => {
        if (!mounted) return;
        authService.logout();
        setUser(null);
        setRewards(null);
        navigate('/login', { replace: true });
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname, navigate]);

  const handleGoToParent = () => {
    const currentUser = authService.getCurrentUser();
    if (currentUser && (currentUser.role === 'PARENT' || currentUser.role === 'ADMIN')) {
      navigate('/parent');
    } else {
      setGateError('');
      setParentGateOpen(true);
    }
  };

  const handleVerifyParent = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError('');
    setGateLoading(true);
    try {
      const parent = await authService.login(gateUsername, gatePassword);
      if (parent.role !== 'PARENT' && parent.role !== 'ADMIN') {
        authService.logout();
        throw new Error('Tài khoản này không có quyền Phụ Huynh (PARENT)!');
      }
      setParentGateOpen(false);
      navigate('/parent');
    } catch (err: any) {
      setGateError(err.message || 'Xác thực phụ huynh không thành công!');
    } finally {
      setGateLoading(false);
    }
  };

  const navLinks = [
    { to: '/dashboard', label: 'Lộ trình học', icon: '🗺️' },
    { to: '/topics', label: 'Từ vựng', icon: '📚' },
    { to: '/rewards', label: 'Bảng Xếp Hạng & Rank', icon: '🏆' },
    { to: '/profile', label: 'Hồ sơ của bé', icon: '👤' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC' }}>
      {/* Top Header */}
      <header style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '2.5px solid #E2E8F0',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Brand Logo */}
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <span style={{ fontSize: '48px', lineHeight: 1 }}>🦉</span>
            <div>
              <span style={{
                fontFamily: 'Fredoka, sans-serif',
                fontSize: '27px',
                fontWeight: 700,
                color: '#58CC02',
                letterSpacing: '0.5px'
              }}>
                Kids English
              </span>
              <span style={{ display: 'block', fontSize: '11px', color: '#718096', fontWeight: 600 }}>
                Học vui mỗi ngày
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {navLinks.map((link) => {
              const active = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontFamily: 'Fredoka, sans-serif',
                    fontSize: '16px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    color: active ? '#1CB0F6' : '#4B5563',
                    backgroundColor: active ? '#E0F2FE' : 'transparent',
                    border: active ? '1.5px solid #7DD3FC' : '1.5px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '30px', lineHeight: 1 }}>{link.icon}</span>
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Status Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Streak */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#FFF7ED',
              border: '1.5px solid #FED7AA',
              padding: '6px 12px',
              borderRadius: '999px',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 700,
              color: '#EA580C',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '26px', lineHeight: 1 }}>🔥</span>
              <span>{rewards?.current_streak ?? 0}</span>
            </div>

            {/* Stars */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#FEF9C3',
              border: '1.5px solid #FDE047',
              padding: '6px 12px',
              borderRadius: '999px',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 700,
              color: '#CA8A04',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '26px', lineHeight: 1 }}>⭐</span>
              <span>{rewards?.total_stars ?? 0}</span>
            </div>

            {/* Coins */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              backgroundColor: '#EFF6FF',
              border: '1.5px solid #BFDBFE',
              padding: '6px 12px',
              borderRadius: '999px',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 700,
              color: '#2563EB',
              fontSize: '14px'
            }}>
              <span style={{ fontSize: '26px', lineHeight: 1 }}>🪙</span>
              <span>{rewards?.total_coins ?? 0}</span>
            </div>

            {/* User Login/Logout Status */}
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  to="/profile"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 14px',
                    backgroundColor: '#F3F4F6',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    color: '#374151',
                    fontSize: '14px',
                    fontWeight: 700,
                    border: '1.5px solid #E5E7EB'
                  }}
                  title="Hồ sơ cá nhân"
                >
                  <span style={{ fontSize: '25px', lineHeight: 1 }}>👧</span>
                  <span>{user.display_name || user.username}</span>
                </Link>

                <button
                  onClick={() => {
                    authService.logout();
                    localStorage.removeItem('kids_onboarding_completed');
                    setUser(null);
                    navigate('/');
                  }}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#FEE2E2',
                    borderRadius: '999px',
                    border: '1.5px solid #FCA5A5',
                    color: '#DC2626',
                    fontSize: '13px',
                    fontWeight: 700,
                    fontFamily: 'Fredoka, sans-serif',
                    cursor: 'pointer'
                  }}
                  title="Đăng xuất khỏi tài khoản"
                >
                  Đăng Xuất
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Link
                  to="/login"
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#E0F2FE',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    color: '#0284C7',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Fredoka, sans-serif',
                    border: '1.5px solid #7DD3FC'
                  }}
                >
                  Đăng Nhập
                </Link>
                <Link
                  to="/register"
                  style={{
                    padding: '7px 16px',
                    backgroundColor: '#58CC02',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    color: '#FFFFFF',
                    fontSize: '14px',
                    fontWeight: 700,
                    fontFamily: 'Fredoka, sans-serif',
                    boxShadow: '0 3px 0 #46A302'
                  }}
                >
                  Đăng Ký
                </Link>
              </div>
            )}

            {/* Chuyển đổi chế độ sang Khu vực Phụ Huynh (Có xác thực) */}
            <button
              onClick={handleGoToParent}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 15px',
                backgroundColor: '#FFF1F2',
                border: '2px solid #FDA4AF',
                borderRadius: '999px',
                color: '#BE123C',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: 'pointer',
                boxShadow: '0 3px 0 #F43F5E',
                transition: 'transform 0.1s ease'
              }}
              title="Chuyển sang Giao diện Quản lý Phụ Huynh"
            >
              <span style={{ fontSize: '26px', lineHeight: 1 }}>👨‍👩‍👧</span>
              <span>Góc Phụ Huynh</span>
            </button>
          </div>
        </div>
      </header>

      {/* Modal Xác Thực Phụ Huynh An Toàn (Parent Gate) */}
      {parentGateOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: '3px solid #FDA4AF',
            maxWidth: '440px',
            width: '100%',
            padding: '32px 28px',
            boxShadow: '0 25px 50px -12px rgba(225, 29, 72, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setParentGateOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#94A3B8'
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px', marginBottom: '8px' }}>🔒👨‍👩‍👧</div>
              <h2 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '22px', color: '#881337', margin: '0 0 6px', fontWeight: 800 }}>
                Xác Thực Phụ Huynh
              </h2>
              <p style={{ fontSize: '13.5px', color: '#9F1239', margin: 0, lineHeight: 1.5 }}>
                Khu vực quản lý tiến độ và cài đặt học tập chỉ dành cho Ba Mẹ. Vui lòng xác thực tài khoản phụ huynh để tiếp tục.
              </p>
            </div>

            {gateError && (
              <div style={{
                backgroundColor: '#FFF1F2',
                border: '1.5px solid #F43F5E',
                borderRadius: '12px',
                padding: '10px 14px',
                color: '#BE123C',
                fontSize: '13px',
                fontWeight: 700,
                marginBottom: '16px'
              }}>
                ⚠️ {gateError}
              </div>
            )}

            <form onSubmit={handleVerifyParent} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4C0519', marginBottom: '4px' }}>
                  Tên tài khoản Phụ huynh
                </label>
                <input
                  type="text"
                  required
                  value={gateUsername}
                  onChange={(e) => setGateUsername(e.target.value)}
                  placeholder="phuhuynh_huong"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #FECDD3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#4C0519', marginBottom: '4px' }}>
                  Mật khẩu
                </label>
                <input
                  type="password"
                  required
                  value={gatePassword}
                  onChange={(e) => setGatePassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #FECDD3',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{
                backgroundColor: '#FFF1F2',
                border: '1px dashed #FB7185',
                borderRadius: '10px',
                padding: '8px 12px',
                fontSize: '12px',
                color: '#9F1239'
              }}>
                💡 Mẫu: <code>phuhuynh_huong</code> / pass: <code>123456</code> (Mẹ Thu Hương)
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setParentGateOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Ở Lại Chế Độ Bé
                </button>
                <button
                  type="submit"
                  disabled={gateLoading}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: '12px',
                    border: 'none',
                    backgroundColor: '#E11D48',
                    color: '#FFFFFF',
                    fontFamily: 'Fredoka, sans-serif',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    boxShadow: '0 3px 0 #BE123C'
                  }}
                >
                  {gateLoading ? 'Đang xác thực...' : 'Vào Cổng Phụ Huynh ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content View */}
      <main style={{ flex: 1, padding: '24px 16px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        <Outlet />
      </main>

      {/* Playful Footer */}
      <footer style={{
        backgroundColor: '#FFFFFF',
        borderTop: '2.5px solid #E2E8F0',
        padding: '24px 16px',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontFamily: 'Fredoka, sans-serif', color: '#64748B', fontSize: '15px' }}>
            🌟 Kids English - Cùng bé chinh phục tiếng Anh qua hình ảnh, âm thanh và trò chơi vui nhộn!
          </p>
        </div>
      </footer>
    </div>
  );
}
