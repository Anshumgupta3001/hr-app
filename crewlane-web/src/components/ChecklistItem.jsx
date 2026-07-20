export default function ChecklistItem({ task, onToggle }) {
  return (
    <button
      type="button"
      onClick={() => onToggle(task.id)}
      className="w-full flex items-center gap-3 bg-white/70 backdrop-blur-xl rounded-chip shadow-clayCard px-4 py-3 text-left hover:-translate-y-0.5 transition-all duration-150"
    >
      <span
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          task.isCompleted ? 'bg-teal shadow-clayButton' : 'bg-clay-input shadow-clayPressed'
        }`}
      >
        {task.isCompleted && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12.5l5.5 5.5L20 6.5" />
          </svg>
        )}
      </span>
      <span
        className={`text-sm font-bold ${
          task.isCompleted ? 'text-muted line-through' : 'text-ink'
        }`}
      >
        {task.title}
      </span>
      {task.isCompleted && task.completedAt && (
        <span className="ml-auto text-xs text-muted shrink-0">
          {new Date(task.completedAt).toLocaleDateString()}
        </span>
      )}
    </button>
  );
}
