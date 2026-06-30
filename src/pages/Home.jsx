import { useState } from "react";
import Card from "../components/Card";
import { today as initialToday } from "../data/mockData";
import "./Dashboard.css";

const initialMeds = [
  { id: 1, name: "Vitamin D", time: "Morning", done: false },
  { id: 2, name: "Melatonin", time: "Night", done: false },
];

const energyFaces = ["1", "2", "3", "4", "5"];
const moodFaces = ["1", "2", "3", "4", "5"];

function Home() {
  const [meds, setMeds] = useState(initialMeds);
  const [showMedSettings, setShowMedSettings] = useState(false);

  const [day, setDay] = useState(initialToday);
  const [sleep, setSleep] = useState(7);
  const [energy, setEnergy] = useState(null);
  const [mood, setMood] = useState(null);

  const toggleMed = (id) =>
    setMeds((prev) => prev.map((m) => (m.id === id ? { ...m, done: !m.done } : m)));

  const medsComplete = meds.length > 0 && meds.every((m) => m.done);

  return (
    <div>
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, margin: "0 0 4px" }}>
        {day.date}
      </h1>
      <p style={{ color: "var(--text-soft)", fontSize: "0.9rem", margin: "0 0 22px" }}>
        Quick check-in for today
      </p>

      {/* Medicine Tracker */}
      <section className="card">
        <div className="med-card-header">
          <h3>Medicine</h3>
          <button
            className="settings-btn"
            aria-label="Medicine settings"
            onClick={() => setShowMedSettings(true)}
          >
            ⚙
          </button>
        </div>

        <ul className="med-list">
          {meds.map((med) => (
            <li key={med.id}>
              <button
                className={`med-row ${med.done ? "med-done" : ""}`}
                onClick={() => toggleMed(med.id)}
              >
                <span className="checkbox">{med.done && "✓"}</span>
                <span className="med-name">{med.name}</span>
                <span className="med-time">{med.time}</span>
              </button>
            </li>
          ))}
        </ul>

        {medsComplete && <p className="status-pill">All medicine taken</p>}
      </section>

      {/* Daily Metrics */}
      <section className="card">
        <h3>Daily metrics</h3>

        <div className="metric-row">
          <span className="metric-label">Sleep</span>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={sleep}
            onChange={(e) => setSleep(e.target.value)}
          />
          <span className="metric-value">{sleep} hrs</span>
        </div>

        <div className="metric-row">
          <span className="metric-label">Weight</span>
          <input
            type="number"
            inputMode="decimal"
            value={day.weight}
            onChange={(e) => setDay((d) => ({ ...d, weight: e.target.value }))}
            className="metric-input"
          />
        </div>

        <div className="metric-row">
          <span className="metric-label">Gym</span>
          <button
            className={`toggle-btn ${day.gym ? "toggle-on" : ""}`}
            onClick={() => setDay((d) => ({ ...d, gym: !d.gym }))}
          >
            {day.gym ? "Done" : "Not yet"}
          </button>
        </div>

        <div className="metric-row scale-row">
          <span className="metric-label">Energy</span>
          <div className="scale-options">
            {energyFaces.map((face, i) => (
              <button
                key={i}
                className={`scale-btn ${energy === i ? "scale-selected" : ""}`}
                onClick={() => setEnergy(i)}
                aria-label={`Energy ${i + 1} of 5`}
              >
                {face}
              </button>
            ))}
          </div>
        </div>

        <div className="metric-row scale-row">
          <span className="metric-label">Mood</span>
          <div className="scale-options">
            {moodFaces.map((face, i) => (
              <button
                key={i}
                className={`scale-btn ${mood === i ? "scale-selected" : ""}`}
                onClick={() => setMood(i)}
                aria-label={`Mood ${i + 1} of 5`}
              >
                {face}
              </button>
            ))}
          </div>
        </div>

        <textarea className="notes-input" placeholder="Notes (optional)" rows={2} />
      </section>

      <Card title="Quick actions">
        <button className="btn" onClick={() => setDay((d) => ({ ...d, water: !d.water }))}>
          💧 Log water
        </button>
        <button className="btn" onClick={() => setDay((d) => ({ ...d, gym: !d.gym }))}>
          ⚖ Log workout
        </button>
      </Card>

      {showMedSettings && (
        <div className="modal-backdrop" onClick={() => setShowMedSettings(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Medicine settings</h3>
            <p>
              Name, frequency, and time-of-day fields go here — wire this up
              to your Settings page form when that's built.
            </p>
            <button className="btn" onClick={() => setShowMedSettings(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;