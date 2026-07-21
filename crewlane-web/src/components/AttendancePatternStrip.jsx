const DOT_COLORS = {
  present: 'bg-teal',
  early_leave: 'bg-mustard',
  incomplete: 'bg-sky',
  absent: 'bg-coral',
  upcoming: 'bg-clay-input',
};

const LEGEND = [
  { status: 'present', label: 'Present' },
  { status: 'early_leave', label: 'Early leave' },
  { status: 'incomplete', label: 'Incomplete' },
  { status: 'absent', label: 'Absent' },
];

export default function AttendancePatternStrip({ pattern = [] }) {
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {pattern.map((day) => (
          <div
            key={day.date}
            title={`${day.date} · ${day.status}`}
            className={`w-4 h-4 rounded-[4px] ${DOT_COLORS[day.status] || 'bg-clay-input'}`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {LEGEND.map((item) => (
          <div key={item.status} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-[3px] ${DOT_COLORS[item.status]}`} />
            <span className="text-xs text-muted font-bold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
