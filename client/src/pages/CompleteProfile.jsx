import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../api';
import { useAuth } from '../context/AuthContext.jsx';

export default function CompleteProfile() {
  const nav = useNavigate();
  const { loginPayload } = useAuth();
  const [cities, setCities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [depts, setDepts] = useState([]);
  const [city, setCity] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [departmentId, setDepartmentId] = useState('');

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

  async function submit(e) {
    e.preventDefault();
    try {
      const res = await api('/api/auth/complete-profile', {
        method: 'PATCH',
        body: JSON.stringify({ city, collegeId, departmentId }),
      });
      const me = await loginPayload({ token: res.token });
      toast.success('Profile completed');
      if (!me?.approved) nav('/pending');
      else nav('/student');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <div className="main">
      <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
        <h2>Finish your profile</h2>
        <p className="muted">Google sign-in needs your campus details before you can file complaints.</p>
        <form onSubmit={submit}>
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
          <button className="btn" type="submit">
            Save and continue
          </button>
        </form>
      </div>
    </div>
  );
}
