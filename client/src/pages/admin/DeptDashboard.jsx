import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../../api';

async function downloadCsv() {
  const token = sessionStorage.getItem('token');
  const res = await fetch('/api/export/complaints.csv', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    toast.error('Export failed');
    return;
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'complaints.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function DeptDashboard() {
  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [pending, setPending] = useState([]);

  async function load() {
    try {
      const [s, c, p] = await Promise.all([
        api('/api/stats/department'),
        api('/api/complaints'),
        api('/api/admin/pending'),
      ]);
      setStats(s);
      setComplaints(c);
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
      toast.success('Approved');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function updateStage(id, stage) {
    try {
      await api(`/api/complaints/${id}`, { method: 'PATCH', body: JSON.stringify({ stage }) });
      toast.success('Stage updated');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function reply(id) {
    const body = window.prompt('Reply to student');
    if (!body) return;
    try {
      await api(`/api/complaints/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) });
      toast.success('Reply recorded');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const maxTrend = stats?.trend?.length ? Math.max(...stats.trend.map((t) => t.count), 1) : 1;

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card row-between">
        <div>
          <h2>Department operations</h2>
          <p className="muted">Monitor sentiment, push stages, and shepherd student registrations.</p>
        </div>
        <button className="btn secondary" type="button" onClick={downloadCsv}>
          Export CSV
        </button>
      </div>

      <div className="grid cols-3">
        <div className="card">
          <p className="muted">Complaints · 7 days</p>
          <strong style={{ fontSize: '2rem' }}>{stats?.last7Days ?? '—'}</strong>
        </div>
        <div className="card">
          <p className="muted">Avg resolution (hours)</p>
          <strong style={{ fontSize: '2rem' }}>{stats?.avgResolutionHours ?? '—'}</strong>
        </div>
        <div className="card">
          <p className="muted">Open pipeline</p>
          <strong style={{ fontSize: '2rem' }}>{stats?.pending ?? '—'}</strong>
        </div>
      </div>

      {stats?.trend && (
        <div className="card">
          <div className="row-between">
            <h3>7-day arrivals</h3>
            <span className="muted">Day bucket counts</span>
          </div>
          <div className="flex" style={{ alignItems: 'flex-end', gap: 8, marginTop: 12 }}>
            {stats.trend.map((point) => (
              <div key={point.date} style={{ flex: 1 }}>
                <div
                  title={`${point.count}`}
                  style={{
                    height: `${(point.count / maxTrend) * 120 || 8}px`,
                    borderRadius: 8,
                    background: 'linear-gradient(180deg,var(--primary),#93c5fd)',
                  }}
                />
                <div className="muted" style={{ fontSize: 11, marginTop: 4, textAlign: 'center' }}>
                  {point.date.slice(5)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(stats?.byCategory?.length || stats?.bySentiment?.length) && (
        <div className="grid cols-3">
          {stats.byCategory?.length ? (
            <div className="card">
              <h4>Categories</h4>
              <ul>
                {stats.byCategory.map((row) => (
                  <li key={row._id}>
                    <strong>{row._id}</strong> · {row.count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {stats.bySentiment?.length ? (
            <div className="card">
              <h4>Sentiment tags</h4>
              <ul>
                {stats.bySentiment.map((row) => (
                  <li key={row._id}>
                    <strong>{row._id}</strong> · {row.count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="card">
            <h4>Pending students</h4>
            {!pending?.length && <p className="muted">All clear ✓</p>}
            <ul style={{ paddingLeft: 16 }}>
              {pending?.map((u) => (
                <li key={u._id} className="flex" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <span>{u.email}</span>
                  <button className="btn" type="button" onClick={() => approve(u._id)}>
                    Approve
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Desk queue</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Signals</th>
              <th>Escalation</th>
              <th>Priority</th>
              <th>Stage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {complaints.map((row) => (
              <tr key={row._id}>
                <td>{row.title}</td>
                <td>{row.upvotes?.length || 0}</td>
                <td>{row.escalationLevel}</td>
                <td>{row.priority}</td>
                <td>{row.stage}</td>
                <td className="flex">
                  <button className="btn secondary" type="button" onClick={() => updateStage(row._id, 'under_review')}>
                    Review
                  </button>
                  <button className="btn secondary" type="button" onClick={() => updateStage(row._id, 'in_progress')}>
                    In progress
                  </button>
                  <button className="btn" type="button" onClick={() => updateStage(row._id, 'resolved')}>
                    Resolve
                  </button>
                  <button className="btn secondary" type="button" onClick={() => reply(row._id)}>
                    Reply
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
