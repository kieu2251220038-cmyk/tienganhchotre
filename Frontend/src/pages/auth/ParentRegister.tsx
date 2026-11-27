import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

export default function ParentRegister() {
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMsg('');

    if (password !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    sounds.playClick();
    try {
      await authService.registerParent(
        email.trim(),
        username.trim(),
        password,
        displayName.trim()
      );
      sounds.playVictory();
      navigate('/parent', { replace: true });
    } catch (error: unknown) {
      sounds.playWrong();
      setErrorMsg((error as Error).message || 'Không thể tạo tài khoản phụ huynh.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFF1F2', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '480px', backgroundColor: '#FFFFFF', borderRadius: '28px', border: '2.5px solid #FDA4AF', boxShadow: '0 20px 40px -15px rgba(225, 29, 72, 0.15)', padding: '36px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>👨‍👩‍👧</div>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '26px', color: '#881337', margin: '0 0 8px', fontWeight: 800 }}>
            Đăng ký tài khoản phụ huynh
          </h1>
          <p style={{ color: '#9F1239', fontSize: '14px', margin: 0 }}>
            Tạo tài khoản để theo dõi và quản lý việc học của bé.
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#FFF1F2', border: '2px solid #F43F5E', borderRadius: '14px', padding: '12px 16px', color: '#BE123C', fontSize: '13.5px', fontWeight: 700, marginBottom: '18px' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#4C0519', fontSize: '14px', fontWeight: 700 }}>
            Tên hiển thị
            <input required value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Ví dụ: Mẹ của bé Nga" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '12px', border: '2px solid #FECDD3', fontSize: '15px', outline: 'none' }} />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#4C0519', fontSize: '14px', fontWeight: 700 }}>
            Email phụ huynh
            <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="phuhuynh@example.com" autoComplete="email" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '12px', border: '2px solid #FECDD3', fontSize: '15px', outline: 'none' }} />
          </label>

          <label style={{ display: 'grid', gap: '6px', color: '#4C0519', fontSize: '14px', fontWeight: 700 }}>
            Tên đăng nhập
            <input required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="phuhuynh_huong" autoComplete="username" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '12px', border: '2px solid #FECDD3', fontSize: '15px', outline: 'none' }} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '6px', color: '#4C0519', fontSize: '14px', fontWeight: 700 }}>
              Mật khẩu
              <input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '12px', border: '2px solid #FECDD3', fontSize: '15px', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px', color: '#4C0519', fontSize: '14px', fontWeight: 700 }}>
              Nhập lại mật khẩu
              <input type="password" required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" style={{ width: '100%', boxSizing: 'border-box', padding: '13px 14px', borderRadius: '12px', border: '2px solid #FECDD3', fontSize: '15px', outline: 'none' }} />
            </label>
          </div>

          <button type="submit" disabled={loading} style={{ padding: '15px', borderRadius: '14px', border: 'none', backgroundColor: '#E11D48', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif', fontWeight: 800, fontSize: '16px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px', boxShadow: '0 4px 0 #BE123C' }}>
            {loading ? 'Đang tạo tài khoản...' : '🌸 Tạo tài khoản phụ huynh'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '14px', color: '#64748B', fontWeight: 600 }}>
          Đã có tài khoản?{' '}
          <Link to="/login" style={{ color: '#BE123C', fontWeight: 800, textDecoration: 'none' }}>
            Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
