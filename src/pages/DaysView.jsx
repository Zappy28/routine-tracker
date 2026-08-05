import { useMemo, useState } from "react";
import DayEditor from "../components/DayEditor";

// Config-driven so adding a filter later is additive, not a rewrite.
const FILTERS = [
  { key: "all", label: "All", legend: "meds + workout + mood combined" },
  { key: "medication", label: "Medication", legend: "medication adherence only" },
  { key: "workout", label: "Workout", legend: "workout days only" },
  { key: "mood", label: "Mood", legend: "mood, color-coded" }
];

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

function pad(n) {
  return String(n).padStart(2, "0");
}

function keyFor(year, month, day) {
  return `${year}-${pad(month + 1)}-${pad(day)}`;
}

function medsFullyTaken(day, medications) {
  if (!day || medications.length === 0) return null;
  return medications.every(m => day.takenToday?.[m.id]);
}

function cellColors(day, filter, medications) {
  if (!day) return {};

  if (filter === "medication") {
    const full = medsFullyTaken(day, medications);
    return full
      ? { background: "var(--accent-dim)", borderColor: "var(--accent-line)" }
      : {};
  }

  if (filter === "workout") {
    return day.workout
      ? { background: "var(--accent-dim)", borderColor: "var(--accent-line)" }
      : {};
  }

  if (filter === "mood") {
    if (!day.mood) return {};
    if (day.mood >= 4) return { background: "var(--accent-dim)", borderColor: "var(--accent-line)" };
    if (day.mood === 3) return { background: "var(--warn-dim)", borderColor: "var(--warn-line)" };
    return { background: "var(--danger-dim)", borderColor: "var(--danger-line)" };
  }

  // all: composite adherence score
  const full = medsFullyTaken(day, medications);
  const score = (full ? 1 : 0) + (day.workout ? 1 : 0) + (day.mood >= 4 ? 1 : 0);
  if (score >= 3) return { background: "var(--accent-dim)", borderColor: "var(--accent-line)" };
  if (score >= 1) return { background: "rgba(79, 174, 130, 0.07)" };
  return {};
}

function DaysView({ days, medications, onDayUpdate }) {
  const byKey = useMemo(() => {
    const map = {};
    days.forEach(d => { map[d.id] = d; });
    return map;
  }, [days]);

  const latestKey = days[0]?.id;
  const initialDate = latestKey ? new Date(`${latestKey}T00:00:00`) : new Date();

  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [filter, setFilter] = useState("all");
  const [selectedKey, setSelectedKey] = useState(latestKey || null);
  const [editing, setEditing] = useState(false);

  // Leaving the editor open when jumping to a different day would edit the
  // wrong entry — close it whenever a new day is selected.
  function selectDay(key) {
    setSelectedKey(key);
    setEditing(false);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const leadBlanks = firstOfMonth.getDay();

  const cells = [];
  for (let i = 0; i < leadBlanks; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function goMonth(delta) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) { m = 11; y -= 1; }
    if (m > 11) { m = 0; y += 1; }
    setViewMonth(m);
    setViewYear(y);
  }

  const monthLabel = firstOfMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const activeFilter = FILTERS.find(f => f.key === filter);

  const selectedDay = selectedKey ? byKey[selectedKey] : null;
  const selectedDateLabel = selectedKey
    ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const selectedWeekday = selectedKey
    ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" })
    : null;

  return (
    <div>
      <div className="chip-row">
        {FILTERS.map(f => (
          <span
            key={f.key}
            className={filter === f.key ? "chip active" : "chip"}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </span>
        ))}
      </div>

      <div className="month-nav">
        <div className="month-nav-controls">
          <button className="month-nav-btn" onClick={() => goMonth(-1)} aria-label="Previous month">‹</button>
          <span className="month-nav-label">{monthLabel}</span>
          <button className="month-nav-btn" onClick={() => goMonth(1)} aria-label="Next month">›</button>
        </div>
        <span className="legend-hint">{activeFilter.legend}</span>
      </div>

      <div className="cal-grid">
        {DOW.map((d, i) => <div className="cal-dow" key={i}>{d}</div>)}
        {cells.map((d, i) => {
          if (d === null) return <div className="cal-cell empty" key={`e${i}`} />;
          const key = keyFor(viewYear, viewMonth, d);
          const day = byKey[key];
          return (
            <div
              key={key}
              className={key === selectedKey ? "cal-cell selected stagger-in" : "cal-cell stagger-in"}
              style={{ ...cellColors(day, filter, medications), animationDelay: `${Math.min(i * 12, 200)}ms` }}
              onClick={() => selectDay(key)}
            >
              {d}
            </div>
          );
        })}
      </div>

      {selectedKey && (
        <div className="day-detail" key={selectedKey}>
          {editing ? (
            <DayEditor
              dateKey={selectedKey}
              initialData={selectedDay}
              medications={medications}
              onSave={updated => { onDayUpdate?.(updated); setEditing(false); }}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <div className="day-detail-header-row">
                <div>
                  <div className="day-detail-eyebrow">{selectedDateLabel}</div>
                  <div className="day-detail-title">{selectedWeekday}</div>
                </div>
                <button className="day-edit-btn" onClick={() => setEditing(true)}>
                  {selectedDay ? "Edit" : "+ Log this day"}
                </button>
              </div>

              {selectedDay ? (
                <>
                  <div className="day-stat-grid">
                    <div className="day-stat-card">
                      <div className="day-stat-label">Mood</div>
                      <div className="day-stat-value">{selectedDay.mood ? `${selectedDay.mood}/5` : "—"}</div>
                    </div>
                    <div className="day-stat-card">
                      <div className="day-stat-label">Sleep</div>
                      <div className="day-stat-value">{selectedDay.sleep ? `${selectedDay.sleep}h` : "—"}</div>
                    </div>
                    <div className="day-stat-card">
                      <div className="day-stat-label">Stress</div>
                      <div className="day-stat-value">{selectedDay.stress ? `${selectedDay.stress}/5` : "—"}</div>
                    </div>
                    <div className="day-stat-card">
                      <div className="day-stat-label">Energy</div>
                      <div className="day-stat-value">{selectedDay.energy ? `${selectedDay.energy}/5` : "—"}</div>
                    </div>
                    <div className="day-stat-card">
                      <div className="day-stat-label">Weight</div>
                      <div className="day-stat-value">{selectedDay.weight ? `${selectedDay.weight}` : "—"}</div>
                    </div>
                    <div className={selectedDay.workout ? "day-stat-card positive" : "day-stat-card"}>
                      <div className="day-stat-label">Workout</div>
                      <div className="day-stat-value" style={{ fontSize: 13, fontWeight: 500 }}>
                        {selectedDay.workout ? "Completed" : "Not logged"}
                      </div>
                    </div>
                  </div>

                  {medications.length > 0 && (
                    <div className="day-med-list">
                      <div className="day-stat-label" style={{ marginBottom: 6 }}>Medication</div>
                      {medications.map((m, i) => {
                        const taken = !!selectedDay.takenToday?.[m.id];
                        return (
                          <div
                            className="day-med-row stagger-in"
                            key={m.id}
                            style={{ animationDelay: `${i * 40}ms` }}
                          >
                            <span className="day-med-name">{m.name}</span>
                            <span className={taken ? "day-med-status taken" : "day-med-status missed"}>
                              {taken ? "Taken" : "Missed"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div>
                    <div className="day-stat-label" style={{ marginBottom: 6 }}>Notes</div>
                    {selectedDay.notes ? (
                      <div className="day-notes-block">{selectedDay.notes}</div>
                    ) : (
                      <p className="empty-hint">No notes for this day.</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="empty-hint">No entry logged for this day.</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default DaysView;
