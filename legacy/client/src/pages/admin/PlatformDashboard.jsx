import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import QRCode from 'react-qr-code';
import { api } from '../../api';

export default function PlatformDashboard() {
  const [stats, setStats] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [pending, setPending] = useState([]);
  const [form, setForm] = useState({ name: '', city: '' });

  async function load() {
    try {
      const [s, c, p] = await Promise.all([
        api('/api/stats/platform'),
        api('/api/platform/colleges', { platform: true }),
        api('/api/platform/pending-college-admins', { platform: true }),
      ]);
      setStats(s);
      setColleges(c);
      setPending(p);
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createCollege(e) {
    e.preventDefault();
    try {
      await api('/api/platform/colleges', {
        platform: true,
        method: 'POST',
        body: JSON.stringify(form),
      });
      toast.success('College created · save the registration QR');
      setForm({ name: '', city: '' });
      load();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function toggle(collegeId, enabled) {
    try {
      await api(`/api/platform/colleges/${collegeId}`, {
        platform: true,
        method: 'PATCH',
        body: JSON.stringify({ enabled }),
      });
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function regenerate(collegeId) {
    try {
      await api(`/api/platform/colleges/${collegeId}/regenerate-key`, {
        platform: true,
        method: 'POST',
      });
      toast.success('Key rotated');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function addDept(collegeId) {
    const name = window.prompt('Department title');
    if (!name) return;
    try {
      await api(`/api/platform/colleges/${collegeId}/departments`, {
        platform: true,
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      toast.success('Department staged');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function removeCollege(collegeId) {
    if (!window.confirm('Delete college hierarchy? Users become orphaned locally.')) return;
    await api(`/api/platform/colleges/${collegeId}`, { platform: true, method: 'DELETE' });
    toast.success('Removed');
    load();
  }

  async function approve(id) {
    await api(`/api/platform/approve-college-admin/${id}`, { platform: true, method: 'POST' });
    toast.success('College admin unlocked');
    load();
  }

  return (
    <div className="grid" style={{ gap: 20 }}>
      <div className="card">
        <h2>Campus Care platform</h2>
        <p className="muted">Provision institutions, circulate registration keys via QR codes, unblock leadership.</p>
      </div>

      {stats && (
        <div className="grid cols-3">
          <div className="card">
            <div className="muted">Colleges onboarded</div>
            <div style={{ fontSize: '2.2rem', marginTop: 8 }}>{stats.totalColleges}</div>
          </div>
          <div className="card">
            <div className="muted">Issues logged</div>
            <div style={{ fontSize: '2.2rem', marginTop: 8 }}>{stats.totalComplaints}</div>
          </div>
          <div className="card">
            <div className="muted">Still open</div>
            <div style={{ fontSize: '2.2rem', marginTop: 8 }}>{stats.openComplaints}</div>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Launch a college tenant</h3>
        <form className="flex" onSubmit={createCollege}>
          <input
            required
            className="input"
            placeholder="College name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <input
            required
            className="input"
            placeholder="City"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <button className="btn" type="submit">
            Create
          </button>
        </form>
      </div>

      <div className="card">
        <h3>College leadership queue</h3>
        {!pending.length && <p className="muted">No outstanding college administrators.</p>}
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>College</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pending.map((u) => (
              <tr key={u._id}>
                <td>{u.email}</td>
                <td>{u.college?.name}</td>
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

      <div className="grid" style={{ gap: 16 }}>
        {colleges.map((c) => (
          <div className="card" key={c._id}>
            <div className="row-between">
              <div>
                <h3>{c.name}</h3>
                <p className="muted">
                  {c.city} · {c.enabled ? 'Active' : 'Paused'}
                </p>
              </div>
              <div className="flex">
                <button className="btn secondary" type="button" onClick={() => toggle(c._id, !c.enabled)}>
                  {c.enabled ? 'Pause' : 'Enable'}
                </button>
                <button className="btn secondary" type="button" onClick={() => regenerate(c._id)}>
                  Rotate key
                </button>
                <button className="btn secondary" type="button" onClick={() => addDept(c._id)}>
                  Add department
                </button>
                <button className="btn secondary" type="button" onClick={() => removeCollege(c._id)}>
                  Remove
                </button>
              </div>
            </div>

            <div className="flex" style={{ marginTop: 20, gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  padding: 16,
                  background: '#fff',
                  borderRadius: 16,
                  border: '1px solid var(--border)',
                }}
              >
                <QRCode value={c.registrationKey} size={160} />
              </div>
              <div>
                <div className="muted">Manual registration payload</div>
                <strong style={{ fontSize: '1.2rem', letterSpacing: 2 }}>{c.registrationKey}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
