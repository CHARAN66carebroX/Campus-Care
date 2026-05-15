import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { api } from '../api';

const schema = z.object({
  registrationKey: z.string().min(4),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
});

export default function RegisterCollegeAdmin() {
  const nav = useNavigate();
  const [cities, setCities] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [city, setCity] = useState('');
  const [collegeId, setCollegeId] = useState('');

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

  async function onSubmit(values) {
    try {
      await api('/api/auth/register/college-admin', {
        method: 'POST',
        body: JSON.stringify({ ...values, collegeId }),
        skipAuth: true,
      });
      toast.success('College admin signup submitted · awaiting platform confirmation');
      nav('/login');
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="main">
      <div className="card" style={{ maxWidth: 620, margin: '0 auto' }}>
        <div className="row-between">
          <h2>College administrator</h2>
          <Link to="/">Home</Link>
        </div>

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

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-row">
            <label>College registration key</label>
            <input className="input" {...register('registrationKey')} placeholder="Distributed by campus care platform" />
          </div>
          <div className="form-row">
            <label>Name</label>
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
          <button className="btn" type="submit" disabled={formState.isSubmitting}>
            Request access
          </button>
        </form>
      </div>
    </div>
  );
}
