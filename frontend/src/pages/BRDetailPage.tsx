import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import {
  TrashIcon, ArrowLeftIcon, CalendarDaysIcon, MapPinIcon, ClockIcon,
  UserIcon, BuildingOfficeIcon, BuildingLibraryIcon, DocumentIcon,
  ArrowDownTrayIcon, ArrowUpTrayIcon, ClipboardDocumentListIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '../api';
import type { Meeting, BRDocument } from '../types';

const statusColors: Record<string, string> = {
  Passed: 'bg-emerald-500 text-white',
  Rejected: 'bg-red-500 text-white',
  Pending: 'bg-amber-500 text-white',
  Deferred: 'bg-slate-500 text-white',
};
const taskStatusColors: Record<string, string> = {
  Completed: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  'In Progress': 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  Pending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
};

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-[#161b27] rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
        <span className="text-purple-500">{icon}</span>
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-white">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

export default function BRDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: meeting, isLoading } = useQuery<Meeting>({
    queryKey: ['meeting', id],
    queryFn: async () => (await api.get(`/meetings/${id}`)).data,
  });

  const { data: documents = [], refetch: refetchDocs } = useQuery<BRDocument[]>({
    queryKey: ['br-documents', id],
    queryFn: async () => (await api.get(`/meetings/${id}/documents`)).data,
  });

  const handleDelete = async () => {
    if (!meeting || !window.confirm(`Delete "${meeting.title}"?`)) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Resolution deleted');
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      navigate('/board-resolutions');
    } catch { toast.error('Failed to delete'); }
  };

  const handleUploadDoc = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !id) return;
    for (const file of Array.from(e.target.files)) {
      const fd = new FormData();
      fd.append('file', file);
      await api.post(`/meetings/${id}/documents`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    }
    toast.success('Documents uploaded');
    refetchDocs();
  }, [id, refetchDocs]);

  const handleDeleteDoc = async (docId: number) => {
    if (!window.confirm('Delete this document?')) return;
    await api.delete(`/meetings/${id}/documents/${docId}`);
    toast.success('Document deleted');
    refetchDocs();
  };

  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await api.put(`/tasks/${taskId}`, { status: newStatus });
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['meeting', id] });
    } catch { toast.error('Failed'); }
  };

  if (isLoading || !meeting) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400">Loading resolution…</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-4xl mx-auto">

      {/* Nav */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link to="/board-resolutions" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-500 hover:text-brand-600 transition-colors">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Board Resolutions
        </Link>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleDelete} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 border border-red-100 dark:border-red-500/20 transition-all">
            <TrashIcon className="w-4 h-4" /> Delete
          </button>
          <button onClick={() => window.open(`/api/v1/meetings/${id}/pdf`, '_blank')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-bold rounded-xl bg-brand-500 text-white hover:bg-brand-600 shadow-md transition-all">
            <ArrowDownTrayIcon className="w-4 h-4" /> Download PDF
          </button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-800" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-purple-200">Board Resolution</p>
            {meeting.resolution_status && (
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${statusColors[meeting.resolution_status] || 'bg-slate-500 text-white'}`}>
                {meeting.resolution_status}
              </span>
            )}
          </div>
          <h2 className="text-2xl font-extrabold mb-1">{meeting.title}</h2>
          {meeting.resolution_number && <p className="text-sm font-mono text-purple-200 mb-4">{meeting.resolution_number} · {meeting.resolution_type || 'Resolution'}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { icon: <BuildingOfficeIcon className="w-4 h-4" />, label: 'Organization', value: meeting.organization },
              { icon: <CalendarDaysIcon className="w-4 h-4" />, label: 'Date', value: meeting.date },
              { icon: <ClockIcon className="w-4 h-4" />, label: 'Time', value: meeting.time },
              { icon: <MapPinIcon className="w-4 h-4" />, label: 'Venue', value: meeting.venue },
              { icon: <UserIcon className="w-4 h-4" />, label: 'Hosted By', value: meeting.called_by },
            ].filter(i => i.value).map((item, idx) => (
              <div key={idx} className="bg-white/10 rounded-xl px-3.5 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-1.5 text-purple-200 mb-1">
                  {item.icon}
                  <p className="text-[10px] font-bold uppercase tracking-wide">{item.label}</p>
                </div>
                <p className="text-[13px] font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Next Meeting */}
      {meeting.next_meeting && (
        <Section title="Next Meeting" icon={<CalendarDaysIcon className="w-[18px] h-[18px]" />}>
          <div className="flex items-center gap-6 text-[13px] text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-2"><CalendarDaysIcon className="w-4 h-4 text-purple-500" />{meeting.next_meeting.next_date || 'TBD'}</span>
            <span className="flex items-center gap-2"><ClockIcon className="w-4 h-4 text-purple-500" />{meeting.next_meeting.next_time || 'TBD'}</span>
          </div>
        </Section>
      )}

      {/* Resolution Text */}
      {meeting.resolution_text && (
        <Section title="Resolution Text" icon={<BuildingLibraryIcon className="w-[18px] h-[18px]" />}>
          <div className="bg-purple-50 dark:bg-purple-500/5 border border-purple-100 dark:border-purple-500/20 rounded-xl p-5">
            <p className="text-[14px] text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed italic">"{meeting.resolution_text}"</p>
          </div>
        </Section>
      )}

      {/* Voting & Proposers */}
      <Section title="Voting & Proposers" icon={<CheckCircleIcon className="w-[18px] h-[18px]" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {meeting.proposer && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-700 dark:text-purple-400 text-[13px] font-bold shrink-0">{meeting.proposer.charAt(0)}</div>
              <div><p className="text-[11px] text-slate-400 font-bold uppercase">Proposer</p><p className="text-[13px] font-semibold text-slate-800 dark:text-white">{meeting.proposer}</p></div>
            </div>
          )}
          {meeting.seconder && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
              <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-700 dark:text-indigo-400 text-[13px] font-bold shrink-0">{meeting.seconder.charAt(0)}</div>
              <div><p className="text-[11px] text-slate-400 font-bold uppercase">Seconder</p><p className="text-[13px] font-semibold text-slate-800 dark:text-white">{meeting.seconder}</p></div>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{meeting.voting_for || 0}</p>
            <p className="text-[11px] font-bold text-emerald-600/80 uppercase mt-1">✅ For</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
            <p className="text-2xl font-black text-red-600 dark:text-red-400">{meeting.voting_against || 0}</p>
            <p className="text-[11px] font-bold text-red-600/80 uppercase mt-1">❌ Against</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-slate-50 dark:bg-slate-500/10 border border-slate-200 dark:border-slate-500/20">
            <p className="text-2xl font-black text-slate-600 dark:text-slate-400">{meeting.voting_abstain || 0}</p>
            <p className="text-[11px] font-bold text-slate-600/80 uppercase mt-1">⬜ Abstain</p>
          </div>
        </div>
      </Section>

      {/* Documents */}
      <Section title="Supporting Documents" icon={<DocumentIcon className="w-[18px] h-[18px]" />}>
        <div className="space-y-2 mb-4">
          {documents.length === 0 ? (
            <p className="text-sm text-slate-400">No documents uploaded yet.</p>
          ) : documents.map((doc) => (
            <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
              <DocumentIcon className="w-6 h-6 text-brand-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{doc.file_name}</p>
                <p className="text-[11px] text-slate-400">{doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : ''}</p>
              </div>
              <a href={`/api/v1/meetings/${id}/documents/${doc.id}/download`} target="_blank" className="text-[12px] font-semibold text-brand-600 hover:underline">Download</a>
              <button onClick={() => handleDeleteDoc(doc.id)} className="text-[12px] font-semibold text-red-500 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <label className="inline-flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-600 border border-brand-100 dark:border-brand-500/20 cursor-pointer hover:bg-brand-100 transition-all">
          <ArrowUpTrayIcon className="w-4 h-4" /> Upload Document
          <input type="file" multiple onChange={handleUploadDoc} className="hidden" />
        </label>
      </Section>

      {/* Attendees */}
      <Section title="Directors / Attendees" icon={<UserIcon className="w-[18px] h-[18px]" />}>
        {meeting.attendees.length === 0 ? <p className="text-sm text-slate-400">No attendees.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {meeting.attendees.map((a) => {
              const present = String(a.attendance_status).toLowerCase().includes('present');
              return (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
                  <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-700 dark:text-purple-400 text-[13px] font-bold shrink-0">{a.user_name.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{a.user_name}</p>
                    <p className="text-[11px] text-slate-400 truncate">{a.email || 'No email'}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border shrink-0 ${present ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400'}`}>
                    {present ? '✓ Present' : '✗ Absent'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Agenda */}
      <Section title="Agenda Items" icon={<ClipboardDocumentListIcon className="w-[18px] h-[18px]" />}>
        {meeting.agenda_items.length === 0 ? <p className="text-sm text-slate-400">No agenda items.</p> : (
          <div className="space-y-2.5">
            {meeting.agenda_items.map((a, i) => (
              <div key={a.id} className="flex gap-3.5 p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                <div>
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white">{a.topic}</p>
                  {a.description && <p className="text-[12px] text-slate-500 mt-0.5">{a.description}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Discussion */}
      {meeting.discussion && (
        <Section title="Discussion Summary" icon={<CheckCircleIcon className="w-[18px] h-[18px]" />}>
          <p className="text-[13px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{meeting.discussion.summary_text}</p>
        </Section>
      )}

      {/* Tasks */}
      <Section title="Action Items / Tasks" icon={<ClipboardDocumentListIcon className="w-[18px] h-[18px]" />}>
        {meeting.tasks.length === 0 ? <p className="text-sm text-slate-400">No tasks.</p> : (
          <div className="space-y-2.5">
            {meeting.tasks.map((t) => (
              <div key={t.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-white/5">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-white">{t.title}</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    {t.responsible_person && <span className="flex items-center gap-1"><UserIcon className="w-3 h-3" />{t.responsible_person}</span>}
                    {t.deadline && <span className="flex items-center gap-1"><CalendarDaysIcon className="w-3 h-3" />Due: {t.deadline}</span>}
                  </div>
                </div>
                <select value={t.status} onChange={(e) => handleStatusChange(t.id, e.target.value)}
                  className={`text-[12px] font-bold px-3 py-1.5 rounded-lg border cursor-pointer focus:outline-none shrink-0 ${taskStatusColors[t.status] ?? taskStatusColors['Pending']}`}>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
