import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { user } = useAuth();
  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Campus Care</div>
        <div className="flex">
          {user?.role === 'student' && user?.profileComplete && user?.approved && (
            <Link className="btn" to="/student">
              Dashboard
            </Link>
          )}
          {user?.role === 'dept_admin' && user?.approved && (
            <Link className="btn" to="/admin/dept">
              Dashboard
            </Link>
          )}
          {user?.role === 'college_admin' && user?.approved && (
            <Link className="btn" to="/admin/college">
              Dashboard
            </Link>
          )}
          {user?.role === 'platform_admin' && user?.approved && (
            <Link className="btn" to="/admin/platform">
              Dashboard
            </Link>
          )}
          {!user && (
            <>
              <Link className="btn secondary" to="/login">
                Sign in
              </Link>
              <Link className="btn" to="/register/student">
                Join as student
              </Link>
            </>
          )}
        </div>
      </header>
      <main className="main" style={{ maxWidth: 900 }}>
        <div className="card">
          <h1>Formal, trackable campus complaints.</h1>
          <p className="muted" style={{ lineHeight: 1.7 }}>
            Students submit grievances once, administrators respond with evidence, reminders flow over email,
            escalations chase deadlines, and every role gets a tailored workspace.
          </p>
          <div className="flex" style={{ marginTop: 16 }}>
            <Link className="btn" to="/register/student">
              Student registration
            </Link>
            <Link className="btn secondary" to="/register/dept">
              Department administrator
            </Link>
            <Link className="btn secondary" to="/register/college">
              College administrator
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
