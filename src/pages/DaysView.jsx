import { useMemo, useState } from "react";
import DayEditor from "../components/DayEditor";
import { readDayValues, hasMetricValue, formatMetricDisplay } from "../utils/metrics";

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

const GOOD = { background: "var(--accent-dim)", borderColor: "var(--accent-line)" };
const MID = { background: "var(--warn-dim)", borderColor: "var(--warn-line)" };
const LOW = { background: "var(--danger-dim)", borderColor: "var(--danger-line)" };

// Colors a calendar cell for whichever metric (or "all") is selected. Works for
// any user-defined metric rather than only the previously hardcoded mood.
function cellColors(day, filter, medications, metricsById) {
  if (!day) return {};
  const values = readDayValues(day);

  if (filter === "medication") {
    return medsFullyTaken(day, medications) ? GOOD : {};
  }

  if (filter === "all") {
    // Composite: medication adherence plus how many tracked metrics got logged.
    const full = medsFullyTaken(day, medications);
    const tracked = Object.values(metricsById);
    const logged = tracked.filter(m => hasMetricValue(m, values[m.id])).length;
    const ratio = tracked.length ? logged / tracked.length : 0;
    if (full && ratio >= 0.8) return GOOD;
    if (logged > 0) return { background: "rgba(34, 211, 138, 0.07)" };
    return {};
  }

  const metric = metricsById[filter];
  const v = values[filter];
  if (!metric || !hasMetricValue(metric, v)) return {};

  if (metric.type === "toggle") return v ? GOOD : {};

  if (metric.type === "scale") {
    // 8+ good, 5-7 neutral, below that low.
    if (v >= 8) return GOOD;
    if (v >= 5) return MID;
    return LOW;
  }

  // Counts have no universal "good" value — just show that something was logged.
  return { background: "rgba(34, 211, 138, 0.07)" };
}

function DaysView({ days, medications, metrics = [], onDayUpdate }) {
  const byKey = useMemo(() => {
    const map = {};
    days.forEach(d => { map[d.id] = d; });
    return map;
  }, [days]);

  const metricsById = useMemo(() => {
    const map = {};
    metrics.forEach(m => { map[m.id] = m; });
    return map;
  }, [metrics]);

  // Filter chips are built from the user's own metric list.
  const filters = useMemo(() => [
    { key: "all", label: "All", legend: "everything logged, combined" },
    ...(medications.length
      ? [{ key: "medication", label: "Medication", legend: "medication adherence only" }]
      : []),
    ...metrics.map(m => ({
      key: m.id,
      label: m.label,
      legend: `${m.label.toLowerCase()}, color-coded`
    }))
  ], [metrics, medications]);

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
  const activeFilter = filters.find(f => f.key === filter) || filters[0];

  const selectedDay = selectedKey ? byKey[selectedKey] : null;
  const selectedValues = useMemo(() => readDayValues(selectedDay), [selectedDay]);
  const selectedDateLabel = selectedKey
    ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;
  const selectedWeekday = selectedKey
    ? new Date(`${selectedKey}T00:00:00`).toLocaleDateString("en-US", { weekday: "long" })
    : null;

  return (
    <div>
      <div className="chip-row">
        {filters.map(f => (
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
              style={{ ...cellColors(day, filter, medications, metricsById), animationDelay: `${Math.min(i * 12, 200)}ms` }}
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
              metrics={metrics}
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
                    {/* Sleep is permanent, so it always leads. */}
                    <div className="day-stat-card">
                      <div className="day-stat-label">Sleep</div>
                      <div className="day-stat-value">
                        {selectedDay.sleep ? `${selectedDay.sleep}h` : "—"}
                      </div>
                    </div>

                    {metrics.map(m => {
                      const v = selectedValues[m.id];
                      const on = m.type === "toggle" && v === true;
                      return (
                        <div className={on ? "day-stat-card positive" : "day-stat-card"} key={m.id}>
                          <div className="day-stat-label">{m.label}</div>
                          <div
                            className="day-stat-value"
                            style={m.type === "toggle" ? { fontSize: 13, fontWeight: 500 } : undefined}
                          >
                            {formatMetricDisplay(m, v)}
                          </div>
                        </div>
                      );
                    })}
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
