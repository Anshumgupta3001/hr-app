import OutlinedCard from './OutlinedCard.jsx';

export default function CurrentlyInWidget({ records = [], employees = [] }) {
  function employeeName(employeeId) {
    const emp = employees.find((e) => e.id === employeeId);
    return emp ? emp.name : 'Former employee';
  }

  return (
    <OutlinedCard className="p-6">
      <h2 className="font-display font-bold text-lg mb-4">Who's In Right Now</h2>
      {records.length === 0 ? (
        <p className="text-muted font-bold text-sm">No one is currently clocked in.</p>
      ) : (
        <div className="space-y-2">
          {records.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 bg-clay-input rounded-btn px-4 py-2.5"
            >
              <span className="font-bold text-sm">{employeeName(r.employeeId)}</span>
              <span className="text-xs text-muted font-bold">
                {new Date(r.clockInTime).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </OutlinedCard>
  );
}
