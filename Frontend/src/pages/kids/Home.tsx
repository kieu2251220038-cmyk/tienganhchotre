import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DuolingoOnboarding from '../../components/kids/DuolingoOnboarding';
import { authService } from '../../services/authService';
import { userDataService } from '../../services/userDataService';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = authService.getToken();
    if (!token) return;

    let mounted = true;
    const user = authService.getCurrentUser();
    void userDataService.migrateLegacyLocalData(user.id)
      .then(() => userDataService.getPreferences())
      .then((preferences) => {
        if (mounted && preferences.onboarding_completed) navigate('/dashboard', { replace: true });
      })
      .catch((error) => console.error('Không thể kiểm tra trạng thái onboarding:', error));

    return () => { mounted = false; };
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px 16px'
    }}>
      {/* Khối Onboarding Duolingo duy nhất khi mới vào trang web */}
      <div style={{ width: '100%', maxWidth: '900px' }}>
        <DuolingoOnboarding />
      </div>
    </div>
  );
}
