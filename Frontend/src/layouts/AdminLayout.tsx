import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '../services/authService';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdminReady, setIsAdminReady] = useState(false);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Kiểm tra quyền ADMIN thực tế, nếu không có quyền thì chuyển hướng về trang đăng nhập Admin
  useEffect(() => {
    let mounted = true;
    authService.getProfile()
      .then((u) => {
        if (!mounted) return;
        if (u.role !== 'ADMIN') {
          authService.logout();
          navigate('/admin/login', { replace: true });
          return;
        }
        setAdminUser(u);
        setIsAdminReady(true);
      })
      .catch(() => {
        if (!mounted) return;
        authService.logout();
        navigate('/admin/login', { replace: true });
      });

    return () => {
      mounted = false;
    };
  }, [navigate]);

  const navItems = [
    { to: '/admin', label: 'Tổng Quan', icon: '📊' },
    { to: '/admin/users', label: 'Người Dùng', icon: '👥' },
    { to: '/admin/courses', label: 'Quản Lý Khóa Học', icon: '📚' },
    { to: '/admin/topics', label: 'Quản Lý Chủ Đề', icon: '📁' },
    { to: '/admin/lessons', label: 'Quản Lý Bài Học', icon: '📖' },
    { to: '/admin/vocabularies', label: 'Từ Vựng & Media', icon: '🔤' },
    { to: '/admin/quiz', label: 'Quản Lý Quiz', icon: '🎯' },
    { to: '/admin/games', label: 'Quản Lý Mini Game', icon: '🎮' },
    { to: '/admin/analytics', label: 'Báo Cáo & Thống Kê', icon: '📈' },
  ];

  if (!isAdminReady) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F172A',
        color: '#38BDF8',
        fontFamily: 'Fredoka, sans-serif'
      }}>
        <div style={{ fontSize: '54px', marginBottom: '16px' }}>🛡️</div>
        <div style={{ fontSize: '22px', fontWeight: 800 }}>Đang Kết Nối Cổng Quản Trị Hệ Thống (ADMIN)...</div>
        <div style={{ fontSize: '14px', color: '#94A3B8', marginTop: '8px' }}>Xác thực phân quyền và cấu hình CSDL...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9', fontFamily: 'Nunito, sans-serif' }}>
      {/* ================= A01 - SIDEBAR TRÁI ================= */}
      <aside style={{
        width: '260px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid #1E293B',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 50
      }}>
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid #1E293B',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '28px' }}>🦉</span>
          <div>
            <div style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '18px', fontWeight: 700, color: '#38BDF8' }}>
              Kids English Admin
            </div>
            <div style={{ fontSize: '12px', color: '#94A3B8' }}>
              Hệ thống Quản Trị CSDL
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '11px 16px',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: active ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: active ? '#0284C7' : 'transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ fontSize: '18px' }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions - Đăng Xuất Admin */}
        <div style={{ padding: '16px', borderTop: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: '#1E293B',
            padding: '10px 12px',
            borderRadius: '10px',
            border: '1px solid #334155'
          }}>
            <span style={{ fontSize: '20px' }}>👨‍💼</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {adminUser?.display_name || 'Admin Quản Trị'}
              </div>
              <div style={{ fontSize: '11px', color: '#94A3B8' }}>Quyền: ADMIN</div>
            </div>
          </div>

          <button
            onClick={() => {
              authService.logout();
              navigate('/admin/login');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '10px 14px',
              borderRadius: '10px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease'
            }}
          >
            <span>🚪</span>
            <span>Đăng Xuất Admin</span>
          </button>

          <Link
            to="/"
            style={{
              textAlign: 'center',
              fontSize: '12px',
              color: '#64748B',
              textDecoration: 'none',
              fontWeight: 600,
              paddingTop: '4px'
            }}
          >
            ← Ra ngoài trang chủ
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header style={{
          backgroundColor: '#FFFFFF',
          padding: '14px 32px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          {/* Badge cổng Admin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              padding: '4px 12px',
              borderRadius: '999px',
              fontSize: '12px',
              fontWeight: 800,
              border: '1.5px solid #FDE047'
            }}>
              🛡️ CỔNG QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN)
            </span>
          </div>

          {/* User profile & Logout Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#1E293B' }}>
                {adminUser?.display_name || 'Admin Quản Trị'}
              </div>
              <div style={{ fontSize: '12px', color: '#64748B' }}>
                {adminUser?.email || 'admin@kidsenglish.vn'}
              </div>
            </div>
            <button
              onClick={() => {
                authService.logout();
                navigate('/admin/login');
              }}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1.5px solid #FCA5A5',
                backgroundColor: '#FEE2E2',
                color: '#DC2626',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Đăng Xuất
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '28px 32px', flex: 1 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
