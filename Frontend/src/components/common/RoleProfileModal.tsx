import { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import type { User } from '../../types';

interface RoleProfileModalProps {
  user: User | null;
  role: 'PARENT' | 'EXPERT';
  linkedChildren?: number;
  onClose: () => void;
  onSaved: (user: User) => void;
}

const roleCopy = {
  PARENT: {
    title: 'Hồ sơ Phụ huynh',
    icon: '👨‍👩‍👧',
    color: '#BE185D',
    border: '#F9A8D4',
    background: '#FDF2F8',
    description: 'Quản lý thông tin tài khoản và đồng hành cùng hồ sơ học tập của bé.'
  },
  EXPERT: {
    title: 'Hồ sơ Chuyên gia giáo dục',
    icon: '👩‍🏫',
    color: '#6D28D9',
    border: '#C4B5FD',
    background: '#F5F3FF',
    description: 'Thông tin tài khoản chuyên gia thẩm định nội dung tiếng Anh cho trẻ 3–8 tuổi.'
  }
} as const;

export default function RoleProfileModal({ user, role, linkedChildren = 0, onClose, onSaved }: RoleProfileModalProps) {
  const copy = roleCopy[role];
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDisplayName(user?.display_name || '');
  }, [user]);

  if (!user) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updatedUser = await authService.updateProfile(displayName);
      onSaved(updatedUser);
      onClose();
    } catch (requestError: any) {
      setError(requestError?.response?.data?.message || requestError?.message || 'Không thể cập nhật hồ sơ.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '20px' }}>
      <form onSubmit={handleSubmit} style={{ backgroundColor: '#FFFFFF', borderRadius: '24px', width: '100%', maxWidth: '520px', padding: '28px', boxShadow: '0 24px 50px rgba(15, 23, 42, 0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', backgroundColor: copy.background, color: copy.color, border: `1.5px solid ${copy.border}`, borderRadius: '999px', padding: '6px 12px', fontWeight: 800, fontSize: '13px' }}>
              <span>{copy.icon}</span>
              <span>{copy.title}</span>
            </div>
            <p style={{ color: '#64748B', fontSize: '14px', lineHeight: 1.5, margin: '12px 0 0' }}>{copy.description}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng hồ sơ" style={{ border: 'none', background: 'none', color: '#94A3B8', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'grid', gap: '14px' }}>
          <label style={{ display: 'grid', gap: '6px', color: '#334155', fontWeight: 800, fontSize: '14px' }}>
            Tên hiển thị
            <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required minLength={2} maxLength={80} style={{ padding: '12px 14px', borderRadius: '12px', border: `2px solid ${copy.border}`, fontSize: '15px', color: '#1E293B' }} />
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '12px', fontWeight: 700 }}>Tên đăng nhập</div>
              <div style={{ color: '#1E293B', fontWeight: 800, marginTop: '4px' }}>@{user.username}</div>
            </div>
            <div style={{ backgroundColor: '#F8FAFC', borderRadius: '12px', padding: '12px' }}>
              <div style={{ color: '#64748B', fontSize: '12px', fontWeight: 700 }}>Vai trò</div>
              <div style={{ color: copy.color, fontWeight: 800, marginTop: '4px' }}>{role === 'PARENT' ? 'Phụ huynh' : 'Chuyên gia giáo dục'}</div>
            </div>
          </div>

          <div style={{ backgroundColor: copy.background, borderRadius: '12px', padding: '12px 14px', color: copy.color, fontWeight: 700, fontSize: '13px' }}>
            {role === 'PARENT' ? `Đang quản lý ${linkedChildren} hồ sơ bé.` : 'Có quyền xem nội dung bài được chuyển sang và gửi kết quả thẩm định.'}
          </div>
        </div>

        {error && <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#B91C1C', fontSize: '13px', fontWeight: 700 }}>{error}</div>}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '22px' }}>
          <button type="button" onClick={onClose} style={{ padding: '11px 18px', borderRadius: '12px', border: '1.5px solid #CBD5E1', backgroundColor: '#FFFFFF', color: '#475569', fontWeight: 800, cursor: 'pointer' }}>Hủy</button>
          <button type="submit" disabled={saving} style={{ padding: '11px 18px', borderRadius: '12px', border: 'none', backgroundColor: copy.color, color: '#FFFFFF', fontWeight: 800, cursor: saving ? 'wait' : 'pointer' }}>{saving ? 'Đang lưu...' : 'Lưu hồ sơ'}</button>
        </div>
      </form>
    </div>
  );
}
