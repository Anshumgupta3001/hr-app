import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService.js';
import Avatar from './Avatar.jsx';

export default function AccountMenu({ user }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    await authService.logout();
    navigate('/', { replace: true });
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full shadow-clayButton hover:-translate-y-0.5 active:scale-[0.92] transition-all duration-150"
      >
        <Avatar employeeId={user.id} name={user.name} className="w-10 h-10 rounded-full" />
      </button>
      {open && (
        <div className="absolute right-0 top-12 min-w-[200px] rounded-btn bg-white/90 backdrop-blur-xl shadow-clayCard overflow-hidden z-30">
          <div className="px-4 py-2.5 border-b-2 border-ink/5">
            <p className="font-bold text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/my-profile');
            }}
            className="w-full text-left px-4 py-2.5 font-bold text-sm hover:text-violet hover:bg-clay-input/60"
          >
            My Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate('/change-password');
            }}
            className="w-full text-left px-4 py-2.5 font-bold text-sm hover:text-violet hover:bg-clay-input/60"
          >
            Change Password
          </button>
          {user.role !== 'superadmin' && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/resign');
              }}
              className="w-full text-left px-4 py-2.5 font-bold text-sm hover:text-violet hover:bg-clay-input/60"
            >
              Resign
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left px-4 py-2.5 font-bold text-sm text-coral hover:bg-clay-input/60"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
