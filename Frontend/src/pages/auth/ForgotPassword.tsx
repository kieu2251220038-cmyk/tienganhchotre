import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { sounds } from '../../utils/soundEffects';

function getRoleHome(role: string): string {
  if (role === 'ADMIN') return '/admin';
  if (role === 'PARENT') return '/parent';
  if (role === 'EXPERT') return '/expert';
  return '/dashboard';
}

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);
    try {
      await authService.requestPasswordReset(email.trim());
      setStep('reset');
      setSuccessMsg(`Mã OTP đã được gửi tới ${email.trim()}. Vui lòng kiểm tra đúng hộp thư của email này.`);
      sounds.playVictory();
    } catch (error: unknown) {
      sounds.playWrong();
      setErrorMsg((error as Error).message || 'Không thể gửi mã OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword !== confirmPassword) {
      setErrorMsg('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setLoading(true);
    try {
      const user = await authService.resetPassword(email.trim(), otp.trim(), newPassword);
      sounds.playVictory();
      setSuccessMsg('Đổi mật khẩu thành công. Đang chuyển vào giao diện chính...');
      window.setTimeout(() => navigate(getRoleHome(user.role), { replace: true }), 500);
    } catch (error: unknown) {
      sounds.playWrong();
      setErrorMsg((error as Error).message || 'Không thể đổi mật khẩu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: 'Nunito, sans-serif' }}>
      <div style={{ maxWidth: '460px', width: '100%', backgroundColor: '#FFFFFF', borderRadius: '24px', border: '2px solid #BFDBFE', boxShadow: '0 20px 40px -15px rgba(37, 99, 235, 0.18)', padding: '36px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '52px', marginBottom: '8px' }}>🔐</div>
          <h1 style={{ fontFamily: 'Fredoka, sans-serif', fontSize: '25px', color: '#1E3A8A', margin: '0 0 8px', fontWeight: 800 }}>
            Lấy lại mật khẩu
          </h1>
          <p style={{ color: '#475569', fontSize: '14px', margin: 0 }}>
            Nhập email đã đăng ký để nhận mã OTP từ Gmail.
          </p>
        </div>

        {errorMsg && <div style={{ backgroundColor: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '12px', padding: '11px 14px', color: '#B91C1C', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>⚠️ {errorMsg}</div>}
        {successMsg && <div style={{ backgroundColor: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '12px', padding: '11px 14px', color: '#166534', fontSize: '13px', fontWeight: 700, marginBottom: '16px' }}>✅ {successMsg}</div>}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 700, fontSize: '14px' }}>
              Email đăng ký
              <input
                type="email"
                name="password-reset-email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Nhập email đã đăng ký"
                autoComplete="off"
                style={{ padding: '13px 14px', borderRadius: '12px', border: '2px solid #BFDBFE', fontSize: '15px', outline: 'none' }}
              />
            </label>
            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 0 #1D4ED8' }}>
              {loading ? 'Đang gửi OTP...' : '📩 Gửi mã OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 700, fontSize: '14px' }}>
              Mã OTP 6 số
              <input type="text" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} placeholder="123456" autoComplete="one-time-code" style={{ padding: '13px 14px', borderRadius: '12px', border: '2px solid #BFDBFE', fontSize: '18px', letterSpacing: '6px', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 700, fontSize: '14px' }}>
              Mật khẩu mới
              <input type="password" required minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Ít nhất 6 ký tự" autoComplete="new-password" style={{ padding: '13px 14px', borderRadius: '12px', border: '2px solid #BFDBFE', fontSize: '15px', outline: 'none' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 700, fontSize: '14px' }}>
              Nhập lại mật khẩu mới
              <input type="password" required minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" autoComplete="new-password" style={{ padding: '13px 14px', borderRadius: '12px', border: '2px solid #BFDBFE', fontSize: '15px', outline: 'none' }} />
            </label>
            <button type="submit" disabled={loading} style={{ padding: '14px', borderRadius: '12px', border: 'none', backgroundColor: '#2563EB', color: '#FFFFFF', fontFamily: 'Fredoka, sans-serif', fontWeight: 800, fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 0 #1D4ED8' }}>
              {loading ? 'Đang cập nhật...' : '🔓 Đổi mật khẩu và vào trang chính'}
            </button>
            <button type="button" disabled={loading} onClick={() => { setStep('email'); setErrorMsg(''); setSuccessMsg(''); }} style={{ border: 'none', background: 'none', color: '#2563EB', fontWeight: 700, cursor: 'pointer' }}>
              Dùng email khác / gửi lại mã
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '22px', fontSize: '14px' }}>
          <Link to="/login" style={{ color: '#2563EB', fontWeight: 800, textDecoration: 'none' }}>
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
}
