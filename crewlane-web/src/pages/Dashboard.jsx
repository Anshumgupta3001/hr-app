import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import OutlinedCard from '../components/OutlinedCard.jsx';
import MarkerHighlight from '../components/MarkerHighlight.jsx';
import ComingSoonCard from '../components/ComingSoonCard.jsx';
import CompanyAppShell from '../components/CompanyAppShell.jsx';
import { authService } from '../services/authService.js';
import { companyService } from '../services/companyService.js';
import { employeeService } from '../services/employeeService.js';
import { leaveRequestService } from '../services/leaveRequestService.js';
import { leaveBalanceService } from '../services/leaveBalanceService.js';
import { announcementService } from '../services/announcementService.js';

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: '#FFFFFF',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const EmployeesIcon = (
  <svg {...ICON_PROPS}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 20c0-3.4 2.7-5 6-5s6 1.6 6 5" />
    <circle cx="17" cy="9" r="2.4" />
    <path d="M16.5 15.2c2.6.3 4.5 1.8 4.5 4.3" />
  </svg>
);

const AttendanceIcon = (
  <svg {...ICON_PROPS}>
    <rect x="3" y="5" width="18" height="16" rx="2.5" />
    <path d="M3 9.5h18" />
    <path d="M8 2.5v4M16 2.5v4" />
    <path d="M8.5 14.5l2.4 2.4 4.6-4.6" />
  </svg>
);

const LeaveIcon = (
  <svg {...ICON_PROPS}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8" />
  </svg>
);

const PayrollIcon = (
  <svg {...ICON_PROPS}>
    <rect x="2.5" y="6" width="19" height="12" rx="2.5" />
    <circle cx="12" cy="12" r="2.6" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
);

const DocumentsIcon = (
  <svg {...ICON_PROPS}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <circle cx="8" cy="10.5" r="2" />
    <path d="M5 16c.6-1.7 1.7-2.4 3-2.4s2.4.7 3 2.4" />
    <path d="M14 9.5h5M14 13h5" />
  </svg>
);

const PerformanceIcon = (
  <svg {...ICON_PROPS}>
    <path d="M4 21V11" />
    <path d="M10 21V4" />
    <path d="M16 21v-8" />
    <path d="M22 21H2" />
  </svg>
);

const DepartmentIcon = (
  <svg {...ICON_PROPS}>
    <rect x="3" y="10" width="7" height="11" rx="1.5" />
    <rect x="14" y="6" width="7" height="15" rx="1.5" />
    <path d="M6.5 14h.01M6.5 17h.01M17.5 10h.01M17.5 13h.01M17.5 16h.01" />
  </svg>
);

const COMING_SOON_MODULES = [
  {
    title: 'Attendance',
    description: 'Clock-ins, timesheets, and schedules.',
    accent: 'teal',
    icon: AttendanceIcon,
  },
  {
    title: 'Payroll',
    description: 'Salaries, payslips, and tax runs.',
    accent: 'mustard',
    icon: PayrollIcon,
  },
  {
    title: 'Documents',
    description: 'Secure document storage for your team.',
    accent: 'sky',
    icon: DocumentsIcon,
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { companyId } = useParams();
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [leaveSummary, setLeaveSummary] = useState('');
  const [leaveTarget, setLeaveTarget] = useState('');
  const [deptLabel, setDeptLabel] = useState('Unassigned');
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);

  useEffect(() => {
    async function load() {
      const current = await authService.getCurrentUser();
      if (!current) {
        navigate('/', { replace: true });
        return;
      }
      if (current.role === 'superadmin') {
        navigate('/super-admin', { replace: true });
        return;
      }
      if (current.companyId !== companyId) {
        navigate(`/dashboard/${current.companyId}`, { replace: true });
        return;
      }
      const found = await companyService.getCompanyById(companyId);
      if (!found) {
        navigate('/', { replace: true });
        return;
      }
      const companyEmployees = await employeeService.getEmployeesByCompany(companyId);
      if (current.role === 'admin') {
        const requests = await leaveRequestService.getRequestsByCompany(companyId);
        const pending = requests.filter((r) => r.status === 'pending').length;
        setLeaveSummary(
          `${pending} request${pending === 1 ? '' : 's'} awaiting approval`
        );
        setLeaveTarget(`/leave-requests/${companyId}`);
      } else {
        const balances = await leaveBalanceService.getBalances(current.id, companyId);
        const remaining = balances.reduce((sum, b) => sum + b.remaining, 0);
        setLeaveSummary(`${remaining} day${remaining === 1 ? '' : 's'} remaining`);
        setLeaveTarget(`/leave/${companyId}`);
      }
      if (current.departmentId) {
        const dept = found.departments.find((d) => d.id === current.departmentId);
        const count = companyEmployees.filter(
          (e) => e.departmentId === current.departmentId
        ).length;
        setDeptLabel(`${dept ? dept.name : 'Unassigned'} — ${count} people`);
      } else {
        setDeptLabel('Unassigned');
      }
      setLatestAnnouncement(await announcementService.getLatest(companyId));
      setUser(current);
      setCompany(found);
      setEmployeeCount(companyEmployees.length);
    }
    load();
  }, [navigate, companyId]);

  if (!user || !company) return null;

  const firstName = user.name.split(' ')[0];

  return (
    <CompanyAppShell user={user} company={company} companyId={companyId}>
      <h1 className="font-display font-extrabold text-3xl sm:text-4xl">
        Welcome back, <MarkerHighlight>{firstName}</MarkerHighlight>
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <OutlinedCard className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Company</p>
          <p className="font-display font-extrabold text-2xl mt-1">{company.name}</p>
        </OutlinedCard>
        <OutlinedCard className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">Industry</p>
          <p className="font-display font-extrabold text-2xl mt-1">
            {company.industry || '—'}
          </p>
        </OutlinedCard>
        <OutlinedCard className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            Departments
          </p>
          <p className="font-display font-extrabold text-2xl mt-1">
            {company.departments.length}
          </p>
        </OutlinedCard>
        <OutlinedCard className="p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-muted">
            Employees
          </p>
          <p className="font-display font-extrabold text-2xl mt-1">{employeeCount}</p>
        </OutlinedCard>
      </div>

      <Link
        to={`/feed/${companyId}`}
        className="block rounded-card bg-white/70 backdrop-blur-xl shadow-clayCard p-6 mt-8 hover:-translate-y-1 hover:shadow-clayCardHover transition-all duration-100"
      >
        <p className="text-xs font-bold uppercase tracking-widest text-muted">
          Latest Announcement
        </p>
        {latestAnnouncement ? (
          <>
            <p className="font-display font-extrabold text-lg mt-1">
              {latestAnnouncement.title}
            </p>
            <p className="text-sm text-muted mt-1 line-clamp-2">
              {latestAnnouncement.message}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted mt-1">No announcements yet.</p>
        )}
      </Link>

      <h2 className="font-display font-bold text-xl mt-12 mb-6">Modules</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
        <Link
          to={`/employees/${companyId}`}
          className="block rounded-card bg-white/70 backdrop-blur-xl shadow-clayCard p-6 hover:-translate-y-2 hover:shadow-clayCardHover transition-all duration-100"
        >
          <div className="w-11 h-11 rounded-icon flex items-center justify-center bg-coral shadow-clayButton">
            {EmployeesIcon}
          </div>
          <h3 className="font-display font-bold text-lg mt-4">Employees</h3>
          <p className="text-sm mt-1 text-muted">
            Directory, profiles, and org structure.
          </p>
        </Link>
        <Link
          to={leaveTarget}
          className="block rounded-card bg-white/70 backdrop-blur-xl shadow-clayCard p-6 hover:-translate-y-2 hover:shadow-clayCardHover transition-all duration-100"
        >
          <div className="w-11 h-11 rounded-icon flex items-center justify-center bg-violet shadow-clayButton">
            {LeaveIcon}
          </div>
          <h3 className="font-display font-bold text-lg mt-4">Leave</h3>
          <p className="text-sm mt-1 text-muted">{leaveSummary}</p>
        </Link>
        <Link
          to={`/my-department/${companyId}`}
          className="block rounded-card bg-white/70 backdrop-blur-xl shadow-clayCard p-6 hover:-translate-y-2 hover:shadow-clayCardHover transition-all duration-100"
        >
          <div className="w-11 h-11 rounded-icon flex items-center justify-center bg-sky shadow-clayButton">
            {DepartmentIcon}
          </div>
          <h3 className="font-display font-bold text-lg mt-4">My Department</h3>
          <p className="text-sm mt-1 text-muted">{deptLabel}</p>
        </Link>
        {COMING_SOON_MODULES.map((mod) => (
          <ComingSoonCard
            key={mod.title}
            title={mod.title}
            description={mod.description}
            accent={mod.accent}
            icon={mod.icon}
          />
        ))}
      </div>
    </CompanyAppShell>
  );
}
