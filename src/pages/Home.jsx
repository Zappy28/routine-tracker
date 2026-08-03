import { useState, useEffect } from "react";
import { auth } from "../firebase/Config";
import {
  saveDayEntry,
  getDayEntry,
  getDateKey,
  saveMedications,
  getMedications
} from "../firebase/firestoreService";
import "./Dashboard.css";

function Home() {
  const dateKey = getDateKey();
  const displayDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  const [medications, setMedications] = useState([]); // persistent list, starts empty
  const [takenToday, setTakenToday] = useState({}); // { medId: true/false }
  const [newMedication, setNewMedication] = useState("");
  const [newMedicationTime, setNewMedicationTime] = useState("Morning");

  const [sleep, setSleep] = useState(null);
  const [weight, setWeight] = useState(null);
  const [workout, setWorkout] = useState(false);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState(""); // "", "saving", "saved"

  // Load everything on mount
  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setLoading(false);
        return;
      }

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
        setNotes(dayData.notes ?? "");
      }

      setLoading(false);
    }
    load();
  }, [dateKey]);

  const completed =
    Object.values(takenToday).filter(Boolean).length +
    (sleep ? 1 : 0) +
    (weight ? 1 : 0) +
    (workout ? 1 : 0) +
    (mood ? 1 : 0) +
    (energy ? 1 : 0);

  const completion = Math.round(
    (completed / Math.max(medications.length + 5, 1)) * 100
  );

  function toggleMed(id) {
    setTakenToday(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function addMedication() {
    const name = newMedication.trim();
    if (!name) return;

    setMedications(prev => [
      ...prev,
      { id: crypto.randomUUID(), name, time: newMedicationTime }
    ]);

    setNewMedication("");
    setNewMedicationTime("Morning");
  }

  function deleteMedication(id) {
    setMedications(prev => prev.filter(m => m.id !== id));
    setTakenToday(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  }

  async function handleSave() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    setSaveStatus("saving");

    await Promise.all([
      saveMedications(uid, medications),
      saveDayEntry(uid, dateKey, {
        date: dateKey,
        takenToday,
        sleep,
        weight,
        workout,
        mood,
        energy,
        notes
      })
    ]);

    setSaveStatus("saved");
    setTimeout(() => setSaveStatus(""), 2000);
  }

  if (loading) return <div className="routine-page">Loading...</div>;

  return (
    <div className="routine-page">
      <header className="header">
        <div className="day-label">{displayDate}</div>
        <h1>Good morning.</h1>
      </header>

      <div className="completion-block">
        <div className="completion-header">
          <span>DAILY COMPLETION</span>
          <b>{completion}%</b>
        </div>
        <div className="progress">
          <div style={{ width: `${completion}%` }} />
        </div>
      </div>

      <div className="divider" />

      <section>
        <h3>MEDICATIONS</h3>

        <div className="add-medication">
          <input
            type="text"
            placeholder="Medication name"
            value={newMedication}
            onChange={(e) => setNewMedication(e.target.value)}
          />
          <select
            value={newMedicationTime}
            onChange={(e) => setNewMedicationTime(e.target.value)}
          >
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Night</option>
          </select>
          <button className="add-med-btn" onClick={addMedication}>
            Add
          </button>
        </div>

        {medications.length === 0 && (
          <p style={{ opacity: 0.6 }}>No medications added yet.</p>
        )}

        {medications.map(m => (
          <div className="med-item" key={m.id}>
            <div className="med-info">
              <div className="med-name">{m.name}</div>
              <div className="med-time">
                {m.time} · {takenToday[m.id] ? "Taken" : "Not logged"}
              </div>
            </div>
            <div className="med-actions">
              <button
                className={takenToday[m.id] ? "med-btn taken" : "med-btn"}
                onClick={() => toggleMed(m.id)}
              >
                {takenToday[m.id] ? "Taken" : "Mark as taken"}
              </button>
              <button
                className="delete-med-btn"
                onClick={() => deleteMedication(m.id)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="divider" />

      <section>
        <h3>SLEEP</h3>
        <div className="metric-row">
          <div>
            <div className="metric-name">{sleep ? `${sleep}h` : "Not logged"}</div>
            <div className="metric-sub">Duration</div>
          </div>
          <div className="stepper">
            <button onClick={() => setSleep(sleep ? sleep - 0.5 : 7.5)}>−</button>
            <span>{sleep ? sleep + "h" : "--"}</span>
            <button onClick={() => setSleep(sleep ? sleep + 0.5 : 7.5)}>+</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h3>WEIGHT</h3>
        <div className="metric-row">
          <div>
            <div className="metric-name">{weight ? `${weight} lbs` : "Not logged"}</div>
            <div className="metric-sub">Today</div>
          </div>
          <div className="stepper">
            <button onClick={() => setWeight(weight ? weight - 1 : 132)}>−</button>
            <span>{weight ?? "--"}</span>
            <button onClick={() => setWeight(weight ? weight + 1 : 132)}>+</button>
          </div>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h3>ACTIVITY</h3>
        <div className="metric-row">
          <div>
            <div className="metric-name">Workout</div>
            <div className="metric-sub">{workout ? "Completed today" : "Not logged"}</div>
          </div>
          <button
            className={workout ? "workout done" : "workout"}
            onClick={() => setWorkout(!workout)}
          >
            {workout ? "Edit" : "Log workout"}
          </button>
        </div>
      </section>

      <div className="divider" />

      <section>
        <h3>WELLBEING</h3>
        {[["Mood", mood, setMood], ["Energy", energy, setEnergy]].map(
          ([name, value, setter]) => (
            <div className="metric-row" key={name}>
              <div>
                <div className="metric-name">{name}</div>
                <div className="metric-sub">{value ? `${value} / 5` : "Not logged"}</div>
              </div>
              <div className="dots">
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    className={value === n ? "dot active" : "dot"}
                    onClick={() => setter(n)}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </section>

      <div className="divider" />

      <textarea
        className="notes"
        placeholder="Add a note for today..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />

      <div className="divider" />

      <button
        className="save-btn"
        onClick={handleSave}
        disabled={saveStatus === "saving"}
        style={{
          width: "100%",
          padding: "14px",
          fontSize: "16px",
          fontWeight: 600,
          borderRadius: "10px",
          border: "none",
          cursor: "pointer",
          marginTop: "8px"
        }}
      >
        {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved ✓" : "Save"}
      </button>
    </div>
  );
}

export default Home;