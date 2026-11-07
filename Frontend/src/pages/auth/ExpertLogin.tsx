import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

export default function ExpertLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('chuyengia_minhanh');
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
      if (user.role !== 'EXPERT' && user.role !== 'ADMIN') {
        authService.logout();
        throw new Error('Tài khoản này không thuộc phân quyền Chuyên Gia / Gia Sư (EXPERT)!');
      }
      sounds.playVictory();
      navigate(user.role === 'ADMIN' ? '/admin' : '/expert');
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
      backgroundColor: '#FAF5FF',
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
        border: '2.5px solid #D8B4FE',
        boxShadow: '0 20px 40px -15px rgba(126, 34, 206, 0.15)',
        padding: '40px 36px'
      }}>
        {/* Header Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '56px', marginBottom: '8px' }}>👩‍🏫</div>
          <span style={{
            backgroundColor: '#F3E8FF',
            color: '#7E22CE',
            padding: '4px 14px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 800,
            fontFamily: 'Fredoka, sans-serif',
            display: 'inline-block',
            marginBottom: '10px'
          }}>
            HỘI ĐỒNG THẨM ĐỊNH SƯ PHẠM
          </span>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '24px', color: '#581C87', margin: '0 0 6px', fontWeight: 800 }}>
            Đăng Nhập Chuyên Gia / Gia Sư
          </h1>
          <p style={{ color: '#6B21A8', fontSize: '14px', margin: 0, fontWeight: 500 }}>
            Kiểm định chất lượng bài học, duyệt phát âm, góp ý giáo trình cho trẻ 3-8 tuổi
          </p>
        </div>

        {errorMsg && (
          <div style={{
            backgroundColor: '#FAF5FF',
            border: '2px solid #A855F7',
            borderRadius: '14px',
            padding: '12px 16px',
            color: '#7E22CE',
            fontSize: '13.5px',
            fontWeight: 700,
            marginBottom: '20px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#3B0764', marginBottom: '6px' }}>
              Tên tài khoản Chuyên gia
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="chuyengia_minhanh"
              style={{
                width: '100%',
                padding: '13px 16px',
                borderRadius: '14px',
                backgroundColor: '#FAF5FF',
                border: '2px solid #E9D5FF',
                color: '#3B0764',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: '#3B0764', marginBottom: '6px' }}>
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
                backgroundColor: '#FAF5FF',
                border: '2px solid #E9D5FF',
                color: '#3B0764',
                fontSize: '15px',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Gợi ý tài khoản mẫu */}
          <div style={{
            backgroundColor: '#FAF5FF',
            border: '1.5px dashed #A855F7',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12.5px',
            color: '#6B21A8',
            fontWeight: 600
          }}>
            💡 Tài khoản mẫu: <code>chuyengia_minhanh</code> / mật khẩu: <code>123456</code> (TS. Minh Anh)
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: '15px',
              borderRadius: '14px',
              border: 'none',
              backgroundColor: '#9333EA',
              color: '#FFFFFF',
              fontFamily: 'Fredoka, sans-serif',
              fontWeight: 800,
              fontSize: '16px',
              cursor: 'pointer',
              marginTop: '4px',
              boxShadow: '0 4px 0 #7E22CE',
              transition: 'transform 0.1s ease'
            }}
          >
            {loading ? 'Đang Đăng Nhập...' : '📚 Vào Cổng Thẩm Định Sư Phạm'}
          </button>
        </form>

        {/* Chuyển hướng các cổng khác */}
        <div style={{
          marginTop: '28px',
          paddingTop: '20px',
          borderTop: '1.5px solid #F3E8FF',
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
            <Link to="/parent/login" style={{ color: '#E11D48', fontWeight: 700, textDecoration: 'none' }}>
              👨‍👩‍👧 Cổng Phụ Huynh
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
