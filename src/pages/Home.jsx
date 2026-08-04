import { useState, useEffect, useRef, useCallback } from "react";
import { auth } from "../firebase/Config";
import { saveDayEntry, getDayEntry, getDateKey, getMedications } from "../firebase/firestoreService";
import "./Dashboard.css";

const LEVELS = ["Very Low", "Low", "Normal", "High", "Excellent"];

function Segmented({ value, onChange }) {
  return (
    <div className="segmented">
      {LEVELS.map((label, i) => (
        <button
          key={label}
          className={value === i + 1 ? "seg-btn active" : "seg-btn"}
          onClick={() => onChange(i + 1)}
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}

function Home() {
  const dateKey = getDateKey();
  const displayDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  });

  const [medications, setMedications] = useState([]);
  const [takenToday, setTakenToday] = useState({});
  const [sleep, setSleep] = useState(null);
  const [weight, setWeight] = useState(null);
  const [workout, setWorkout] = useState(false);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [brainFog, setBrainFog] = useState(0);
  const [stress, setStress] = useState(0);
  const [notes, setNotes] = useState("");
  const [notesOpen, setNotesOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState("idle"); // idle | saving | saved
  const saveTimer = useRef(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }

      const [meds, dayData] = await Promise.all([
        getMedications(uid),
        getDayEntry(uid, dateKey)
      ]);

      setMedications(meds);
      if (dayData) {
        setTakenToday(dayData.takenToday || {});
        setSleep(dayData.sleep ?? null);
        setWeight(dayData.weight ?? null);
        setWorkout(dayData.workout ?? false);
        setMood(dayData.mood ?? 0);
        setEnergy(dayData.energy ?? 0);
        setBrainFog(dayData.brainFog ?? 0);
        setStress(dayData.stress ?? 0);
        setNotes(dayData.notes ?? "");
      }
      setLoading(false);
      hasLoaded.current = true;
    }
    load();
  }, [dateKey]);

  // Debounced auto-save — fires 700ms after the last change, never on initial load
  useEffect(() => {
    if (!hasLoaded.current) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaveState("saving");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await saveDayEntry(uid, dateKey, {
        date: dateKey, takenToday, sleep, weight, workout,
        mood, energy, brainFog, stress, notes
      });
      setSaveState("saved");
    }, 700);

    return () => clearTimeout(saveTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [takenToday, sleep, weight, workout, mood, energy, brainFog, stress, notes, dateKey]);

  const toggleMed = useCallback(id => {
    setTakenToday(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const total = medications.length + 6; // meds + sleep, weight, workout, mood, energy, brainFog(stress optional)
  const completed =
    Object.values(takenToday).filter(Boolean).length +
    (sleep ? 1 : 0) + (weight ? 1 : 0) + (workout ? 1 : 0) +
    (mood ? 1 : 0) + (energy ? 1 : 0) + (brainFog ? 1 : 0);

  const morningMeds = medications.filter(m => m.time !== "Night");
  const eveningMeds = medications.filter(m => m.time === "Night");

  if (loading) return <div className="routine-page" />;

  return (
    <div className="routine-page">
      <header className="hero">
        <div className="hero-date">{displayDate}</div>
        <h1>Good morning.</h1>
        <div className="hero-status">
          {completed >= total ? "Everything logged" : `${completed} of ${total} logged`}
        </div>
      </header>

      <section className="group">
        <h2 className="group-title">Today's Health</h2>

        <div className="metric-block">
          <div className="metric-top">
            <span className="metric-label">Sleep</span>
            <span className="metric-value-lg">{sleep ? `${sleep}h` : "—"}</span>
          </div>
          <div className="stepper-inline">
            <button onClick={() => setSleep(sleep ? sleep - 0.5 : 7.5)}>−</button>
            <button onClick={() => setSleep(sleep ? sleep + 0.5 : 7.5)}>+</button>
          </div>
        </div>

        <div className="metric-block">
          <span className="metric-label">Mood</span>
          <Segmented value={mood} onChange={setMood} />
        </div>

        <div className="metric-block">
          <span className="metric-label">Energy</span>
          <Segmented value={energy} onChange={setEnergy} />
        </div>

        <div className="metric-block">
          <span className="metric-label">Brain Fog</span>
          <Segmented value={brainFog} onChange={setBrainFog} />
        </div>

        <div className="metric-block">
          <span className="metric-label">Stress</span>
          <Segmented value={stress} onChange={setStress} />
        </div>
      </section>

      <section className="group">
        <h2 className="group-title">Body</h2>

        <div className="metric-block">
          <div className="metric-top">
            <span className="metric-label">Weight</span>
            <span className="metric-value-lg">{weight ? `${weight} lbs` : "—"}</span>
          </div>
          <div className="stepper-inline">
            <button onClick={() => setWeight(weight ? weight - 1 : 132)}>−</button>
            <button onClick={() => setWeight(weight ? weight + 1 : 132)}>+</button>
          </div>
        </div>

        <div className="metric-row-flat">
          <span className="metric-label">Exercise</span>
          <button
            className={workout ? "toggle-pill done" : "toggle-pill"}
            onClick={() => setWorkout(!workout)}
          >
            {workout ? "Completed" : "Not logged"}
          </button>
        </div>
      </section>

      <section className="group">
        <h2 className="group-title">Medication</h2>

        {medications.length === 0 && (
          <p className="empty-hint">No medications configured. Add them in Settings.</p>
        )}

        {morningMeds.length > 0 && (
          <>
            <div className="sub-label">Morning</div>
            {morningMeds.map(m => (
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
          </>
        )}

        {eveningMeds.length > 0 && (
          <>
            <div className="sub-label">Evening</div>
            {eveningMeds.map(m => (
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