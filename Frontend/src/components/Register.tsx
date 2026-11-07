import React, { useState } from 'react';
import API from '../services/api';

interface RegisterProps {
  onSwitchToLogin: () => void;
  onRegisterSuccess: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, onRegisterSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/register', { 
        username, 
        password, 
        displayName 
      });
      
      setIsError(false);
      setMessage(res.data.message || 'Đăng ký thành công! Đang chuyển sang đăng nhập...');
      
      // Chuyển sang màn hình đăng nhập sau 1.5 giây
      setTimeout(() => {
        onRegisterSuccess();
      }, 1500);
    } catch (err: any) {
      setIsError(true);
      setMessage(err.response?.data?.message || 'Đăng ký thất bại, vui lòng thử lại!');
    }
  };

  return (
    <div style={{ 
      maxWidth: '360px', 
      margin: '60px auto', 
      padding: '28px', 
      borderRadius: '16px', 
      textAlign: 'center', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.08)', 
      backgroundColor: '#ffffff' 
    }}>
      <h2 style={{ color: '#10B981', marginBottom: '8px', fontSize: '24px' }}>✨ Đăng Ký Tài Khoản</h2>
      <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '20px' }}>Tạo tài khoản mới để bắt đầu học nhé!</p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input 
          type="text" 
          placeholder="Tên của bé (ví dụ: Bé Minh)" 
          value={displayName} 
          onChange={(e) => setDisplayName(e.target.value)} 
          required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
        />
        <input 
          type="text" 
          placeholder="Tên đăng nhập (viết liền không dấu)" 
          value={username} 
          onChange={(e) => setUsername(e.target.value)} 
          required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
        />
        <input 
          type="password" 
          placeholder="Mật khẩu" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '12px', borderRadius: '8px', border: '1px solid #D1D5DB', fontSize: '14px' }}
        />
        
        <button 
          type="submit" 
          style={{ 
            padding: '12px', 
            backgroundColor: '#10B981', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '15px',
            marginTop: '6px'
          }}
        >
          Đăng Ký Ngay
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '16px', color: isError ? '#EF4444' : '#10B981', fontSize: '14px', fontWeight: '500' }}>
          {message}
        </p>
      )}

      <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '20px 0' }} />

      <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
        Đã có tài khoản?{' '}
        <span 
          onClick={onSwitchToLogin} 
          style={{ color: '#4F46E5', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
        >
          Đăng nhập tại đây
        </span>
      </p>
    </div>
  );
};