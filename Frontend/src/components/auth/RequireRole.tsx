import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { UserRole } from '../../types';

interface RequireRoleProps {
  allowedRoles: UserRole[];
  redirectTo: string;
  children: ReactNode;
}

export default function RequireRole({ allowedRoles, redirectTo, children }: RequireRoleProps) {
  const [status, setStatus] = useState<'checking' | 'allowed' | 'denied'>('checking');
  const roleKey = allowedRoles.join('|');
  const allowedRoleSet = useMemo(() => new Set(roleKey.split('|')), [roleKey]);

  useEffect(() => {
    let mounted = true;

    if (!authService.getToken()) {
      setStatus('denied');
      return () => {
        mounted = false;
      };
    }

    authService.getProfile()
      .then((user) => {
        if (mounted) setStatus(allowedRoleSet.has(user.role) ? 'allowed' : 'denied');
      })
      .catch(() => {
        authService.logout();
        if (mounted) setStatus('denied');
      });

    return () => {
      mounted = false;
    };
  }, [allowedRoleSet, roleKey]);

  if (status === 'checking') {
    return (
      <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: '#64748B', fontWeight: 700 }}>
        Đang kiểm tra quyền truy cập...
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
