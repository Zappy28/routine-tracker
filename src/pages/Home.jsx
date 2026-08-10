import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { auth } from "../firebase/Config";
import {
  saveDayEntry, getDayEntry, getDateKey, getMedications, getMetrics
} from "../firebase/firestoreService";
import { useLoadingBar } from "../context/useLoadingBar";
import Skeleton from "../components/Skeleton";
import ProgressRing from "../components/ProgressRing";
import TimeWheel from "../components/TimeWheel";
import MetricInput from "../components/MetricInput";
import AmbientGlow from "../components/AmbientGlow";
import { getTimeTier, getGreeting, TIER_COLORS } from "../utils/timeOfDay";
import { getStoredTimezone } from "../utils/timezone";
import {
  readDayValues, isMetricLogged, seedDefaultMetrics, sortMetrics
} from "../utils/metrics";
import {
  DEFAULT_BED_MINUTES,
  DEFAULT_WAKE_MINUTES,
  sleepDurationHours,
  formatDuration,
  deriveBedMinutesFromHours
} from "../utils/sleepMath";
import "./Dashboard.css";

function Home() {
  const timeZone = useMemo(() => getStoredTimezone(), []);
  const dateKey = getDateKey(new Date(), timeZone);
  const displayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone
  });
  const tier = useMemo(() => getTimeTier(new Date(), timeZone), [timeZone]);
  const [tierColor1, tierColor2] = TIER_COLORS[tier];

  const [medications, setMedications] = useState([]);
  const [metrics, setMetrics] = useState([]);
  const [takenToday, setTakenToday] = useState({});
  const [bedMinutes, setBedMinutes] = useState(DEFAULT_BED_MINUTES);
  const [wakeMinutes, setWakeMinutes] = useState(DEFAULT_WAKE_MINUTES);
  const [sleepTouched, setSleepTouched] = useState(false);
  // One bag of metric values keyed by metric id, instead of a useState per
  // hardcoded field — this is what lets the metric list be user-defined.
  const [values, setValues] = useState({});
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const saveTimer = useRef(null);
  const hasLoaded = useRef(false);
  const { start, done } = useLoadingBar();

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }

      start();
      const [meds, userMetrics, dayData] = await Promise.all([
        getMedications(uid),
        getMetrics(uid),
        getDayEntry(uid, dateKey)
      ]);

      setMedications(meds);
      // An account that predates custom metrics has no list yet — fall back to
      // the original seven so nothing disappears for existing users.
      setMetrics(sortMetrics(userMetrics?.length ? userMetrics : seedDefaultMetrics()));

      if (dayData) {
        setTakenToday(dayData.takenToday || {});
        if (dayData.bedMinutes != null && dayData.wakeMinutes != null) {
          setBedMinutes(dayData.bedMinutes);
          setWakeMinutes(dayData.wakeMinutes);
          setSleepTouched(true);
        } else if (dayData.sleep) {
          // Legacy entries only stored an hours number — back into a plausible dial position.
          setWakeMinutes(DEFAULT_WAKE_MINUTES);
          setBedMinutes(deriveBedMinutesFromHours(dayData.sleep, DEFAULT_WAKE_MINUTES));
          setSleepTouched(true);
        }
        // Merges legacy top-level fields with the modern values map.
        setValues(readDayValues(dayData));
        setNotes(dayData.notes ?? "");
      }
      setLoading(false);
      hasLoaded.current = true;
      done();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey]);

  const sleepHours = sleepDurationHours(bedMinutes, wakeMinutes);

  // Debounced auto-save — fires 700ms after the last change, never on initial load
  useEffect(() => {
    if (!hasLoaded.current) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveDayEntry(uid, dateKey, {
        date: dateKey, takenToday, values, notes,
        sleep: sleepTouched ? sleepHours : null,
        bedMinutes: sleepTouched ? bedMinutes : null,
        wakeMinutes: sleepTouched ? wakeMinutes : null
      });
      setSaveState("saved");
    }, 700);

    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takenToday, bedMinutes, wakeMinutes, sleepTouched, values, notes, dateKey]);

  const toggleMed = useCallback(id => {
    setTakenToday(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleBedChange = useCallback(min => {
    setBedMinutes(min);
    setSleepTouched(true);
  }, []);

  const handleWakeChange = useCallback(min => {
    setWakeMinutes(min);
    setSleepTouched(true);
  }, []);

  const setValue = useCallback((id, v) => {
    setValues(prev => ({ ...prev, [id]: v }));
  }, []);

  // Derived from the metric list rather than a hand-maintained constant, so
  // adding or removing a metric keeps the progress ring honest automatically.
  const total = medications.length + metrics.length + 1; // +1 for sleep
  const completed =
    Object.values(takenToday).filter(Boolean).length +
    (sleepTouched ? 1 : 0) +
    metrics.filter(m => isMetricLogged(m, values[m.id])).length;

  const morningMeds = medications.filter(m => m.time !== "Night");
  const eveningMeds = medications.filter(m => m.time === "Night");

  if (loading) {
    return (
      <div className="routine-page">
        <header className="hero hero-centered">
          <Skeleton w={100} h={11} style={{ margin: "0 auto" }} />
          <Skeleton w={180} h={32} style={{ margin: "8px auto 16px" }} />
          <Skeleton w={68} h={68} radius="50%" style={{ margin: "0 auto" }} />
        </header>
        <section className="group">
          <Skeleton w={90} h={11} style={{ marginBottom: "var(--sp-4)" }} />
          {[0, 1, 2, 3, 4].map(i => (
            <div className="metric-block" key={i}>
              <Skeleton w={70} h={13} style={{ marginBottom: "var(--sp-2)" }} />
              <Skeleton h={44} />
            </div>
          ))}
        </section>
        <section className="group">
          <Skeleton w={90} h={11} style={{ marginBottom: "var(--sp-4)" }} />
          <Skeleton h={44} />
        </section>
      </div>
    );
  }

  return (
    <div
      className="routine-page"
      style={{ "--tier-color-1": tierColor1, "--tier-color-2": tierColor2 }}
    >
      <AmbientGlow color1={tierColor1} color2={tierColor2} />

      <header className="hero hero-centered">
        <div className="hero-date">{displayDate}</div>
        <h1>{getGreeting(tier)}</h1>
        <ProgressRing value={completed} total={total} />
        <div className="hero-status">
          {completed >= total ? "Everything logged" : `${completed} of ${total} logged`}
        </div>
      </header>

      <section className="group">
        <h2 className="group-title">Today's Health</h2>

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

        {/* User-defined metrics, in their chosen order. */}
        {metrics.map(m => (
          <div className="metric-block" key={m.id}>
            <MetricInput
              metric={m}
              value={values[m.id]}
              onChange={v => setValue(m.id, v)}
            />
          </div>
        ))}

        {metrics.length === 0 && (
          <p className="empty-hint">
            You're only tracking sleep right now. Add what else you'd like to
            track in Settings.
          </p>
        )}
      </section>

      <section className="group">
        <h2 className="group-title">Medication</h2>

        {medications.length === 0 && (
          <p className="empty-hint">No medications configured. Add them in Settings.</p>
        )}

        {morningMeds.length > 0 && (
          <>
            <div className="sub-label">Morning</div>
            {morningMeds.map((m, i) => (
              <div
                className="metric-row-flat stagger-in"
                key={m.id}
                style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              >
                <span className="metric-label">{m.name}</span>
                <button
                  className={takenToday[m.id] ? "toggle-pill done" : "toggle-pill"}
                  onClick={() => toggleMed(m.id)}
                >
                  {takenToday[m.id] ? "Taken" : "Log"}
                </button>
              </div>
            ))}
          </>
        )}

        {eveningMeds.length > 0 && (
          <>
            <div className="sub-label">Evening</div>
            {eveningMeds.map((m, i) => (
              <div
                className="metric-row-flat stagger-in"
                key={m.id}
                style={{ animationDelay: `${Math.min((morningMeds.length + i) * 30, 300)}ms` }}
              >
                <span className="metric-label">{m.name}</span>
                <button
                  className={takenToday[m.id] ? "toggle-pill done" : "toggle-pill"}
                  onClick={() => toggleMed(m.id)}
                >
                  {takenToday[m.id] ? "Taken" : "Log"}
                </button>
              </div>
            ))}
          </>
        )}
      </section>

      <section className="group notes-group">
        {!notesOpen ? (
          <button className="add-note-btn" onClick={() => setNotesOpen(true)}>
            + Add note
          </button>
        ) : (
          <>
            <h2 className="group-title">Notes</h2>
            <textarea
              className="notes"
              placeholder="Anything worth remembering today..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              autoFocus
            />
          </>
        )}
      </section>

      <div className="save-indicator">
        {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
      </div>
    </div>
  );
}

export default Home;
