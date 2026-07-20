import OutlinedCard from './OutlinedCard.jsx';

const INPUT_CLASS =
  'w-full rounded-btn bg-clay-input shadow-clayPressed px-4 py-2.5 font-body text-ink placeholder:text-muted focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
];

const STATUS_STYLES = {
  not_started: 'bg-clay-input text-muted',
  in_progress: 'bg-sky text-white',
  completed: 'bg-teal text-white',
};

export default function GoalRow({ goal, editable = false, onUpdate }) {
  const statusLabel =
    STATUS_OPTIONS.find((o) => o.value === goal.status)?.label || goal.status;

  return (
    <OutlinedCard className="p-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          {editable ? (
            <input
              type="text"
              defaultValue={goal.title}
              onBlur={(e) => onUpdate(goal.id, { title: e.target.value })}
              className={`${INPUT_CLASS} font-bold`}
            />
          ) : (
            <p className="font-display font-bold text-base">{goal.title}</p>
          )}
        </div>
        {editable ? (
          <select
            value={goal.status}
            onChange={(e) => onUpdate(goal.id, { status: e.target.value })}
            className="rounded-btn bg-clay-input shadow-clayPressed px-3 py-2 font-body font-bold text-sm text-ink focus:outline-none focus:bg-white focus:ring-4 focus:ring-violet/20"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[goal.status]}`}
          >
            {statusLabel}
          </span>
        )}
      </div>
      {editable ? (
        <textarea
          rows={2}
          defaultValue={goal.description}
          onBlur={(e) => onUpdate(goal.id, { description: e.target.value })}
          placeholder="Goal description"
          className={`${INPUT_CLASS} resize-none mt-3 text-sm`}
        />
      ) : (
        goal.description && <p className="text-sm text-muted mt-2">{goal.description}</p>
      )}
    </OutlinedCard>
  );
}
