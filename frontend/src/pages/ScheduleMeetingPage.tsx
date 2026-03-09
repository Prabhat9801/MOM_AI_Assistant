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
  meeting_type: '',
  meeting_mode: undefined,
  date: '',
  time: '',
  venue: '',
  called_by: '',
  attendees: [],
  agenda_items: [],
  discussion_summary: '',
  tasks: [],
};

export default function ScheduleMeetingPage() {
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
    setForm((p) => ({
      ...p,
      attendees: [...p.attendees, { user_name: '', email: '', attendance_status: 'Present' as AttendanceStatus }],
    }));
  const removeAttendee = (i: number) =>
    setForm((p) => ({ ...p, attendees: p.attendees.filter((_, idx) => idx !== i) }));
  const updateAttendee = (i: number, field: string, value: string) =>
    setForm((p) => ({
      ...p,
      attendees: p.attendees.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    }));

  // Agenda
  const addAgenda = () =>
    setForm((p) => ({ ...p, agenda_items: [...p.agenda_items, { topic: '', description: '' }] }));
  const removeAgenda = (i: number) =>
    setForm((p) => ({ ...p, agenda_items: p.agenda_items.filter((_, idx) => idx !== i) }));
  const updateAgenda = (i: number, field: string, value: string) =>
    setForm((p) => ({
      ...p,
      agenda_items: p.agenda_items.map((a, idx) => (idx === i ? { ...a, [field]: value } : a)),
    }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error('Meeting title is required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        prepared_by: '',
        date: form.date && form.date.trim() !== '' ? form.date : null,
        time: form.time && form.time.trim() !== '' ? form.time : null,
        attendees: form.attendees.map((a) => ({
          ...a,
          email: a.email && a.email.trim() !== '' ? a.email : null,
        }))
      };
      const { data } = await api.post('/meetings/', payload);
      toast.success('Meeting scheduled successfully! Invitations sent.');
      navigate(`/meetings/${data.id}`);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        toast.error(detail);
      } else if (Array.isArray(detail)) {
        toast.error(detail.map((d: any) => d.msg || JSON.stringify(d)).join('\n'));
      } else {
        toast.error('Failed to schedule meeting');
      }
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1e2436] text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all';
  const labelClass = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1';

  const venueOptions = form.meeting_mode === 'Online' ? ONLINE_VENUES : form.meeting_mode === 'Offline' ? OFFLINE_VENUES : [];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Schedule New Meeting</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Details */}
        <section className="bg-white dark:bg-[#161b27] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Meeting Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Organization</label>
              <input value={form.organization || ''} onChange={(e) => updateField('organization', e.target.value)} className={`${inputClass} bg-slate-50 dark:bg-slate-800`} />
            </div>
            <div>
              <label className={labelClass}>Meeting Type</label>
              <input value={form.meeting_type || ''} onChange={(e) => updateField('meeting_type', e.target.value)} placeholder="e.g., Board Meeting" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Hosted By</label>
              <input value={form.called_by || ''} onChange={(e) => updateField('called_by', e.target.value)} className={inputClass} />
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
              <label className={labelClass}>Meeting Mode *</label>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => handleModeChange('Online')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.meeting_mode === 'Online' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                  🌐 Online
                </button>
                <button type="button" onClick={() => handleModeChange('Offline')}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border-2 transition-all ${form.meeting_mode === 'Offline' ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10 text-brand-600' : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-slate-300'}`}>
                  🏢 Offline
                </button>
              </div>
            </div>

            {/* Venue — conditional on mode */}
            {form.meeting_mode && (
              <div className="md:col-span-2">
                <label className={labelClass}>Venue</label>
                <div className="flex gap-3">
                  <select
                    value={venueCustom ? 'Other' : (form.venue || '')}
                    onChange={(e) => handleVenueSelect(e.target.value)}
                    className={`${inputClass} flex-1`}
                  >
                    <option value="">-- Select Venue --</option>
                    {venueOptions.map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                  {venueCustom && (
                    <input
                      placeholder={form.meeting_mode === 'Online' ? 'Enter meeting link or platform' : 'Enter venue name'}
                      value={form.venue || ''}
                      onChange={(e) => updateField('venue', e.target.value)}
                      className={`${inputClass} flex-1`}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Agenda */}
        <section className="bg-white dark:bg-[#161b27] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Agenda</h3>
            <button type="button" onClick={addAgenda} className="flex items-center gap-1 text-sm text-brand-600 hover:underline font-semibold">
              <PlusIcon className="w-4 h-4" /> Add
            </button>
          </div>
          {form.agenda_items.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input placeholder="Topic" value={a.topic} onChange={(e) => updateAgenda(i, 'topic', e.target.value)} className={inputClass} />
              <input placeholder="Description" value={a.description || ''} onChange={(e) => updateAgenda(i, 'description', e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeAgenda(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1 font-medium">
                <TrashIcon className="w-4 h-4" /> Remove
              </button>
            </div>
          ))}
        </section>

        {/* Attendees */}
        <section className="bg-white dark:bg-[#161b27] rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Expected Attendees</h3>
            <button type="button" onClick={addAttendee} className="flex items-center gap-1 text-sm text-brand-600 hover:underline font-semibold">
              <PlusIcon className="w-4 h-4" /> Add
            </button>
          </div>
          <p className="text-sm text-slate-400 mb-4 font-medium italic">
            Note: Invitations will be sent automatically to the attendees.
          </p>
          {form.attendees.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input placeholder="Name" value={a.user_name} onChange={(e) => updateAttendee(i, 'user_name', e.target.value)} className={inputClass} />
              <input placeholder="Email" value={a.email || ''} onChange={(e) => updateAttendee(i, 'email', e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeAttendee(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center justify-center gap-1 font-medium">
                <TrashIcon className="w-4 h-4" /> Remove
              </button>
            </div>
          ))}
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold transition-all disabled:opacity-50 shadow-[0_4px_14px_rgba(57,157,255,0.3)]"
        >
          {loading ? 'Scheduling...' : 'Schedule & Send Invites'}
        </button>
      </form>
    </div>
  );
}
