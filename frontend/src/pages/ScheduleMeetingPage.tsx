import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import api from '../api';
import type { MeetingFormData, AttendanceStatus } from '../types';

const emptyForm: MeetingFormData = {
  title: '',
  organization: '',
  meeting_type: '',
  date: '',
  time: '',
  venue: '',
  called_by: '',
  prepared_by: '',
  attendees: [],
  agenda_items: [],
  discussion_summary: '',
  tasks: [],
};

export default function ScheduleMeetingPage() {
  const [form, setForm] = useState<MeetingFormData>({ ...emptyForm });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const updateField = (field: string, value: any) => setForm((p) => ({ ...p, [field]: value }));

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
    'w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';
  const labelClass = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Schedule New Meeting</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Meeting Details */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Meeting Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Title *</label>
              <input required value={form.title} onChange={(e) => updateField('title', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Organization</label>
              <input value={form.organization} onChange={(e) => updateField('organization', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Meeting Type</label>
              <input value={form.meeting_type} onChange={(e) => updateField('meeting_type', e.target.value)} placeholder="e.g., Board Meeting" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Venue</label>
              <input value={form.venue} onChange={(e) => updateField('venue', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date</label>
              <input type="date" value={form.date} onChange={(e) => updateField('date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Time</label>
              <input type="time" value={form.time} onChange={(e) => updateField('time', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Called By</label>
              <input value={form.called_by} onChange={(e) => updateField('called_by', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Prepared By</label>
              <input value={form.prepared_by} onChange={(e) => updateField('prepared_by', e.target.value)} className={inputClass} />
            </div>
          </div>
        </section>

        {/* Agenda */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Agenda</h3>
            <button type="button" onClick={addAgenda} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
              <PlusIcon className="w-4 h-4" /> Add
            </button>
          </div>
          {form.agenda_items.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input placeholder="Topic" value={a.topic} onChange={(e) => updateAgenda(i, 'topic', e.target.value)} className={inputClass} />
              <input placeholder="Description" value={a.description || ''} onChange={(e) => updateAgenda(i, 'description', e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeAgenda(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1">
                <TrashIcon className="w-4 h-4" /> Remove
              </button>
            </div>
          ))}
        </section>

        {/* Attendees */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Expected Attendees</h3>
            <button type="button" onClick={addAttendee} className="flex items-center gap-1 text-sm text-primary-600 hover:underline">
              <PlusIcon className="w-4 h-4" /> Add
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4 font-medium italic">
            Note: Filling out this form will schedule the meeting and send invitations to the attendees automatically.
          </p>
          {form.attendees.map((a, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <input placeholder="Name" value={a.user_name} onChange={(e) => updateAttendee(i, 'user_name', e.target.value)} className={inputClass} />
              <input placeholder="Email" value={a.email || ''} onChange={(e) => updateAttendee(i, 'email', e.target.value)} className={inputClass} />
              <button type="button" onClick={() => removeAttendee(i)} className="text-red-500 hover:text-red-700 text-sm flex items-center justify-center gap-1">
                <TrashIcon className="w-4 h-4" /> Remove
              </button>
            </div>
          ))}
        </section>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-medium transition disabled:opacity-50"
        >
          {loading ? 'Scheduling...' : 'Schedule & Send Invites'}
        </button>
      </form>
    </div>
  );
}
