const STATUS_STYLES = {
  present: 'bg-teal',
  early_leave: 'bg-mustard',
  incomplete: 'bg-sky',
  absent: 'bg-coral',
};

const STATUS_LABELS = {
  present: 'present',
  early_leave: 'early leave',
  incomplete: 'incomplete',
  absent: 'absent',
};

export default function AttendanceStatusPill({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-clayButton ${STATUS_STYLES[status] || 'bg-white'}`}
    >
      {STATUS_LABELS[status] || status}
    </span>
  );
}
