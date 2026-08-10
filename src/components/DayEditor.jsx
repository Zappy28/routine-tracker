import { useState } from "react";
import { auth } from "../firebase/Config";
import { saveDayEntry } from "../firebase/firestoreService";
import MetricInput from "./MetricInput";
import TimeWheel from "./TimeWheel";
import { readDayValues } from "../utils/metrics";
import {
  DEFAULT_BED_MINUTES,
  DEFAULT_WAKE_MINUTES,
  sleepDurationHours,
  formatDuration,
  deriveBedMinutesFromHours
} from "../utils/sleepMath";

function dateLabelFull(dateKey) {
  return new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}

// Backfill/correction form for a single past day — same fields as Home's
// "today" form, but parameterized by an arbitrary dateKey and saving
// explicitly (Save/Cancel) rather than auto-saving, since editing history is
// a deliberate action rather than a continuous one.
function DayEditor({ dateKey, initialData, medications, metrics = [], onSave, onCancel }) {
  const [takenToday, setTakenToday] = useState(initialData?.takenToday || {});
  // Legacy top-level fields are merged in, so editing an old entry shows its
  // real values rather than a blank form.
  const [values, setValues] = useState(() => readDayValues(initialData));
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const hasBedWake = initialData?.bedMinutes != null && initialData?.wakeMinutes != null;
  const [bedMinutes, setBedMinutes] = useState(() => {
    if (hasBedWake) return initialData.bedMinutes;
    if (initialData?.sleep) return deriveBedMinutesFromHours(initialData.sleep, DEFAULT_WAKE_MINUTES);
    return DEFAULT_BED_MINUTES;
  });
  const [wakeMinutes, setWakeMinutes] = useState(hasBedWake ? initialData.wakeMinutes : DEFAULT_WAKE_MINUTES);
  const [sleepTouched, setSleepTouched] = useState(hasBedWake || !!initialData?.sleep);

  const sleepHours = sleepDurationHours(bedMinutes, wakeMinutes);

  function toggleMed(id) {
    setTakenToday(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function handleBedChange(min) {
    setBedMinutes(min);
    setSleepTouched(true);
  }

  function handleWakeChange(min) {
    setWakeMinutes(min);
    setSleepTouched(true);
  }

  function setValue(id, v) {
    setValues(prev => ({ ...prev, [id]: v }));
  }

  async function handleSave() {
    setSaving(true);
    const uid = auth.currentUser?.uid;
    const payload = {
      date: dateKey,
      takenToday,
      values,
      notes,
      sleep: sleepTouched ? sleepHours : null,
      bedMinutes: sleepTouched ? bedMinutes : null,
      wakeMinutes: sleepTouched ? wakeMinutes : null
    };
    if (uid) {
      await saveDayEntry(uid, dateKey, payload);
    }
    setSaving(false);
    onSave({ id: dateKey, ...payload });
  }

  return (
    <div className="day-editor">
      <div className="day-detail-eyebrow">Editing</div>
      <div className="day-detail-title">{dateLabelFull(dateKey)}</div>

      <div className="metric-block">
        <div className="metric-top">
          <span className="metric-label">Sleep</span>
          <span className="metric-value-lg">
            {sleepTouched ? formatDuration(sleepHours) : "—"}
          </span>
        </div>
        <div className="time-wheel-row">
          <TimeWheel
            label="Bedtime"
            minutes={bedMinutes}
            onChange={handleBedChange}
            accentVar="--leather"
            dim={!sleepTouched}
            rangeStart={17 * 60}
            rangeSpan={12 * 60}
          />
          <TimeWheel
            label="Wake time"
            minutes={wakeMinutes}
            onChange={handleWakeChange}
            accentVar="--accent"
            dim={!sleepTouched}
          />
        </div>
      </div>

      {metrics.map(m => (
        <div className="metric-block" key={m.id}>
          <MetricInput
            metric={m}
            value={values[m.id]}
            onChange={v => setValue(m.id, v)}
          />
        </div>
      ))}

      {medications.length > 0 && (
        <div className="metric-block" style={{ marginTop: "var(--sp-4)" }}>
          <div className="day-stat-label" style={{ marginBottom: 6 }}>Medication</div>
          {medications.map(m => (
            <div className="metric-row-flat" key={m.id}>
              <span className="metric-label">{m.name}</span>
              <button
                className={takenToday[m.id] ? "toggle-pill done" : "toggle-pill"}
                onClick={() => toggleMed(m.id)}
              >
                {takenToday[m.id] ? "Taken" : "Log"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="metric-block">
        <div className="day-stat-label" style={{ marginBottom: 6 }}>Notes</div>
        <textarea
          className="notes"
          placeholder="Anything worth remembering..."
          value={notes}
          onChange={e => setNotes(e.target.value)}
          style={{ marginTop: 0, animation: "none" }}
        />
      </div>

      <div className="editor-actions">
        <button className="editor-cancel-btn" onClick={onCancel} disabled={saving}>
          Cancel
        </button>
        <button className="editor-save-btn" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

export default DayEditor;
