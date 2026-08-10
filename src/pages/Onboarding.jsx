import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/Config";
import { saveUserProfile, saveMetrics, saveMedications } from "../firebase/firestoreService";
import { useLoadingBar } from "../context/useLoadingBar";
import AmbientGlow from "../components/AmbientGlow";
import WaypointMark from "../components/WaypointMark";
import TimeWheel from "../components/TimeWheel";
import {
  METRIC_PRESETS, findPreset, DEFAULT_METRIC_IDS, makeMetricId, METRIC_TYPES
} from "../utils/metrics";
import {
  detectTimezone, setStoredTimezone, listTimezones, timezoneOffsetLabel
} from "../utils/timezone";
import { DEFAULT_BED_MINUTES, DEFAULT_WAKE_MINUTES, sleepDurationHours, formatDuration } from "../utils/sleepMath";
import "./Dashboard.css";
import "./Auth.css";
import "./Onboarding.css";

const TIMEZONES = listTimezones();
const STEPS = ["You", "Timezone", "Tracking", "Medication", "Sleep"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { start, done } = useLoadingBar();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState(detectTimezone());
  const [selectedIds, setSelectedIds] = useState(DEFAULT_METRIC_IDS.slice(0, 4));
  const [customLabel, setCustomLabel] = useState("");
  const [customType, setCustomType] = useState("scale");
  const [customMetrics, setCustomMetrics] = useState([]);
  const [meds, setMeds] = useState([]);
  const [medName, setMedName] = useState("");
  const [medTime, setMedTime] = useState("Morning");
  const [bedMinutes, setBedMinutes] = useState(DEFAULT_BED_MINUTES);
  const [wakeMinutes, setWakeMinutes] = useState(DEFAULT_WAKE_MINUTES);

  function togglePreset(id) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  function addCustom() {
    const label = customLabel.trim();
    if (!label) return;
    const all = [...customMetrics, ...selectedIds.map(id => ({ id }))];
    setCustomMetrics(prev => [...prev, {
      id: makeMetricId(label, all), label, type: customType
    }]);
    setCustomLabel("");
    setCustomType("scale");
  }

  function addMed() {
    const n = medName.trim();
    if (!n) return;
    setMeds(prev => [...prev, { id: crypto.randomUUID(), name: n, time: medTime }]);
    setMedName("");
    setMedTime("Morning");
  }

  async function finish() {
    setSaving(true);
    start();
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const chosen = [
          ...selectedIds.map(findPreset).filter(Boolean),
          ...customMetrics
        ].map((m, order) => ({ ...m, order }));

        await Promise.all([
          saveUserProfile(uid, {
            displayName: displayName.trim() || null,
            timezone,
            defaultBedMinutes: bedMinutes,
            defaultWakeMinutes: wakeMinutes,
            onboardedAt: new Date().toISOString()
          }),
          saveMetrics(uid, chosen),
          meds.length ? saveMedications(uid, meds) : Promise.resolve()
        ]);
        setStoredTimezone(timezone);
      }
      navigate("/", { replace: true });
    } finally {
      setSaving(false);
      done();
    }
  }

  const isLast = step === STEPS.length - 1;
  const sleepHours = sleepDurationHours(bedMinutes, wakeMinutes);
  const totalChosen = selectedIds.length + customMetrics.length;

  return (
    <div className="auth-page onboarding-page">
      <AmbientGlow />

      <div className="auth-card onboarding-card">
        <div className="auth-brand">
          <WaypointMark size={24} />
          <span className="auth-brand-text">Waypoint</span>
        </div>

        <div className="onboarding-steps" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
          {STEPS.map((label, i) => (
            <span
              key={label}
              className={
                i === step ? "onboarding-step current"
                  : i < step ? "onboarding-step done" : "onboarding-step"
              }
            />
          ))}
        </div>

        {step === 0 && (
          <>
            <h1>Welcome.</h1>
            <p className="auth-sub">Let's set up what you'd like to keep track of. Takes about a minute.</p>
            <div className="auth-field">
              <label className="auth-label" htmlFor="ob-name">What should we call you?</label>
              <input
                id="ob-name"
                className="auth-input"
                type="text"
                placeholder="Optional"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
              />
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h1>Your timezone.</h1>
            <p className="auth-sub">
              This decides when your day rolls over, so entries land on the right date.
            </p>
            <select
              className="settings-select settings-select-full"
              value={timezone}
              onChange={e => setTimezone(e.target.value)}
            >
              {TIMEZONES.map(tz => (
                <option key={tz} value={tz}>
                  {tz.replace(/_/g, " ")} ({timezoneOffsetLabel(tz)})
                </option>
              ))}
            </select>
          </>
        )}

        {step === 2 && (
          <>
            <h1>What do you want to track?</h1>
            <p className="auth-sub">
              Pick anything that's useful to you — you can change this later in Settings.
              Sleep and notes are always included.
            </p>

            {METRIC_PRESETS.map(group => (
              <div key={group.group} className="onboarding-group">
                <div className="onboarding-group-label">{group.group}</div>
                <div className="chip-row onboarding-chip-row">
                  {group.items.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      className={selectedIds.includes(p.id) ? "chip active" : "chip"}
                      onClick={() => togglePreset(p.id)}
                    >
                      {selectedIds.includes(p.id) ? "✓ " : ""}{p.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {customMetrics.length > 0 && (
              <div className="onboarding-group">
                <div className="onboarding-group-label">Yours</div>
                <div className="chip-row onboarding-chip-row">
                  {customMetrics.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      className="chip active"
                      onClick={() => setCustomMetrics(prev => prev.filter(x => x.id !== m.id))}
                    >
                      ✓ {m.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="onboarding-group">
              <div className="onboarding-group-label">Add your own</div>
              <div className="settings-add-row">
                <input
                  className="settings-input"
                  type="text"
                  placeholder="e.g. IBS flare-up"
                  value={customLabel}
                  onChange={e => setCustomLabel(e.target.value)}
                />
                <select
                  className="settings-select"
                  value={customType}
                  onChange={e => setCustomType(e.target.value)}
                >
                  {Object.values(METRIC_TYPES).map(t => (
                    <option key={t.id} value={t.id}>{t.label}</option>
                  ))}
                </select>
                <button className="settings-add-btn" type="button" onClick={addCustom}>Add</button>
              </div>
            </div>

            <p className="empty-hint">{totalChosen} selected</p>
          </>
        )}

        {step === 3 && (
          <>
            <h1>Any medications?</h1>
            <p className="auth-sub">
              You'll get a daily checklist for these. Skip if it's not relevant.
            </p>
            <div className="settings-add-row">
              <input
                className="settings-input"
                type="text"
                placeholder="Medication name"
                value={medName}
                onChange={e => setMedName(e.target.value)}
              />
              <select
                className="settings-select"
                value={medTime}
                onChange={e => setMedTime(e.target.value)}
              >
                <option>Morning</option>
                <option>Afternoon</option>
                <option>Night</option>
              </select>
              <button className="settings-add-btn" type="button" onClick={addMed}>Add</button>
            </div>

            {meds.map(m => (
              <div className="settings-med-row" key={m.id}>
                <div>
                  <div className="settings-med-name">{m.name}</div>
                  <div className="sub-label" style={{ margin: 0, marginTop: 2 }}>{m.time}</div>
                </div>
                <button
                  className="settings-delete-btn"
                  onClick={() => setMeds(prev => prev.filter(x => x.id !== m.id))}
                >✕</button>
              </div>
            ))}
          </>
        )}

        {step === 4 && (
          <>
            <h1>When do you usually sleep?</h1>
            <p className="auth-sub">
              Just to set a starting point — you can adjust it any day.
            </p>
            <div className="metric-top">
              <span className="metric-label">Typical night</span>
              <span className="metric-value-lg">{formatDuration(sleepHours)}</span>
            </div>
            <div className="time-wheel-row">
              <TimeWheel
                label="Bedtime"
                minutes={bedMinutes}
                onChange={setBedMinutes}
                accentVar="--leather"
                rangeStart={17 * 60}
                rangeSpan={12 * 60}
              />
              <TimeWheel
                label="Wake time"
                minutes={wakeMinutes}
                onChange={setWakeMinutes}
                accentVar="--accent"
              />
            </div>
          </>
        )}

        <div className="onboarding-actions">
          {step > 0 && (
            <button
              className="editor-cancel-btn"
              type="button"
              onClick={() => setStep(s => s - 1)}
              disabled={saving}
            >
              Back
            </button>
          )}
          <button
            className="auth-submit onboarding-next"
            type="button"
            onClick={() => (isLast ? finish() : setStep(s => s + 1))}
            disabled={saving}
          >
            {saving ? "Setting up…" : isLast ? "Start tracking" : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
