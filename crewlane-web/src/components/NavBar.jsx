import { Link } from 'react-router-dom';
import AccountMenu from './AccountMenu.jsx';
import NotificationBell from './NotificationBell.jsx';
import UpcomingEventsWidget from './UpcomingEventsWidget.jsx';
import { APP_NAME } from '../theme.js';

export default function NavBar({ user, company = null, companyId = null, onMenuClick = null }) {
  const isSuper = user.role === 'superadmin';
  const showBell = !isSuper;
  const showEvents = Boolean(companyId);
  const home = isSuper ? '/super-admin' : `/dashboard/${companyId}`;

  return (
    <nav className="relative z-20 bg-white/70 backdrop-blur-xl shadow-clayCard px-4 sm:px-8 py-3 flex items-center gap-3 flex-wrap">
      {onMenuClick && (
        <button
          type="button"
          aria-label="Open menu"
          onClick={onMenuClick}
          className="md:hidden w-10 h-10 rounded-full bg-white shadow-clayButton flex items-center justify-center shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#332F3A"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      )}
      <Link to={home} className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-icon bg-gradient-to-br from-[#A78BFA] to-violet shadow-clayButton flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="0" y="0" width="6" height="6" rx="1" fill="#ffffff" />
            <rect x="8" y="0" width="6" height="6" rx="1" fill="#ffffff" />
            <rect x="0" y="8" width="6" height="6" rx="1" fill="#ffffff" />
            <rect x="8" y="8" width="6" height="6" rx="1" fill="#ffffff" />
          </svg>
        </div>
        <span className="font-display font-black text-xl tracking-tight">{APP_NAME}</span>
      </Link>

      <div className="ml-auto flex items-center gap-4">
        {company && (
          <span className="rounded-full bg-violet text-white px-4 py-1 text-sm font-bold shadow-clayButton hidden sm:inline-block">
            {company.name}
          </span>
        )}
        {showEvents && <UpcomingEventsWidget companyId={companyId} user={user} />}
        {showBell && <NotificationBell user={user} companyId={companyId} />}
        <AccountMenu user={user} />
      </div>
    </nav>
  );
}
