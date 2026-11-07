import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [ageGroup, setAgeGroup] = useState('5');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setErrorMsg('');
    setLoading(true);

    try {
      await authService.register(username, password, displayName, ageGroup);
      sounds.playVictory();
      // Auto login
      await authService.login(username, password);
      navigate('/dashboard');
    } catch (err: unknown) {
      sounds.playWrong();
      setErrorMsg((err as Error).message || 'Đăng ký không thành công. Hãy thử tên khác!');
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
      {/* Cột Trái: Tranh minh họa */}
      <div style={{
        backgroundColor: '#DCFCE7',
        borderRight: '2px solid #BBF7D0',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        <div className="animate-float" style={{ fontSize: '90px', marginBottom: '16px' }}>
          🐼
        </div>
        <h2 style={{ fontSize: '28px', color: '#166534', marginBottom: '8px' }}>
          Tạo Hồ Sơ Cho Bé!
        </h2>
        <p style={{ fontSize: '15px', color: '#15803D', fontWeight: 600, maxWidth: '280px' }}>
          Chỉ mất 30 giây để thiết lập lộ trình học phù hợp với đúng độ tuổi của bé yêu!
        </p>
      </div>

      {/* Cột Phải: Form Đăng ký */}
      <div style={{ padding: '36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <h1 style={{ fontSize: '28px', color: '#1E293B', marginBottom: '6px' }}>
          Đăng Ký Tài Khoản ✨
        </h1>
        <p style={{ fontSize: '14px', color: '#64748B', fontWeight: 600, marginBottom: '20px' }}>
          Bắt đầu hành trình chinh phục tiếng Anh cùng bé
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

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Tên bé yêu (Tên hiển thị)
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ví dụ: Bé Bông, Bé Bo"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '2px solid #CBD5E1',
                fontSize: '15px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Độ tuổi của bé
            </label>
            <select
              value={ageGroup}
              onChange={(e) => setAgeGroup(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '2px solid #CBD5E1',
                fontSize: '15px',
                fontFamily: 'Fredoka, sans-serif',
                fontWeight: 600,
                outline: 'none',
                backgroundColor: '#FFFFFF',
                boxSizing: 'border-box'
              }}
            >
              <option value="3">👶 3 - 4 Tuổi (Mầm non làm quen)</option>
              <option value="5">🧒 5 - 6 Tuổi (Tiền tiểu học cơ bản)</option>
              <option value="7">👦 7 - 8 Tuổi (Tiểu học & Luyện nói AI)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
              Tên đăng nhập (Username)
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ví dụ: bebong2026"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '14px',
                border: '2px solid #CBD5E1',
                fontSize: '15px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'Fredoka, sans-serif', fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
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
                padding: '12px 16px',
                borderRadius: '14px',
                border: '2px solid #CBD5E1',
                fontSize: '15px',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-kid btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '16px', marginTop: '10px' }}
          >
            {loading ? 'Đang Tạo Tài Khoản...' : '🎉 Bắt Đầu Ngay'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
          Đã có tài khoản rồi?{' '}
          <Link to="/login" style={{ color: '#2563EB', fontWeight: 800, textDecoration: 'none' }}>
            Đăng nhập ngay ➔
          </Link>
        </div>
      </div>
    </div>
  );
}
