import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NotificationPanel from './NotificationPanel.jsx';
import { notificationService } from '../services/notificationService.js';

export default function NotificationBell({ user, companyId = null }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const wrapRef = useRef(null);

  const isAdminView =
    user.role === 'admin' || (user.role === 'superadmin' && companyId);

  const load = useCallback(async () => {
    if (isAdminView) {
      const targetCompanyId = user.role === 'admin' ? user.companyId : companyId;
      setNotifications(await notificationService.getAdminNotifications(targetCompanyId));
    } else {
      setNotifications(await notificationService.getEmployeeNotifications(user.id));
    }
  }, [isAdminView, user, companyId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function handleSelect(notification) {
    await notificationService.markRead(notification.id);
    setOpen(false);
    await load();
    const routes = {
      praise_received: `/praise/${notification.companyId}`,
      announcement_posted: `/feed/${notification.companyId}`,
      expense_submitted: `/expense-claims/${notification.companyId}`,
      expense_decided: `/expenses/${notification.companyId}`,
      resignation_submitted: `/resignations/${notification.companyId}`,
      resignation_acknowledged: `/dashboard/${notification.companyId}`,
    };
    if (routes[notification.type]) {
      navigate(routes[notification.type]);
    } else if (notification.audience === 'admin') {
      navigate(`/leave-requests/${notification.companyId}`);
    } else {
      navigate(`/leave/${notification.companyId}`);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => {
          setOpen((v) => !v);
          load();
        }}
        className="relative w-10 h-10 rounded-full bg-white shadow-clayButton flex items-center justify-center hover:-translate-y-0.5 active:scale-[0.92] transition-all duration-150"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#332F3A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 3c-3.1 0-5.2 2.3-5.2 5.2v3.1L5 14.6h14l-1.8-3.3V8.2C17.2 5.3 15.1 3 12 3Z" />
          <path d="M10.3 17.5a1.8 1.8 0 0 0 3.4 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center shadow-clayButton">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[320px] rounded-btn bg-white/90 backdrop-blur-xl shadow-clayCard overflow-hidden z-30">
          <p className="px-4 py-2.5 border-b-2 border-ink/5 font-display font-extrabold text-sm">
            Notifications
          </p>
          <NotificationPanel notifications={notifications} onSelect={handleSelect} />
        </div>
      )}
    </div>
  );
}
