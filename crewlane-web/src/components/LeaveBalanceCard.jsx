import OutlinedCard from './OutlinedCard.jsx';

export default function LeaveBalanceCard({ balance }) {
  return (
    <OutlinedCard className="p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="font-bold text-sm">{balance.name}</p>
        <span className="text-xs font-bold text-muted">
          {balance.usedDays} / {balance.annualQuota}
        </span>
      </div>
      <p className="font-display font-black text-3xl mt-2">{balance.remaining}</p>
      <p className="text-xs text-muted font-bold">days remaining</p>
    </OutlinedCard>
  );
}
