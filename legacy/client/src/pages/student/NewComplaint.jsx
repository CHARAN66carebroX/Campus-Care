import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-toastify';
import { api } from '../../api';

const schema = z.object({
  title: z.string().min(4),
  description: z.string().min(20),
  category: z.string(),
  anonymous: z.coerce.boolean(),
});

export default function NewComplaint() {
  const [templates, setTemplates] = useState([]);
  const [files, setFiles] = useState([]);

  useEffect(() => {
    api('/api/complaints/templates')
      .then(setTemplates)
      .catch(() => {});
  }, []);

  const { register, handleSubmit, reset, setValue, formState } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      category: '',
      anonymous: false,
    },
  });

  function pickTemplate(template) {
    setValue('title', template.title, { shouldValidate: true });
    setValue('description', template.description, { shouldValidate: true });
  }

  async function onSubmit(values) {
    try {
      const fd = new FormData();
      fd.append('title', values.title);
      fd.append('description', values.description);
      fd.append('category', values.category || '');
      fd.append('anonymous', String(values.anonymous));
      for (const f of files.slice(0, 3)) {
        fd.append('files', f);
      }

      await api('/api/complaints', {
        method: 'POST',
        body: fd,
      });
      toast.success('Complaint submitted');
      reset();
      setFiles([]);
    } catch (e) {
      toast.error(e.message);
    }
  }

  return (
    <div className="card">
      <div className="row-between">
        <h2>Create complaint</h2>
        <Link className="btn secondary" to="/student">
          Back to dashboard
        </Link>
      </div>

      <div className="form-row">
        <label>Templates</label>
        <div className="flex">
          {templates.map((tpl) => (
            <button className="btn secondary" type="button" key={tpl.id} onClick={() => pickTemplate(tpl)}>
              {tpl.title}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-row">
          <label>Manual category override (optional)</label>
          <select className="input" {...register('category')}>
            <option value="">Auto detect</option>
            {['Transport', 'Hostel', 'IT', 'Faculty', 'Fees', 'Facilities', 'Exams', 'Other'].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <small className="muted">Leaving empty lets keyword intelligence choose the routing bucket.</small>
        </div>

        <div className="form-row">
          <label>Subject</label>
          <input className="input" {...register('title')} />
        </div>
        <div className="form-row">
          <label>Narrative</label>
          <textarea className="input" rows={6} {...register('description')} />
        </div>
        <div className="form-row">
          <label>
            <input type="checkbox" {...register('anonymous')} /> Submit anonymously towards department staff{' '}
            <span className="muted">
              — your identity stays internal for routing but never appears externally.
            </span>
          </label>
        </div>
        <div className="form-row">
          <label>Attachments (≤3 · images or PDF)</label>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 3))}
          />
        </div>

        <button className="btn" type="submit" disabled={formState.isSubmitting}>
          {formState.isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
