const STATUS_STYLES = {
  pending: 'bg-mustard',
  approved: 'bg-teal',
  denied: 'bg-coral',
};

export default function ExpenseStatusPill({ status }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-bold uppercase text-white shadow-clayButton ${STATUS_STYLES[status] || 'bg-white'}`}
    >
      {status}
    </span>
  );
}
