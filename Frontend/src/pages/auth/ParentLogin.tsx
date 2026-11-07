import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

export default function ParentLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('phuhuynh_huong');
  const [password, setPassword] = useState('123456');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg('');
    setLoading(true);

    try {
      const user = await authService.login(username, password);
      if (user.role !== 'PARENT' && user.role !== 'ADMIN') {
        authService.logout();
        throw new Error('Tài khoản này không thuộc phân quyền Phụ Huynh (PARENT)!');
      }
      sounds.playVictory();
      navigate('/parent');
    } catch (err: unknown) {
      sounds.playWrong();
      setErrorMsg((err as Error).message || 'Tên đăng nhập hoặc mật khẩu không chính xác!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#FFF1F2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Nunito, sans-serif'
    }}>
      <div style={{
        maxWidth: '460px',
        width: '100%',
        backgroundColor: '#FFFFFF',
        borderRadius: '28px',
        border: '2.5px solid #FDA4AF',
        boxShadow: '0 20px 40px -15px rgba(225, 29, 72, 0.15)',
        padding: '40px 36px'
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>👨‍👩‍👧</div>
          <span style={{
            backgroundColor: '#FFE4E6',
            color: '#BE123C',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: 'Fredoka, sans-serif',
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            CỔNG DÀNH CHO PHỤ HUYNH
          </span>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '24px', color: '#881337', margin: '0 0 6px', fontWeight: 800 }}>
            Đăng Nhập Quản Lý Con
          </h1>
          <p style={{ color: '#9F1239', fontSize: '14px', margin: 0, fontWeight: 500 }}>
            Theo dõi tiến trình, số sao, mục tiêu học tập và bảng xếp hạng của con
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#FFF1F2',
            border: '2px solid #F43F5E',
            borderRadius: '14px',
            padding: '12px 16px',
            color: '#BE123C',
            fontSize: '13.5px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#4C0519', marginBottom: '6px' }}>
              Tên tài khoản Phụ huynh
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="phuhuynh_huong"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '14px',
                backgroundColor: '#FFF5F6',
                border: '2px solid #FECDD3',
                color: '#4C0519',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#4C0519', marginBottom: '6px' }}>
              Mật khẩu
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '14px',
                backgroundColor: '#FFF5F6',
                border: '2px solid #FECDD3',
                color: '#4C0519',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Gợi ý tài khoản mẫu */}
          <div style={{
            backgroundColor: '#FFF1F2',
            border: '1.5px dashed #FB7185',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12.5px',
            color: '#9F1239',
            fontWeight: 600
          }}>
            💡 Tài khoản mẫu: <code>phuhuynh_huong</code> / mật khẩu: <code>123456</code> (Mẹ Thu Hương)
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '15px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#E11D48',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 800,
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 0 #BE123C',
              transition: 'transform 0.1s ease'
            }}
          >
            {loading ? 'Đang Đăng Nhập...' : '🌸 Vào Cổng Phụ Huynh'}
          </button>
        </form>

        {/* Chuyển hướng các cổng khác */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1.5px solid #FFE4E6',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          textAlign: 'center'
        }}>
          <Link
            to="/"
            style={{
              color: '#475569',
              fontSize: '13.5px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            ← Quay về Cổng Học Sinh (Trang Chủ)
          </Link>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px' }}>
            <Link to="/expert/login" style={{ color: '#7C3AED', fontWeight: 700, textDecoration: 'none' }}>
              👩‍🏫 Cổng Chuyên Gia / Admin
            </Link>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <Link to="/admin/login" style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'none' }}>
              🛡️ Cổng Quản Trị
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
