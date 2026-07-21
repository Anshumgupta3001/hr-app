import { useEffect, useState } from 'react';
import ConfettiBackground from './ConfettiBackground.jsx';
import NavBar from './NavBar.jsx';
import Sidebar from './Sidebar.jsx';
import { employeeService } from '../services/employeeService.js';

function buildCompanyItems(role, companyId, isManager) {
  const items = [
    { key: 'Dashboard', label: 'Dashboard', to: `/dashboard/${companyId}` },
    { key: 'MyDepartment', label: 'My Department', to: `/my-department/${companyId}` },
    { key: 'PraiseWall', label: 'Praise Wall', to: `/praise/${companyId}` },
    { key: 'CompanyFeed', label: 'Company Feed', to: `/feed/${companyId}` },
    { key: 'OrgChart', label: 'Org Chart', to: `/org-chart/${companyId}` },
  ];

  if (['admin', 'hr'].includes(role)) {
    items.push({ key: 'Employees', label: 'Employees', to: `/employees/${companyId}` });
    items.push({
      key: 'LeaveRequests',
      label: 'Leave Requests',
      to: `/leave-requests/${companyId}`,
    });
    items.push({
      key: 'ExpenseClaims',
      label: 'Expense Claims',
      to: `/expense-claims/${companyId}`,
    });
  }
  if (role === 'admin') {
    items.push({ key: 'LeavePolicy', label: 'Leave Policy', to: `/leave-policy/${companyId}` });
  }
  if (['hr', 'manager', 'employee'].includes(role)) {
    items.push({ key: 'MyLeave', label: 'My Leave', to: `/leave/${companyId}` });
    items.push({ key: 'MyExpenses', label: 'My Expenses', to: `/expenses/${companyId}` });
  }

  items.push({ key: 'Performance', label: 'Performance', to: `/performance/${companyId}` });
  if (isManager) {
    items.push({ key: 'TeamReviews', label: 'Team Reviews', to: `/team-reviews/${companyId}` });
  }
  if (role === 'admin') {
    items.push({ key: 'ReviewCycles', label: 'Review Cycles', to: `/review-cycles/${companyId}` });
    items.push({ key: 'Holidays', label: 'Holidays', to: `/holidays/${companyId}` });
  }

  if (['admin', 'hr'].includes(role)) {
    items.push({ key: 'Assets', label: 'Assets', to: `/assets/${companyId}` });
  } else {
    items.push({ key: 'MyAssets', label: 'My Assets', to: `/my-assets/${companyId}` });
  }

  if (role === 'admin') {
    items.push({ key: 'Resignations', label: 'Resignations', to: `/resignations/${companyId}` });
    items.push({ key: 'CompanySettings', label: 'Company Settings', to: `/settings/${companyId}` });
  }

  items.push({ key: 'Attendance', label: 'Attendance', to: `/attendance/${companyId}` });
  if (['admin', 'hr'].includes(role)) {
    items.push({
      key: 'TeamAttendance',
      label: 'Team Attendance',
      to: `/team-attendance/${companyId}`,
    });
    items.push({
      key: 'RegularizationRequests',
      label: 'Regularization Requests',
      to: `/regularization-requests/${companyId}`,
    });
  }
  if (role === 'admin') {
    items.push({
      key: 'AttendanceSettings',
      label: 'Attendance Settings',
      to: `/attendance-settings/${companyId}`,
    });
  }

  items.push(
    { key: 'Payroll', label: 'Payroll', disabled: true },
    {
      key: 'Documents',
      label: 'Documents',
      to: ['admin', 'hr'].includes(role)
        ? `/documents/${companyId}`
        : `/my-documents/${companyId}`,
    }
  );

  return items;
}

export default function CompanyAppShell({ user, company = null, companyId, calm = false, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    let active = true;
    employeeService.getEmployeesByCompany(companyId).then((employees) => {
      if (active) {
        setIsManager(employees.some((e) => e.managerId === user.id));
      }
    });
    return () => {
      active = false;
    };
  }, [companyId, user.id]);

  const items = buildCompanyItems(user.role, companyId, isManager);

  return (
    <div className="relative min-h-screen">
      <ConfettiBackground calm={calm} />
      <div className="relative z-10 flex flex-col min-h-screen">
        <NavBar
          user={user}
          company={company}
          companyId={companyId}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="flex-1 flex flex-col md:flex-row gap-6 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6">
          <Sidebar items={items} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
          <main className="flex-1 min-w-0 py-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
