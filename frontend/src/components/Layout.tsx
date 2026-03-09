import { Link, useLocation } from 'react-router-dom';
import { useThemeStore } from '../store';
import {
  HomeIcon,
  CalendarDaysIcon,
  BellIcon,
  SunIcon,
  MoonIcon,
} from '@heroicons/react/24/outline';

const navItems = [
  { path: '/',         label: 'Dashboard', icon: HomeIcon },
  { path: '/meetings', label: 'Meetings',  icon: CalendarDaysIcon },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location  = useLocation();
  const { dark, toggle } = useThemeStore();
  const pageLabel = navItems.find((n) => n.path === location.pathname)?.label ?? 'Botivate';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-[#0d1117]">

      {/* ════════════════════ SIDEBAR ════════════════════ */}
      <aside className="hidden md:flex md:flex-col w-[220px] bg-white dark:bg-[#161b27] border-r border-slate-100 dark:border-slate-800">

        {/* Brand — logo only, no duplicate text */}
        <div className="flex items-center gap-3 px-5 py-[18px] border-b border-slate-100 dark:border-slate-800">
          <img src="/botivate-logo.png" alt="Botivate" className="w-9 h-9 object-contain" />
          <div className="leading-tight">
            <p className="text-[14px] font-extrabold text-slate-900 dark:text-white tracking-tight">Botivate</p>
            <p className="text-[10px] font-medium text-[#1d6bf8]">MOM Management</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-600">Menu</p>
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`group flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
                  active
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-[#1d6bf8]'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <span className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${
                  active
                    ? 'bg-[#1d6bf8] text-white shadow-[0_2px_8px_rgba(29,107,248,0.3)]'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white'
                }`}>
                  <Icon className="w-[15px] h-[15px]" />
                </span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Powered by footer */}
        <div className="px-4 pb-5">
          <div className="rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 px-4 py-3 flex items-center gap-2.5">
            <img src="/botivate-logo.png" alt="" className="w-6 h-6 object-contain shrink-0" />
            <div>
              <p className="text-[9px] text-slate-400 font-medium uppercase tracking-wide">Powered by</p>
              <p className="text-[11px] font-bold text-[#1d6bf8] leading-tight">Botivate Services LLP</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ════════════════════ MAIN AREA ════════════════════ */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* ── HEADER — proper, prominent, single Botivate logo ── */}
        <header className="h-[64px] flex items-center justify-between px-6 bg-white dark:bg-[#161b27] border-b border-slate-100 dark:border-slate-800 shadow-sm">

          {/* Left: page breadcrumb */}
          <div>
            <h1 className="text-[16px] font-extrabold text-slate-900 dark:text-white leading-tight">{pageLabel}</h1>
            <p className="text-[11px] text-slate-400 leading-tight -mt-0.5">Botivate MOM Management System</p>
          </div>

          {/* Right: controls + ONE logo area */}
          <div className="flex items-center gap-4">

            {/* Icon buttons */}
            <div className="flex items-center gap-1">
              <button onClick={toggle}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-all">
                {dark ? <SunIcon className="w-[17px] h-[17px]" /> : <MoonIcon className="w-[17px] h-[17px]" />}
              </button>
              <Link to="/notifications"
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-all">
                <BellIcon className="w-[17px] h-[17px]" />
              </Link>
            </div>

            {/* Divider */}
            <div className="w-px h-7 bg-slate-200 dark:bg-slate-700" />

            {/* Company brand — logo + name, no double "Botivate" text */}
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-slate-800 rounded-xl px-3.5 py-2">
              <img src="/botivate-logo.png" alt="Botivate" className="h-9 w-auto object-contain" />
              <div className="leading-tight">
                <p className="text-[13px] font-extrabold text-slate-900 dark:text-white">Botivate Services LLP</p>
                <p className="text-[10px] text-[#1d6bf8] font-semibold">Powering Businesses On Autopilot</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
