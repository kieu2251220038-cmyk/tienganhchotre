import { useState, useEffect } from 'react';
import { adminService, getAdminErrorMessage, type AdminUser } from '../../services/adminService';

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const loadUsers = () => {
    adminService.getUsers().then(setUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await adminService.updateUser(editingUser.id, editingUser);
      setMessage('✅ Cập nhật người dùng thành công!');
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể cập nhật người dùng.'));
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await adminService.deleteUser(id);
      setMessage('✅ Đã xóa tài khoản thành công!');
      setDeleteConfirmId(null);
      loadUsers();
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(getAdminErrorMessage(error, 'Không thể xóa tài khoản.'));
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.display_name && u.display_name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', color: '#0F172A', margin: 0, fontWeight: 800 }}>
            👥 Quản Lý Người Dùng (A02)
          </h1>
          <p style={{ color: '#64748B', fontSize: '15px', marginTop: '4px' }}>
            Danh sách học sinh, phụ huynh và phân quyền quản trị viên
          </p>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '10px',
          backgroundColor: message.includes('✅') ? '#DCFCE7' : '#FEE2E2',
          color: message.includes('✅') ? '#166534' : '#991B1B',
          fontWeight: 700,
          fontSize: '14px'
        }}>
          {message}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1 1 300px' }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm theo tên đăng nhập hoặc tên hiển thị..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
              outline: 'none',
              boxSizing: 'border-box'
            }}
          />
        </div>

        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: '10px',
              border: '1px solid #CBD5E1',
              fontSize: '14px',
              backgroundColor: '#FFFFFF',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value="USER">Bé / Học sinh (USER)</option>
            <option value="PARENT">Phụ huynh (PARENT)</option>
            <option value="EXPERT">Chuyên gia giáo dục (EXPERT)</option>
            <option value="ADMIN">Quản trị viên (ADMIN)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>ID</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Tên Bé / Hiển Thị</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Username</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Độ Tuổi</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Vai Trò</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700 }}>Ngày Tạo</th>
              <th style={{ padding: '14px 20px', color: '#475569', fontWeight: 700, textAlign: 'right' }}>Thao Tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#64748B' }}>#{u.id}</td>
                <td style={{ padding: '14px 20px', fontWeight: 700, color: '#0F172A' }}>
                  {u.display_name || u.username}
                </td>
                <td style={{ padding: '14px 20px', color: '#334155' }}>
                  <code>{u.username}</code>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#EFF6FF',
                    color: '#2563EB'
                  }}>
                    {u.age_group ? `${u.age_group} Tuổi` : 'Chưa đặt'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px' }}>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: u.role === 'ADMIN' ? '#FEF3C7' : u.role === 'EXPERT' ? '#F3E8FF' : u.role === 'PARENT' ? '#CFFAFE' : '#DCFCE7',
                    color: u.role === 'ADMIN' ? '#B45309' : u.role === 'EXPERT' ? '#7E22CE' : u.role === 'PARENT' ? '#0E7490' : '#166534'
                  }}>
                    {u.role === 'USER' ? 'Học sinh (USER)' : u.role === 'PARENT' ? 'Phụ huynh (PARENT)' : u.role === 'EXPERT' ? 'Chuyên gia (EXPERT)' : 'Quản trị (ADMIN)'}
                  </span>
                </td>
                <td style={{ padding: '14px 20px', color: '#64748B', fontSize: '13px' }}>
                  {u.created_at ? u.created_at.slice(0, 10) : '2026-10-12'}
                </td>
                <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                  <button
                    onClick={() => setEditingUser(u)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      backgroundColor: '#FFFFFF',
                      color: '#0284C7',
                      fontWeight: 700,
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    ✏️ Sửa
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(u.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #FCA5A5',
                      backgroundColor: '#FEF2F2',
                      color: '#DC2626',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    🗑️ Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '28px',
            width: '420px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '18px', margin: '0 0 16px 0', color: '#0F172A' }}>
              Chỉnh Sửa Người Dùng: {editingUser.username}
            </h3>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Tên hiển thị:
                </label>
                <input
                  type="text"
                  value={editingUser.display_name}
                  onChange={(e) => setEditingUser({ ...editingUser, display_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Độ tuổi:
                </label>
                <select
                  value={editingUser.age_group || '5'}
                  onChange={(e) => setEditingUser({ ...editingUser, age_group: e.target.value })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  <option value="3">3 Tuổi (Mầm non bé)</option>
                  <option value="4">4 Tuổi (Mầm non nhỡ)</option>
                  <option value="5">5 Tuổi (Mầm non lớn)</option>
                  <option value="6">6 Tuổi (Lớp 1)</option>
                  <option value="7">7 Tuổi (Lớp 2)</option>
                  <option value="8">8 Tuổi (Lớp 3)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  Vai trò:
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as AdminUser['role'] })}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #CBD5E1', boxSizing: 'border-box' }}
                >
                  <option value="USER">USER (Học sinh/Bé)</option>
                  <option value="PARENT">PARENT (Phụ huynh)</option>
                  <option value="EXPERT">EXPERT (Chuyên gia giáo dục)</option>
                  <option value="ADMIN">ADMIN (Quản trị viên)</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#0284C7', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '24px',
            width: '380px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#0F172A' }}>Xác Nhận Xóa Tài Khoản?</h3>
            <p style={{ fontSize: '14px', color: '#64748B', marginBottom: '20px' }}>
              Hành động này sẽ xóa vĩnh viễn thông tin tiến độ và sao thưởng của người dùng này khỏi CSDL.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button
                onClick={() => setDeleteConfirmId(null)}
                style={{ padding: '10px 18px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#FFF', cursor: 'pointer' }}
              >
                Hủy Bỏ
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#DC2626', color: '#FFF', fontWeight: 700, cursor: 'pointer' }}
              >
                Xác Nhận Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
