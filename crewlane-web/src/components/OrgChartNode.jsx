import Avatar from './Avatar.jsx';

const ROLE_STYLES = {
  admin: 'bg-violet text-white',
  hr: 'bg-sky text-white',
  manager: 'bg-coral text-white',
  employee: 'bg-teal text-white',
};

const AVATAR_ACCENTS = [
  'bg-gradient-to-br from-blue-400 to-blue-600',
  'bg-gradient-to-br from-purple-400 to-purple-600',
  'bg-gradient-to-br from-pink-400 to-pink-600',
  'bg-gradient-to-br from-emerald-400 to-emerald-600',
];

export default function OrgChartNode({ employee, childrenByManager, depth = 0 }) {
  const reports = childrenByManager[employee.id] || [];

  return (
    <div className={depth > 0 ? 'ml-5 pl-4 border-l-2 border-ink/10' : ''}>
      <div className="flex items-center gap-3 bg-white/70 backdrop-blur-xl rounded-chip shadow-clayCard px-4 py-3 mb-3">
        <Avatar
          employeeId={employee.id}
          name={employee.name}
          className="w-9 h-9 rounded-full shadow-clayButton"
          accentClassName={AVATAR_ACCENTS[depth % AVATAR_ACCENTS.length]}
          textClassName="text-sm"
        />
        <div className="min-w-0">
          <p className="font-display font-bold text-sm leading-tight truncate">
            {employee.name}
          </p>
          <p className="text-xs text-muted truncate">{employee.designation || '—'}</p>
        </div>
        <span
          className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase shrink-0 ${ROLE_STYLES[employee.role] || 'bg-white'}`}
        >
          {employee.role}
        </span>
      </div>
      {reports.map((report) => (
        <OrgChartNode
          key={report.id}
          employee={report}
          childrenByManager={childrenByManager}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
