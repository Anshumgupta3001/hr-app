import OutlinedCard from './OutlinedCard.jsx';

function Stat({ label, value }) {
  return (
    <OutlinedCard className="p-4 text-center">
      <p className="font-display font-extrabold text-2xl">{value}</p>
      <p className="text-xs text-muted font-bold uppercase tracking-wide mt-1">{label}</p>
    </OutlinedCard>
  );
}

export default function MonthlySummaryCard({ summary }) {
  if (!summary) return null;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <Stat label="Working Days" value={summary.workingDays} />
      <Stat label="Present" value={summary.presentDays} />
      <Stat label="Early Leave" value={summary.earlyLeaveDays} />
      <Stat label="Incomplete" value={summary.incompleteDays} />
      <Stat label="Absent" value={summary.absentDays} />
      <Stat label="Hours Worked" value={summary.totalHoursWorked} />
      <Stat label="Leave Days" value={summary.leaveDays} />
      <Stat label="Attendance %" value={`${summary.attendancePercentage}%`} />
    </div>
  );
}
