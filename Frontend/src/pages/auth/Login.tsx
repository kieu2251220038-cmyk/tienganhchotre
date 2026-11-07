import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg('');
    setLoading(true);

    try {
      await authService.login(username, password);
      sounds.playVictory();
      navigate('/dashboard');
    } catch (err: unknown) {
      sounds.playWrong();
      setErrorMsg((err as Error).message || 'Tên đăng nhập hoặc mật khẩu chưa đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: '860px',
      margin: '20px auto',
      backgroundColor: '#FFFFFF',
      borderRadius: '28px',
      border: '3px solid #E2E8F0',
      boxShadow: '0 8px 0 #CBD5E1',
      display: 'grid',
      gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 1.2fr)',
      overflow: 'hidden'
    }}>
      {/* Cột Trái: Tranh minh họa & Lời chào bé */}
      <div style={{
        backgroundColor: '#FEF3C7',
        borderRight: '2px solid #FDE68A',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div className="animate-float" style={{ fontSize: '90px', marginBottom: '16px' }}>
          🦉
        </div>
        <h2 style={{ fontSize: '28px', color: '#92400E', marginBottom: '8px' }}>
          Chào Mừng Bé Yêu!
        </h2>
        <p style={{ fontSize: '15px', color: '#B45309', fontWeight: 600, maxWidth: '280px' }}>
          Đăng nhập ngay để tiếp tục chuỗi ngày học tập và nhận sao thưởng lấp lánh nhé!
        </p>

      </div>

      {/* Cột Phải: Form Đăng nhập */}
      <div style={{ padding: '40px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '28px', color: '#1E293B', marginBottom: '6px' }}>
          Đăng Nhập 🔑
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginBottom: '24px' }}>
          Nhập thông tin tài khoản của ba mẹ hoặc bé
        </p>

        {errorMsg && (
          <div style={{
            backgroundColor: '#FEE2E2',
            border: '2px solid #FCA5A5',
            borderRadius: '14px',
            padding: '12px 16px',
            color: '#991B1B',
            fontSize: '14px',
            fontWeight: 700,
            marginBottom: '16px'
          }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: '15px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Tên đăng nhập hoặc Email
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '2px solid #CBD5E1',
                fontSize: '16px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: '15px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
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
                padding: '14px 16px',
                borderRadius: '14px',
                border: '2px solid #CBD5E1',
                fontSize: '16px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: '13px', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>
              Quên mật khẩu?
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-kid btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '16px', marginTop: '6px' }}
          >
            {loading ? 'Đang Đăng Nhập...' : '🚀 Đăng Nhập Ngay'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
          Chưa có tài khoản bé yêu?{' '}
          <Link to="/register" style={{ color: '#2563EB', fontWeight: 800, textDecoration: 'none' }}>
            Đăng ký ngay ➔
          </Link>
        </div>

      </div>
    </div>
  );
}
