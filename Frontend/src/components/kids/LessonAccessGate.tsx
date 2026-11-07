import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { lessonAccessService, type RestrictedLessonMode } from '../../services/lessonAccessService';

interface LessonAccessGateProps {
  mode: RestrictedLessonMode;
  children: ReactNode;
}

export default function LessonAccessGate({ mode, children }: LessonAccessGateProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { lessonId: routeLessonId } = useParams<{ lessonId?: string }>();
  const [searchParams] = useSearchParams();
  const lessonId = Number(searchParams.get('lessonId') || routeLessonId || 0);
  const [state, setState] = useState<{ loading: boolean; allowed: boolean; message: string }>({
    loading: true,
    allowed: false,
    message: ''
  });

  useEffect(() => {
    let mounted = true;
    setState({ loading: true, allowed: false, message: '' });

    if (!lessonId) {
      setState({
        loading: false,
        allowed: false,
        message: 'Bé hãy mở hoạt động này từ nút trên bản đồ lộ trình nhé.'
      });
      return () => { mounted = false; };
    }

    lessonAccessService.checkRestrictedLesson(lessonId, mode)
      .then((result) => {
        if (!mounted) return;
        setState({ loading: false, allowed: result.allowed, message: result.message || '' });
      })
      .catch((error) => {
        console.error('Không thể kiểm tra quyền mở bài học:', error);
        if (!mounted) return;
        setState({
          loading: false,
          allowed: false,
          message: 'Chưa kiểm tra được tiến độ bài học. Bé hãy quay về lộ trình và mở lại nhé.'
        });
      });

    return () => { mounted = false; };
  }, [lessonId, mode, location.pathname, location.search]);

  if (state.loading) {
    return <div className="lesson-access-card">Đang kiểm tra quyền mở hoạt động...</div>;
  }

  if (!state.allowed) {
    return (
      <div className="lesson-access-card">
        <div className="lesson-access-icon">🔒</div>
        <h2>Hoạt động này chưa mở</h2>
        <p>{state.message}</p>
        <button className="btn-kid btn-primary" onClick={() => navigate('/dashboard')}>
          🗺️ Về lộ trình học
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

