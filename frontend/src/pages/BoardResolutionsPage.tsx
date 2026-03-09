import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  TrashIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  PlusIcon,
  BuildingLibraryIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';
import api from '../api';
import type { MeetingListItem } from '../types';

type TabType = 'upcoming' | 'completed';

const statusBadge: Record<string, string> = {
  Passed: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  Rejected: 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20',
  Pending: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  Deferred: 'bg-slate-50 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
};

export default function BoardResolutionsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabType>('upcoming');

  const { data: allMeetings = [], isLoading } = useQuery<MeetingListItem[]>({
    queryKey: ['meetings'],
    queryFn: async () => (await api.get('/meetings/')).data,
  });

  // Filter only board resolutions
  const brMeetings = useMemo(() => allMeetings.filter((m) => m.is_board_resolution), [allMeetings]);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const upcoming = useMemo(() => brMeetings.filter((m) => !m.date || m.date >= today), [brMeetings, today]);
  const completed = useMemo(() => brMeetings.filter((m) => m.date && m.date < today), [brMeetings, today]);

  const filtered = tab === 'upcoming' ? upcoming : completed;

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`Delete board resolution "${title}"?\nThis action cannot be undone.`)) return;
    try {
      await api.delete(`/meetings/${id}`);
      toast.success('Resolution deleted');
      queryClient.invalidateQueries({ queryKey: ['meetings'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="space-y-5 max-w-[1200px] mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">Board Resolutions</h2>
          <p className="text-sm text-slate-400 mt-0.5">{brMeetings.length} resolution{brMeetings.length !== 1 ? 's' : ''} total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/upload-br"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-xl bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-all border border-transparent dark:border-slate-800"
          >
            <ArrowUpTrayIcon className="w-4 h-4" />
            Upload MOM
          </Link>
          <Link
            to="/schedule-br"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-semibold rounded-xl bg-brand-50 dark:bg-brand-500/10 text-brand-700 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-500/20 transition-all border border-brand-100 dark:border-brand-500/20"
          >
            <CalendarDaysIcon className="w-4 h-4" />
            Schedule Meeting
          </Link>
          <Link
            to="/create-br"
            className="inline-flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold rounded-xl bg-brand-500 text-white hover:bg-brand-600 shadow-md shadow-brand-200 dark:shadow-brand-900/40 transition-all active:scale-[0.98]"
          >
            <PlusIcon className="w-4 h-4" />
            New Resolution
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-[#1e2436] p-1 rounded-xl w-fit">
        <button onClick={() => setTab('upcoming')}
          className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all ${tab === 'upcoming' ? 'bg-white dark:bg-[#161b27] text-brand-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          📅 Upcoming ({upcoming.length})
        </button>
        <button onClick={() => setTab('completed')}
          className={`px-5 py-2.5 text-[13px] font-bold rounded-lg transition-all ${tab === 'completed' ? 'bg-white dark:bg-[#161b27] text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
          ✅ Completed ({completed.length})
        </button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3">
          <div className="w-7 h-7 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading resolutions…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-52 gap-3 bg-white dark:bg-[#161b27] rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <BuildingLibraryIcon className="w-10 h-10 text-slate-300 dark:text-slate-600" />
          <p className="text-sm font-medium text-slate-400">{tab === 'upcoming' ? 'No upcoming resolutions.' : 'No completed resolutions yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filtered.map((m) => (
            <div key={m.id} className="group bg-white dark:bg-[#161b27] rounded-2xl border border-slate-100 dark:border-slate-800 px-5 py-4 shadow-sm hover:shadow-md hover:border-brand-200 dark:hover:border-brand-500/30 transition-all duration-200">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-500/15 flex items-center justify-center shrink-0">
                    <BuildingLibraryIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <Link to={`/board-resolutions/${m.id}`} className="text-[15px] font-bold text-slate-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 transition-colors line-clamp-1">
                      {m.title}
                    </Link>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                      {m.resolution_number && (
                        <span className="text-[12px] font-mono font-bold text-purple-600 dark:text-purple-400">{m.resolution_number}</span>
                      )}
                      {m.date && (
                        <span className="flex items-center gap-1 text-[12px] text-slate-500 dark:text-slate-400">
                          <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />{m.date}
                        </span>
                      )}
                      {m.proposer && (
                        <span className="text-[12px] text-slate-500">Proposer: <b>{m.proposer}</b></span>
                      )}
                      {m.seconder && (
                        <span className="text-[12px] text-slate-500">Seconder: <b>{m.seconder}</b></span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {m.resolution_status && (
                    <span className={`text-[11px] font-bold px-3 py-1.5 rounded-lg border ${statusBadge[m.resolution_status] || statusBadge['Pending']}`}>
                      {m.resolution_status}
                    </span>
                  )}
                  <Link to={`/board-resolutions/${m.id}`} className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-800 transition-colors">
                    View <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                  <button onClick={() => handleDelete(m.id, m.title)} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 transition-all" title="Delete">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
