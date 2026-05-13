import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function Login() {
  const nav = useNavigate();
  const { loginPayload } = useAuth();

  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  async function goDashboard(role) {
    if (role === 'platform_admin') nav('/admin/platform');
    else if (role === 'college_admin') nav('/admin/college');
    else if (role === 'dept_admin') nav('/admin/dept');
    else nav('/student');
  }

  async function onSubmit(values) {
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(values),
        skipAuth: true,
      });
      const me = await loginPayload(res);
      if (!me.approved) {
        toast.info('Awaiting approvals');
        return nav('/pending');
      }
      if (me.role === 'student' && !me.profileComplete) {
        return nav('/complete-profile');
      }
      toast.success('Welcome back');
      goDashboard(me.role);
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function google() {
    window.location.href = '/api/auth/google';
  }

  return (
    <div className="main">
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="row-between">
          <h2>Sign in</h2>
          <Link to="/">Home</Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <label>Email</label>
            <input className="input" type="email" {...register('email')} />
            {formState.errors.email && <span className="muted">{String(formState.errors.email.message)}</span>}
          </div>
          <div className="form-row">
            <label>Password</label>
            <input className="input" type="password" {...register('password')} />
          </div>
          <button className="btn" type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="muted" style={{ marginTop: 12 }}>
          <Link to="/forgot">Forgot password?</Link>
        </p>
        <button className="btn secondary" type="button" style={{ marginTop: 12 }} onClick={google}>
          Continue with Google
        </button>
      </div>
    </div>
  );
}
