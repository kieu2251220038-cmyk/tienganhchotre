import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg('');
    setLoading(true);

    try {
      // Remove an expired child/admin session before creating a fresh Admin session.
      authService.logout();
      const user = await authService.login(username.trim(), password);
      if (user.role !== 'ADMIN') {
        authService.logout();
        throw new Error('Tài khoản này không có quyền Quản trị viên (ADMIN)!');
      }
      sounds.playVictory();
      navigate('/admin');
    } catch (err: unknown) {
      sounds.playWrong();
      setErrorMsg((err as Error).message || 'Tên đăng nhập hoặc mật khẩu quản trị không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F172A',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'Nunito, sans-serif'
    }}>
      <div style={{
        maxWidth: '440px',
        width: '100%',
        backgroundColor: '#1E293B',
        borderRadius: '24px',
        border: '2px solid #334155',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        padding: '36px 32px'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '54px', marginBottom: '10px' }}>🛡️</div>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '24px', color: '#F8FAFC', margin: '0 0 6px', fontWeight: 800 }}>
            CỔNG QUẢN TRỊ VIÊN
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '13px', margin: 0 }}>
            Hệ thống Quản Trị CSDL Tiếng Anh Trẻ Em (Admin Portal)
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1.5px solid #EF4444',
            borderRadius: '12px',
            padding: '12px 14px',
            color: '#FCA5A5',
            fontSize: '13px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              Tài khoản quản trị (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#0F172A',
                border: '1.5px solid #334155',
                color: '#F8FAFC',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#CBD5E1', marginBottom: '6px' }}>
              Mật khẩu bảo mật
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '12px',
                backgroundColor: '#0F172A',
                border: '1.5px solid #334155',
                color: '#F8FAFC',
                fontSize: '15px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{
            backgroundColor: 'rgba(2, 132, 199, 0.1)',
            border: '1px dashed #0284C7',
            borderRadius: '10px',
            padding: '10px 12px',
            fontSize: '12px',
            color: '#38BDF8'
          }}>
            💡 Tài khoản mẫu: <code>admin</code> / mật khẩu: <code>123456</code> (hoặc <code>admin123</code>)
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#0284C7',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 800,
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '8px',
              boxShadow: '0 4px 0 #0369A1'
            }}
          >
            {loading ? 'Đang xác thực...' : '🔐 Đăng Nhập Quản Trị'}
          </button>
        </form>

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          borderTop: '1px solid #334155',
          paddingTop: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          alignItems: 'center'
        }}>
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            ← Quay về Cổng Học Sinh
          </button>

          <div style={{ display: 'flex', gap: '14px', fontSize: '12.5px' }}>
            <button
              onClick={() => navigate('/parent/login')}
              style={{ background: 'none', border: 'none', color: '#F472B6', cursor: 'pointer', fontWeight: 700 }}
            >
              👨‍👩‍👧 Cổng Phụ Huynh
            </button>
            <span style={{ color: '#475569' }}>|</span>
            <button
              onClick={() => navigate('/expert/login')}
              style={{ background: 'none', border: 'none', color: '#C084FC', cursor: 'pointer', fontWeight: 700 }}
            >
              👩‍🏫 Cổng Chuyên Gia / Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
