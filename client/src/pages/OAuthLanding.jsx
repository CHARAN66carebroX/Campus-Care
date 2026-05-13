import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext.jsx';

export default function OAuthLanding() {
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { loginPayload } = useAuth();

  useEffect(() => {
    const token = params.get('token');
    if (!token) {
      toast.error('Missing token');
      nav('/login');
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const me = await loginPayload({ token });
        if (!me || cancelled) return;
        if (!me.profileComplete) {
          nav('/complete-profile');
          return;
        }
        if (!me.approved) {
          nav('/pending');
          return;
        }
        toast.success('Signed in with Google');
        if (me.role === 'platform_admin') nav('/admin/platform');
        else if (me.role === 'college_admin') nav('/admin/college');
        else if (me.role === 'dept_admin') nav('/admin/dept');
        else nav('/student');
      } catch (e) {
        if (!cancelled) {
          toast.error(e.message);
          nav('/login');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params, nav, loginPayload]);

  return (
    <div className="main">
      <p className="muted">Finalizing Google sign-in…</p>
    </div>
  );
}
