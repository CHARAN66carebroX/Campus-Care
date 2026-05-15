import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function RegisterStudent() {
  const nav = useNavigate();
  const { loginPayload } = useAuth();
  const [step, setStep] = useState(1);

  const [cities, setCities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [depts, setDepts] = useState([]);
  const [city, setCity] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(schema) });

  useEffect(() => {
    api('/api/org/cities', { skipAuth: true }).then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (!city) return;
    api(`/api/org/colleges?city=${encodeURIComponent(city)}`, { skipAuth: true })
      .then(setColleges)
      .catch(() => {});
  }, [city]);

  useEffect(() => {
    if (!collegeId) return;
    api(`/api/org/colleges/${collegeId}/departments`, { skipAuth: true })
      .then(setDepts)
      .catch(() => {});
  }, [collegeId]);

  async function onSubmit(values) {
    if (!city || !collegeId || !departmentId) {
      toast.error('Select city, college, and department.');
      setStep(1);
      return;
    }
    try {
      const payload = {
        ...values,
        city,
        collegeId,
        departmentId,
      };
      const res = await api('/api/auth/register/student', {
        method: 'POST',
        body: JSON.stringify(payload),
        skipAuth: true,
      });
      const me = await loginPayload(res);
      toast.success(me.approved ? 'Welcome aboard!' : 'Registration awaiting approval.');
      nav(me.approved ? '/student' : '/pending');
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="main">
      <div className="card" style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="row-between">
          <h2>Student registration</h2>
          <Link to="/">Home</Link>
        </div>
        <div className="stepper">
          <div className={`step ${step === 1 ? 'active' : ''}`}>1 · Location</div>
          <div className={`step ${step === 2 ? 'active' : ''}`}>2 · Account</div>
        </div>

        {step === 1 && (
          <>
            <div className="form-row">
              <label>City</label>
              <select className="input" value={city} onChange={(e) => setCity(e.target.value)} required>
                <option value="">Select city</option>
                {cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>College</label>
              <select
                className="input"
                value={collegeId}
                onChange={(e) => setCollegeId(e.target.value)}
                required
              >
                <option value="">Select college</option>
                {colleges.map((col) => (
                  <option key={col._id} value={col._id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-row">
              <label>Department</label>
              <select
                className="input"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                required
              >
                <option value="">Select department</option>
                {depts.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <button className="btn" type="button" disabled={!collegeId || !departmentId} onClick={() => setStep(2)}>
              Continue
            </button>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-row">
              <label>Full name</label>
              <input className="input" {...register('name')} />
            </div>
            <div className="form-row">
              <label>Email</label>
              <input className="input" type="email" {...register('email')} />
            </div>
            <div className="form-row">
              <label>Password</label>
              <input className="input" type="password" {...register('password')} />
            </div>
            {formState.errors.password && (
              <p className="muted">{String(formState.errors.password.message)}</p>
            )}
            <div className="flex">
              <button className="btn secondary" type="button" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn" type="submit">
                Submit
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
