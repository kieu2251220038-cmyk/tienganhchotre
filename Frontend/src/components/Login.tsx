import React, { useState } from 'react';
import API from '../services/api';

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  onSwitchToRegister?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await API.post('/auth/login', { username, password });
      setMessage('Đăng nhập thành công!');
      onLoginSuccess(res.data.user);
    } catch (err: any) {
      setMessage(err.response?.data?.message || 'Đăng nhập thất bại!');
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
      <h2 style={{ color: '#4F46E5', marginBottom: '20px', fontSize: '24px' }}>🎈 Kids English Login</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input 
          type="text" 
          placeholder="Tên đăng nhập" 
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
            backgroundColor: '#4F46E5', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: 'bold', 
            fontSize: '15px' 
          }}
        >
          Đăng Nhập
        </button>
      </form>

      {message && (
        <p style={{ marginTop: '16px', color: message.includes('thành công') ? '#10B981' : '#EF4444', fontSize: '14px' }}>
          {message}
        </p>
      )}

      {onSwitchToRegister && (
        <>
          <hr style={{ border: 'none', borderTop: '1px solid #E5E7EB', margin: '20px 0' }} />
          <p style={{ fontSize: '14px', color: '#4B5563', margin: 0 }}>
            Chưa có tài khoản?{' '}
            <span 
              onClick={onSwitchToRegister} 
              style={{ color: '#10B981', cursor: 'pointer', fontWeight: 'bold', textDecoration: 'underline' }}
            >
              Đăng ký ngay
            </span>
          </p>
        </>
      )}
    </div>
  );
};