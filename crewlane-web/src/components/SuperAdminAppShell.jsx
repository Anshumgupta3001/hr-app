import { useState } from 'react';
import ConfettiBackground from './ConfettiBackground.jsx';
import NavBar from './NavBar.jsx';
import Sidebar from './Sidebar.jsx';

const ITEMS = [
  { key: 'Companies', label: 'Companies', to: '/super-admin' },
  { key: 'DefaultLeavePolicy', label: 'Default Leave Policy', to: '/super-admin/leave-policy' },
];

export default function SuperAdminAppShell({ user, calm = false, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="relative min-h-screen">
      <ConfettiBackground calm={calm} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <NavBar user={user} onMenuClick={() => setMobileOpen(true)} />
        <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          <Sidebar items={ITEMS} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <main className="flex-1 min-w-0 py-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
