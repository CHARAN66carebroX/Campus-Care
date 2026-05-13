import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import Login from './pages/Login.jsx';
import RegisterStudent from './pages/RegisterStudent.jsx';
import RegisterDeptAdmin from './pages/RegisterDeptAdmin.jsx';
import RegisterCollegeAdmin from './pages/RegisterCollegeAdmin.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';
import OAuthLanding from './pages/OAuthLanding.jsx';
import CompleteProfile from './pages/CompleteProfile.jsx';
import StudentHome from './pages/student/Home.jsx';
import NewComplaint from './pages/student/NewComplaint.jsx';
import DeptDashboard from './pages/admin/DeptDashboard.jsx';
import CollegeDashboard from './pages/admin/CollegeDashboard.jsx';
import PlatformDashboard from './pages/admin/PlatformDashboard.jsx';
import Landing from './pages/Landing.jsx';

function RequireRole({ roles, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.approved) return <Navigate to="/pending" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

function Pending() {
  const { logout, user } = useAuth();
  return (
    <div className="main card" style={{ maxWidth: 640 }}>
      <h2>Awaiting approval</h2>
      <p className="muted">{user?.email} is pending review by administrators.</p>
      <button className="btn secondary" type="button" onClick={() => logout()}>
        Switch account
      </button>
    </div>
  );
}

function TopBar({ title }) {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  return (
    <header className="topbar">
      <div className="brand">Campus Care</div>
      <div className="flex">
        <span className="muted">{title}</span>
        {user?.name && (
          <span className="badge">
            {user.name} · {user.role}
          </span>
        )}
        <button className="btn secondary" type="button" onClick={toggle}>
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
        {user && (
          <button className="btn secondary" type="button" onClick={() => logout()}>
            Sign out
          </button>
        )}
      </div>
    </header>
  );
}

function Layout({ title }) {
  return (
    <div className="layout">
      <TopBar title={title} />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function RequireProfileStudent({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'student' && !user.profileComplete) {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
}

export default function App() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="main">
        <p className="muted">Loading session…</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />
      <Route path="/oauth" element={<OAuthLanding />} />
      <Route path="/register/student" element={<RegisterStudent />} />
      <Route path="/register/dept" element={<RegisterDeptAdmin />} />
      <Route path="/register/college" element={<RegisterCollegeAdmin />} />
      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/complete-profile" element={<CompleteProfile />} />
      <Route path="/pending" element={<Pending />} />

      <Route
        element={
          <RequireProfileStudent>
            <RequireRole roles={['student']}>
              <Layout title="Student" />
            </RequireRole>
          </RequireProfileStudent>
        }
      >
        <Route path="/student" element={<StudentHome />} />
        <Route path="/student/new" element={<NewComplaint />} />
      </Route>

      <Route
        element={
          <RequireRole roles={['dept_admin']}>
            <Layout title="Department admin" />
          </RequireRole>
        }
      >
        <Route path="/admin/dept" element={<DeptDashboard />} />
      </Route>

      <Route
        element={
          <RequireRole roles={['college_admin']}>
            <Layout title="College admin" />
          </RequireRole>
        }
      >
        <Route path="/admin/college" element={<CollegeDashboard />} />
      </Route>

      <Route
        element={
          <RequireRole roles={['platform_admin']}>
            <Layout title="Platform admin" />
          </RequireRole>
        }
      >
        <Route path="/admin/platform" element={<PlatformDashboard />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
