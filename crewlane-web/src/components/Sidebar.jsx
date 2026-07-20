import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const STORAGE_KEY = 'pg_sidebar_collapsed_groups';

const GROUPS = [
  { label: 'People', keys: ['MyDepartment', 'OrgChart', 'Employees'] },
  {
    label: 'Time & Leave',
    keys: ['MyLeave', 'LeaveRequests', 'LeavePolicy', 'Holidays', 'Attendance'],
  },
  {
    label: 'Finance & Assets',
    keys: ['MyExpenses', 'ExpenseClaims', 'Assets', 'MyAssets', 'Payroll'],
  },
  { label: 'Growth', keys: ['Performance', 'TeamReviews', 'ReviewCycles'] },
  {
    label: 'Company',
    keys: ['CompanyFeed', 'PraiseWall', 'CompanySettings', 'Resignations', 'Documents'],
  },
];

const GROUPED_KEYS = new Set(GROUPS.flatMap((g) => g.keys));

const DEFAULT_COLLAPSED = ['Finance & Assets', 'Growth', 'Company'];

function readCollapsed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_COLLAPSED;
  } catch {
    return DEFAULT_COLLAPSED;
  }
}

function SidebarItem({ item, active, onNavigate }) {
  if (item.disabled) {
    return (
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 rounded-btn text-muted font-bold text-sm cursor-not-allowed select-none">
        <span>{item.label}</span>
        <span className="rounded-full bg-clay-input text-muted text-[10px] font-bold px-2.5 py-1">
          Soon
        </span>
      </div>
    );
  }

  return (
    <Link
      to={item.to}
      onClick={onNavigate}
      className={`px-4 py-2.5 rounded-btn font-bold text-sm transition-all duration-150 ${
        active
          ? 'bg-gradient-to-br from-[#A78BFA] to-violet text-white shadow-clayButton'
          : 'text-ink hover:-translate-y-0.5 hover:bg-violet/5'
      }`}
    >
      {item.label}
    </Link>
  );
}

function GroupHeader({ label, collapsed, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 pt-4 pb-1.5 text-left"
    >
      <span className="text-[11px] font-bold uppercase tracking-widest text-muted">
        {label}
      </span>
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#635F69"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`transition-transform duration-150 ${collapsed ? '-rotate-90' : ''}`}
      >
        <path d="M6 9l6 6 6-6" />
      </svg>
    </button>
  );
}

export default function Sidebar({ items, mobileOpen = false, onClose }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(readCollapsed);

  function toggleGroup(label) {
    setCollapsed((prev) => {
      const next = prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage unavailable — keep in-memory state only
      }
      return next;
    });
  }

  const byKey = Object.fromEntries(items.map((item) => [item.key, item]));
  const ungrouped = items.filter(
    (item) => item.key !== 'Dashboard' && !GROUPED_KEYS.has(item.key)
  );

  function renderItem(item) {
    return (
      <SidebarItem
        key={item.key}
        item={item}
        active={!item.disabled && location.pathname === item.to}
        onNavigate={onClose}
      />
    );
  }

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-ink/30 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed md:sticky top-0 md:top-6 left-0 h-screen md:h-[calc(100vh-3rem)] w-72 md:w-64 shrink-0 bg-white/70 backdrop-blur-xl shadow-clayCard rounded-r-card md:rounded-card p-4 z-40 transition-transform duration-200 ease-out overflow-y-auto ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0`}
      >
        <nav className="flex flex-col gap-1.5">
          {byKey.Dashboard && renderItem(byKey.Dashboard)}
          {ungrouped.map(renderItem)}
          {GROUPS.map((group) => {
            const groupItems = group.keys
              .map((key) => byKey[key])
              .filter(Boolean);
            if (groupItems.length === 0) return null;
            const isCollapsed = collapsed.includes(group.label);
            return (
              <div key={group.label} className="flex flex-col gap-1.5">
                <GroupHeader
                  label={group.label}
                  collapsed={isCollapsed}
                  onToggle={() => toggleGroup(group.label)}
                />
                {!isCollapsed && groupItems.map(renderItem)}
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
