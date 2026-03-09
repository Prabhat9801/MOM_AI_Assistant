import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, DocumentIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import api from '../api';
import type { MeetingFormData, AttendanceStatus, TaskStatus } from '../types';

const ONLINE_VENUES = ['Google Meet', 'Zoom', 'Other'];
const OFFLINE_VENUES = ['Conference Hall', 'Other'];

const emptyForm: MeetingFormData = {
  title: '',
  organization: 'Botivate Service LLP',
  meeting_type: 'Board Resolution',
  meeting_mode: undefined,
  date: '',
  time: '',
  venue: '',
  called_by: '',
  attendees: [],
  agenda_items: [],
  discussion_summary: '',
  tasks: [],
  next_meeting: { next_date: '', next_time: '' },
  // BR fields
  is_board_resolution: true,
  resolution_type: '',
  resolution_status: '',
  resolution_text: '',
  proposer: '',
  seconder: '',
  voting_for: 0,
  voting_against: 0,
  voting_abstain: 0,
};

export default function CreateBRPage() {
  const [form, setForm] = useState<MeetingFormData>({ ...emptyForm });
  const [venueCustom, setVenueCustom] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleModeChange = (mode: 'Online' | 'Offline') => {
    setForm((p) => ({ ...p, meeting_mode: mode, venue: '' }));
    setVenueCustom(false);
  };
  const handleVenueSelect = (val: string) => {
    if (val === 'Other') { setVenueCustom(true); setForm((p) => ({ ...p, venue: '' })); }
    else { setVenueCustom(false); setForm((p) => ({ ...p, venue: val })); }
  };

  // Attendees
  const addAttendee = () => setForm((p) => ({
    ...p, attendees: [...p.attendees, { user_name: '', email: '', attendance_status: 'Present' as AttendanceStatus }],
  }));
  const removeAttendee = (i: number) => setForm((p) => ({ ...p, attendees: p.attendees.filter((_, idx) => idx !== i) }));
  const updateAttendee = (i: number, field: string, value: string) =>
    setForm((p) => ({ ...p, attendees: p.attendees.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)) }));

  // Agenda
  const addAgenda = () => setForm((p) => ({ ...p, agenda_items: [...p.agenda_items, { topic: '', description: '' }] }));
  const removeAgenda = (i: number) => setForm((p) => ({ ...p, agenda_items: p.agenda_items.filter((_, idx) => idx !== i) }));
  const updateAgenda = (i: number, field: string, value: string) =>
    setForm((p) => ({ ...p, agenda_items: p.agenda_items.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)) }));

  // Tasks
  const addTask = () => setForm((p) => ({
    ...p, tasks: [...p.tasks, { title: '', description: '', responsible_person: '', responsible_email: '', deadline: '', status: 'Pending' as TaskStatus }],
  }));
  const removeTask = (i: number) => setForm((p) => ({ ...p, tasks: p.tasks.filter((_, idx) => idx !== i) }));
  const updateTask = (i: number, field: string, value: string) =>
    setForm((p) => ({ ...p, tasks: p.tasks.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)) }));

  // Documents
  const handleDocFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setPendingDocs((prev) => [...prev, ...Array.from(e.target.files!)]);
  }, []);
  const removeDoc = (i: number) => setPendingDocs((prev) => prev.filter((_, idx) => idx !== i));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Resolution title is required'); return; }
    if (!form.resolution_text?.trim()) { toast.error('Resolution text is required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        prepared_by: '',
        date: form.date && form.date.trim() !== '' ? form.date : null,
        time: form.time && form.time.trim() !== '' ? form.time : null,
        tasks: form.tasks.map((t) => ({
          ...t,
          deadline: t.deadline && t.deadline.trim() !== '' ? t.deadline : null,
          responsible_email: t.responsible_email && t.responsible_email.trim() !== '' ? t.responsible_email : null,
        })),
        attendees: form.attendees.map((a) => ({
          ...a,
          email: a.email && a.email.trim() !== '' ? a.email : null,
        })),
        next_meeting: form.next_meeting && (form.next_meeting.next_date?.trim() || form.next_meeting.next_time?.trim())
          ? { next_date: form.next_meeting.next_date || null, next_time: form.next_meeting.next_time || null } : null,
      };
      const { data } = await api.post('/meetings/', payload);

      // Upload documents
      for (const doc of pendingDocs) {
        const fd = new FormData();
        fd.append('file', doc);
        await api.post(`/meetings/${data.id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      }

      toast.success('Board Resolution created successfully!');
      navigate(`/board-resolutions/${data.id}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      toast.error(typeof detail === 'string' ? detail : 'Failed to create resolution');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2436] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1';
  const sectionClass = 'bg-white dark:bg-[#161b27] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6';

  const venueOptions = form.meeting_mode === 'Online' ? ONLINE_VENUES : form.meeting_mode === 'Offline' ? OFFLINE_VENUES : [];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">🏛️ Create Board Resolution</h2>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Basic Info */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resolution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Resolution Title *</label>
              <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} placeholder="e.g., Approval of Annual Budget 2026-27" />
            </div>
            <div>
              <label className={labelClass}>Organization</label>
              <input value={form.organization || ''} onChange={(e) => updateField('organization', e.target.value)} className={`${inputClass} bg-slate-50 dark:bg-slate-800`} />
            </div>
            <div>
              <label className={labelClass}>Hosted By</label>
              <input value={form.called_by || ''} onChange={(e) => updateField('called_by', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Resolution Type</label>
              <select value={form.resolution_type || ''} onChange={(e) => updateField('resolution_type', e.target.value)} className={inputClass}>
                <option value="">-- Select Type --</option>
                <option value="Ordinary">Ordinary</option>
                <option value="Special">Special</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Resolution Status</label>
              <select value={form.resolution_status || ''} onChange={(e) => updateField('resolution_status', e.target.value)} className={inputClass}>
                <option value="">-- Select Status --</option>
                <option value="Pending">Pending</option>
                <option value="Passed">Passed</option>
                <option value="Rejected">Rejected</option>
                <option value="Deferred">Deferred</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" value={form.date || ''} onChange={(e) => updateField('date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input type="time" value={form.time || ''} onChange={(e) => updateField('time', e.target.value)} className={inputClass} />
            </div>
            {/* Meeting Mode */}
            <div className="md:col-span-2">
              <label className={labelClass}>Meeting Mode</label>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => handleModeChange('Online')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.meeting_mode === 'Online' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                  🌐 Online
                </button>
                <button type="button" onClick={() => handleModeChange('Offline')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.meeting_mode === 'Offline' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                  🏢 Offline
                </button>
              </div>
            </div>
            {form.meeting_mode && (
              <div className="md:col-span-2">
                <label className={labelClass}>Venue</label>
                <div className="flex gap-3">
                  <select value={venueCustom ? 'Other' : (form.venue || '')} onChange={(e) => handleVenueSelect(e.target.value)} className={`${inputClass} flex-1`}>
                    <option value="">-- Select Venue --</option>
                    {venueOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {venueCustom && <input placeholder="Enter venue" value={form.venue || ''} onChange={(e) => updateField('venue', e.target.value)} className={`${inputClass} flex-1`} />}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Resolution Text */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📜 Resolution Text *</h3>
          <textarea rows={5} required value={form.resolution_text || ''} onChange={(e) => updateField('resolution_text', e.target.value)} className={inputClass}
            placeholder='RESOLVED THAT the Board of Directors hereby approves...' />
        </section>

        {/* Proposer & Seconder */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">🗳️ Proposer, Seconder & Voting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Proposer</label>
              <input value={form.proposer || ''} onChange={(e) => updateField('proposer', e.target.value)} className={inputClass} placeholder="Who proposed this resolution" />
            </div>
            <div>
              <label className={labelClass}>Seconder</label>
              <input value={form.seconder || ''} onChange={(e) => updateField('seconder', e.target.value)} className={inputClass} placeholder="Who seconded this resolution" />
            </div>
            <div>
              <label className={labelClass}>Votes For ✅</label>
              <input type="number" min="0" value={form.voting_for || 0} onChange={(e) => updateField('voting_for', parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Votes Against ❌</label>
              <input type="number" min="0" value={form.voting_against || 0} onChange={(e) => updateField('voting_against', parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Abstained ⬜</label>
              <input type="number" min="0" value={form.voting_abstain || 0} onChange={(e) => updateField('voting_abstain', parseInt(e.target.value) || 0)} className={inputClass} />
            </div>
          </div>
        </section>

        {/* Supporting Documents */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📎 Supporting Documents</h3>
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-brand-400 transition-all">
            <ArrowUpTrayIcon className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm text-slate-500">Click to upload documents (PDF, Images, Excel)</span>
            <input type="file" multiple onChange={handleDocFiles} className="hidden" accept=".pdf,.png,.jpg,.jpeg,.xlsx,.xls,.csv,.doc,.docx" />
          </label>
          {pendingDocs.length > 0 && (
            <div className="mt-3 space-y-2">
              {pendingDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <DocumentIcon className="w-6 h-6 text-brand-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">{(doc.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <button type="button" onClick={() => removeDoc(i)} className="text-sm text-red-500 hover:underline font-medium">Remove</button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Attendees (Directors) */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">👥 Directors / Attendees</h3>
            <button type="button" onClick={addAttendee} className="flex items-center gap-1 text-sm text-brand-600 hover:underline font-semibold"><PlusIcon className="w-4 h-4" /> Add</button>
          </div>
          {form.attendees.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <input placeholder="Name" value={a.user_name} onChange={(e) => updateAttendee(i, 'user_name', e.target.value)} className={inputClass} />
              <input placeholder="Email" value={a.email || ''} onChange={(e) => updateAttendee(i, 'email', e.target.value)} className={inputClass} />
              <select value={a.attendance_status} onChange={(e) => updateAttendee(i, 'attendance_status', e.target.value)} className={inputClass}>
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Excused">Excused</option>
              </select>
              <button type="button" onClick={() => removeAttendee(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Remove</button>
            </div>
          ))}
        </section>

        {/* Agenda */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">📋 Agenda</h3>
            <button type="button" onClick={addAgenda} className="flex items-center gap-1 text-sm text-brand-600 hover:underline font-semibold"><PlusIcon className="w-4 h-4" /> Add</button>
          </div>
          {form.agenda_items.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input placeholder="Topic" value={a.topic} onChange={(e) => updateAgenda(i, 'topic', e.target.value)} className={inputClass} />
              <input placeholder="Description" value={a.description || ''} onChange={(e) => updateAgenda(i, 'description', e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeAgenda(i)} className="text-red-500 text-sm flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Remove</button>
            </div>
          ))}
        </section>

        {/* Discussion */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Discussion Summary</h3>
          <textarea rows={3} value={form.discussion_summary || ''} onChange={(e) => updateField('discussion_summary', e.target.value)} className={inputClass} placeholder="Key discussion points..." />
        </section>

        {/* Action Items */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">✅ Action Items</h3>
            <button type="button" onClick={addTask} className="flex items-center gap-1 text-sm text-brand-600 hover:underline font-semibold"><PlusIcon className="w-4 h-4" /> Add</button>
          </div>
          {form.tasks.map((t, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3 bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
              <input placeholder="Task" value={t.title} onChange={(e) => updateTask(i, 'title', e.target.value)} className={inputClass} />
              <input placeholder="Responsible" value={t.responsible_person || ''} onChange={(e) => updateTask(i, 'responsible_person', e.target.value)} className={inputClass} />
              <input placeholder="Email" value={t.responsible_email || ''} onChange={(e) => updateTask(i, 'responsible_email', e.target.value)} className={inputClass} />
              <input type="date" value={t.deadline || ''} onChange={(e) => updateTask(i, 'deadline', e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeTask(i)} className="text-red-500 text-sm flex items-center gap-1"><TrashIcon className="w-4 h-4" /> Remove</button>
            </div>
          ))}
        </section>

        {/* Next Meeting */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">📅 Next Meeting</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" value={form.next_meeting?.next_date || ''} onChange={(e) => setForm((p) => ({ ...p, next_meeting: { ...p.next_meeting!, next_date: e.target.value } }))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input type="time" value={form.next_meeting?.next_time || ''} onChange={(e) => setForm((p) => ({ ...p, next_meeting: { ...p.next_meeting!, next_time: e.target.value } }))} className={inputClass} />
            </div>
          </div>
        </section>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(57,157,255,0.3)]">
          {loading ? 'Creating Resolution...' : '🏛️ Create Board Resolution'}
        </button>
      </form>
    </div>
  );
}
