import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState(1);

  async function requestOtp(e) {
    e.preventDefault();
    try {
      await api('/api/auth/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
        skipAuth: true,
      });
      toast.success('If the account exists, an OTP was emailed.');
      setStep(2);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function reset(e) {
    e.preventDefault();
    try {
      await api('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ email, code, password }),
        skipAuth: true,
      });
      toast.success('Password updated');
      setStep(3);
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="main">
      <div className="card" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div className="row-between">
          <h2>Reset password</h2>
          <Link to="/login">Back</Link>
        </div>
        {step === 1 && (
          <form onSubmit={requestOtp}>
            <div className="form-row">
              <label>Email</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <button className="btn" type="submit">
              Send OTP
            </button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={reset}>
            <div className="form-row">
              <label>OTP</label>
              <input className="input" value={code} onChange={(e) => setCode(e.target.value)} required />
            </div>
            <div className="form-row">
              <label>New password</label>
              <input
                className="input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn" type="submit">
              Update password
            </button>
          </form>
        )}
        {step === 3 && <p className="muted">You can now sign in with the new password.</p>}
      </div>
    </div>
  );
}
