import { useCallback, useEffect, useRef, useState } from 'react';
import { employeeService } from '../services/employeeService.js';
import { holidayService } from '../services/holidayService.js';

const WINDOW_DAYS = 15;

function ordinal(n) {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(target, today) {
  return Math.round((startOfDay(target) - startOfDay(today)) / 86400000);
}

function nextOccurrence(isoDateString, today) {
  const source = new Date(`${isoDateString}T00:00:00`);
  let candidate = new Date(today.getFullYear(), source.getMonth(), source.getDate());
  if (daysBetween(candidate, today) < 0) {
    candidate = new Date(today.getFullYear() + 1, source.getMonth(), source.getDate());
  }
  return candidate;
}

export function computeUpcomingEvents(
  holidays,
  employees,
  today = new Date(),
  { includeProbation = false } = {}
) {
  const events = [];

  for (const holiday of holidays) {
    const target = new Date(`${holiday.date}T00:00:00`);
    const daysUntil = daysBetween(target, today);
    if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
      events.push({
        id: `holiday-${holiday.id}`,
        type: 'holiday',
        label: 'Holiday',
        name: holiday.name,
        date: target,
        daysUntil,
      });
    }
  }

  for (const employee of employees) {
    if (employee.dateOfBirth) {
      const occurrence = nextOccurrence(employee.dateOfBirth, today);
      const daysUntil = daysBetween(occurrence, today);
      if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
        events.push({
          id: `birthday-${employee.id}`,
          type: 'birthday',
          label: 'Birthday',
          name: employee.name,
          date: occurrence,
          daysUntil,
        });
      }
    }
    if (employee.dateOfJoining) {
      const occurrence = nextOccurrence(employee.dateOfJoining, today);
      const daysUntil = daysBetween(occurrence, today);
      if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
        const joiningYear = new Date(`${employee.dateOfJoining}T00:00:00`).getFullYear();
        const anniversaryNumber = occurrence.getFullYear() - joiningYear;
        if (anniversaryNumber > 0) {
          events.push({
            id: `anniversary-${employee.id}`,
            type: 'anniversary',
            label: `${ordinal(anniversaryNumber)} work anniversary`,
            name: employee.name,
            date: occurrence,
            daysUntil,
          });
        }
      }
    }
    if (includeProbation && employee.probationEndDate) {
      const target = new Date(`${employee.probationEndDate}T00:00:00`);
      const daysUntil = daysBetween(target, today);
      if (daysUntil >= 0 && daysUntil <= WINDOW_DAYS) {
        events.push({
          id: `probation-${employee.id}`,
          type: 'probation',
          label: 'Probation Ending',
          name: employee.name,
          date: target,
          daysUntil,
        });
      }
    }
  }

  return events.sort((a, b) => a.daysUntil - b.daysUntil);
}

function formatDaysUntil(daysUntil) {
  return daysUntil === 0 ? 'Today' : `in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`;
}

const TYPE_STYLES = {
  holiday: 'bg-mustard text-white',
  birthday: 'bg-coral text-white',
  anniversary: 'bg-violet text-white',
  probation: 'bg-sky text-white',
};

export default function UpcomingEventsWidget({ companyId, user = null }) {
  const [open, setOpen] = useState(false);
  const [events, setEvents] = useState([]);
  const wrapRef = useRef(null);

  const includeProbation = Boolean(user && ['admin', 'hr'].includes(user.role));

  const load = useCallback(async () => {
    if (!companyId) return;
    const [holidays, employees] = await Promise.all([
      holidayService.getHolidaysByCompany(companyId),
      employeeService.getEmployeesByCompany(companyId),
    ]);
    setEvents(computeUpcomingEvents(holidays, employees, new Date(), { includeProbation }));
  }, [companyId, includeProbation]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!companyId) return null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        aria-label="Upcoming events"
        onClick={() => {
          setOpen((v) => !v);
          load();
        }}
        className="relative w-10 h-10 rounded-full bg-white shadow-clayButton flex items-center justify-center hover:-translate-y-0.5 active:scale-[0.92] transition-all duration-150"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#332F3A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="5" width="18" height="16" rx="2.5" />
          <path d="M3 9.5h18" />
          <path d="M8 2.5v4M16 2.5v4" />
          <path d="M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
        </svg>
        {events.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 rounded-full bg-coral text-white text-[10px] font-bold flex items-center justify-center shadow-clayButton">
            {events.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-[320px] rounded-btn bg-white/90 backdrop-blur-xl shadow-clayCard overflow-hidden z-30">
          <p className="px-4 py-2.5 border-b-2 border-ink/5 font-display font-extrabold text-sm">
            Upcoming (next 15 days)
          </p>
          <div className="max-h-[360px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted font-bold text-center">
                Nothing coming up.
              </p>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="px-4 py-3 border-b-2 border-ink/5 last:border-b-0"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${TYPE_STYLES[event.type]}`}
                    >
                      {event.label}
                    </span>
                    <span className="text-xs font-bold text-muted">
                      {formatDaysUntil(event.daysUntil)}
                    </span>
                  </div>
                  <p className="text-sm font-bold text-ink mt-1.5">{event.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {event.date.toLocaleDateString(undefined, {
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
