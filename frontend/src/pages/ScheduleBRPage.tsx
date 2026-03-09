import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api';
import type { MeetingFormData, AttendanceStatus } from '../types';

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
  is_board_resolution: true, // Marked as BR
};

export default function ScheduleBRPage() {
  const [form, setForm] = useState<MeetingFormData>({ ...emptyForm });
  const [venueCustom, setVenueCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

  const handleModeChange = (mode: 'Online' | 'Offline') => {
    setForm((p) => ({ ...p, meeting_mode: mode, venue: '' }));
    setVenueCustom(false);
  };

  const handleVenueSelect = (val: string) => {
    if (val === 'Other') {
      setVenueCustom(true);
      setForm((p) => ({ ...p, venue: '' }));
    } else {
      setVenueCustom(false);
      setForm((p) => ({ ...p, venue: val }));
    }
  };

  // Attendees
  const addAttendee = () =>
    setForm((p) => ({ ...p, attendees: [...p.attendees, { user_name: '', email: '', attendance_status: 'Present' as AttendanceStatus }] }));
  const removeAttendee = (i: number) =>
    setForm((p) => ({ ...p, attendees: p.attendees.filter((_, idx) => idx !== i) }));
  const updateAttendee = (i: number, field: string, value: string) =>
    setForm((p) => ({ ...p, attendees: p.attendees.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)) }));

  // Agenda
  const addAgenda = () =>
    setForm((p) => ({ ...p, agenda_items: [...p.agenda_items, { topic: '', description: '' }] }));
  const removeAgenda = (i: number) =>
    setForm((p) => ({ ...p, agenda_items: p.agenda_items.filter((_, idx) => idx !== i) }));
  const updateAgenda = (i: number, field: string, value: string) =>
    setForm((p) => ({ ...p, agenda_items: p.agenda_items.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Resolution title is required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        prepared_by: '',
        date: form.date && form.date.trim() !== '' ? form.date : null,
        time: form.time && form.time.trim() !== '' ? form.time : null,
        attendees: form.attendees.map((a) => ({ ...a, email: a.email && a.email.trim() !== '' ? a.email : null }))
      };
      const { data } = await api.post('/meetings/', payload);
      toast.success('Board Resolution Scheduled! Invitations sent.');
      navigate(`/board-resolutions/${data.id}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') toast.error(detail);
      else if (Array.isArray(detail)) toast.error(detail.map((d: any) => d.msg || JSON.stringify(d)).join('\n'));
      else toast.error('Failed to schedule board resolution');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2436] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1';
  const sectionClass = 'bg-white dark:bg-[#161b27] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6';

  const venueOptions = form.meeting_mode === 'Online' ? ONLINE_VENUES : form.meeting_mode === 'Offline' ? OFFLINE_VENUES : [];

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">📅 Schedule Board Resolution</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <section className={sectionClass}>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Resolution Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className={labelClass}>Resolution Title *</label>
              <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} placeholder="e.g., Q3 Financial Review BR" />
            </div>
            <div>
              <label className={labelClass}>Organization</label>
              <input value={form.organization || ''} onChange={(e) => updateField('organization', e.target.value)} className={`${inputClass} bg-slate-50 dark:bg-slate-800`} />
            </div>
            <div>
              <label className={labelClass}>Hosted By</label>
              <input value={form.called_by || ''} onChange={(e) => updateField('called_by', e.target.value)} className={inputClass} placeholder="Name or role" />
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
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.meeting_mode === 'Online' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}>
                  🌐 Online
                </button>
                <button type="button" onClick={() => handleModeChange('Offline')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.meeting_mode === 'Offline' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}>
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
                  {venueCustom && <input placeholder="Enter venue link or address" value={form.venue || ''} onChange={(e) => updateField('venue', e.target.value)} className={`${inputClass} flex-1`} />}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Invited Directors / Attendees */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">👥 Invited Directors</h3>
            <button type="button" onClick={addAttendee} className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline font-semibold"><PlusIcon className="w-4 h-4" /> Add</button>
          </div>
          {form.attendees.map((a, i) => (
            <div key={i} className="flex flex-col sm:flex-row gap-3 mb-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl">
              <input placeholder="Name *" required value={a.user_name} onChange={(e) => updateAttendee(i, 'user_name', e.target.value)} className={`${inputClass} flex-1`} />
              <input placeholder="Email *" type="email" required value={a.email || ''} onChange={(e) => updateAttendee(i, 'email', e.target.value)} className={`${inputClass} flex-1`} />
              <button type="button" onClick={() => removeAttendee(i)} className="w-10 h-10 flex shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/30 transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
          ))}
          {form.attendees.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No directors added yet. Click "Add" above to invite them.</p>}
        </section>

        {/* Agenda */}
        <section className={sectionClass}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">📋 Agenda Topics</h3>
            <button type="button" onClick={addAgenda} className="flex items-center gap-1 text-sm text-brand-600 dark:text-brand-400 hover:underline font-semibold"><PlusIcon className="w-4 h-4" /> Add</button>
          </div>
          {form.agenda_items.map((a, i) => (
            <div key={i} className="flex flex-col gap-2 mb-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl relative group border border-transparent dark:hover:border-slate-700 transition-all">
              <button type="button" onClick={() => removeAgenda(i)} className="absolute top-3 right-3 text-slate-400 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Topic Title *</label>
                <input required placeholder="E.g., Approval of Annual Report" value={a.topic} onChange={(e) => updateAgenda(i, 'topic', e.target.value)} className={inputClass} />
              </div>
              <div className="mt-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 block">Description (Optional)</label>
                <textarea rows={2} placeholder="Brief context about this agenda item..." value={a.description || ''} onChange={(e) => updateAgenda(i, 'description', e.target.value)} className={inputClass} />
              </div>
            </div>
          ))}
          {form.agenda_items.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">No agenda topics added.</p>}
        </section>

        <button type="submit" disabled={loading}
          className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(57,157,255,0.3)]">
          {loading ? 'Scheduling...' : '✉️ Schedule BR & Send Invites'}
        </button>
      </form>
    </div>
  );
}
