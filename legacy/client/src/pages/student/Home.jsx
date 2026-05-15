import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../../api';

function StageBadge({ stage }) {
  return <span className="badge">{stage.replace('_', ' ')}</span>;
}

export default function StudentHome() {
  const [mine, setMine] = useState([]);
  const [browse, setBrowse] = useState([]);

  async function load() {
    try {
      const [m, b] = await Promise.all([
        api('/api/complaints'),
        api('/api/complaints/browse'),
      ]);
      setMine(m);
      setBrowse(b);
    } catch (e) {
      toast.error(e.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function upvote(id) {
    try {
      await api(`/api/complaints/${id}/upvote`, { method: 'POST', body: JSON.stringify({}) });
      toast.success('Updated');
      load();
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      <div className="card row-between">
        <div>
          <h2>My complaints</h2>
          <p className="muted">Realtime updates notify you instantly when admins move the ticket.</p>
        </div>
        <Link className="btn" to="/student/new">
          New complaint
        </Link>
      </div>

      <div className="card">
        <h3>Open requests</h3>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Sentiment</th>
              <th>Stage</th>
              <th>Escalation</th>
            </tr>
          </thead>
          <tbody>
            {mine.map((c) => (
              <tr key={c._id}>
                <td>{c.title}</td>
                <td>{c.category}</td>
                <td>{c.sentiment}</td>
                <td>
                  <StageBadge stage={c.stage} />
                </td>
                <td>Level {c.escalationLevel}</td>
              </tr>
            ))}
            {!mine.length && (
              <tr>
                <td colSpan={5} className="muted">
                  Nothing submitted yet — start above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="row-between">
          <div>
            <h3>Shared issues ({browse.length})</h3>
            <p className="muted">
              Vote on non-anonymous cases from classmates to signal recurring problems.
            </p>
          </div>
          <button className="btn secondary" type="button" onClick={load}>
            Refresh feed
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Department</th>
              <th>Title</th>
              <th>Signals</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {browse.map((c) => (
              <tr key={c._id}>
                <td>{c.department?.name}</td>
                <td>{c.title}</td>
                <td>{c.upvotes?.length || 0}</td>
                <td>
                  <button className="btn secondary" type="button" onClick={() => upvote(c._id)}>
                    Toggle upvote
                  </button>
                </td>
              </tr>
            ))}
            {!browse.length && (
              <tr>
                <td colSpan={4} className="muted">
                  No complaints available for browsing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
