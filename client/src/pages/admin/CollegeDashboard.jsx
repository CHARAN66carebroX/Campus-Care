import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../api';

export default function CollegeDashboard() {
  const [stats, setStats] = useState(null);
  const [pending, setPending] = useState([]);

  async function load() {
    try {
      const [s, p] = await Promise.all([api('/api/stats/college'), api('/api/admin/pending')]);
      setStats(s);
      setPending(p);
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function approve(id) {
    try {
      await api(`/api/admin/approve/${id}`, { method: 'POST', body: '{}' });
      toast.success('Department admin approved');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card">
        <h2>College overview</h2>
        <p className="muted">Balanced workloads across escalations and departmental queues.</p>
      </div>
      <div className="grid cols-3">
        <div className="card">
          <div className="muted">Complaints tracked</div>
          <div style={{ fontSize: '2rem', marginTop: 8 }}>{stats?.total ?? '—'}</div>
        </div>
        <div className="card">
          <div className="muted">Pending acknowledgement</div>
          <div style={{ fontSize: '2rem', marginTop: 8 }}>{stats?.pending ?? '—'}</div>
        </div>
        <div className="card">
          <div className="muted">Escalated cases</div>
          <div style={{ fontSize: '2rem', marginTop: 8 }}>{stats?.escalated ?? '—'}</div>
        </div>
      </div>

      <div className="card">
        <h3>Department administrator approvals</h3>
        {!pending.length && <p className="muted">No pending desk leads.</p>}
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Dept</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pending.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.department?.name || '—'}</td>
                <td>
                  <button className="btn" type="button" onClick={() => approve(u._id)}>
                    Approve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
