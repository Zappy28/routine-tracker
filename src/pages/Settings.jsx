import { useState, useEffect } from "react";
import { auth } from "../firebase/Config";
import { getMedications, saveMedications } from "../firebase/firestoreService";
import "./Dashboard.css";
import "./Settings.css";

function Settings() {
  const [medications, setMedications] = useState([]);
  const [name, setName] = useState("");
  const [time, setTime] = useState("Morning");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      setMedications(await getMedications(uid));
      setLoading(false);
    }
    load();
  }, []);

  async function persist(next) {
    setMedications(next);
    const uid = auth.currentUser?.uid;
    if (uid) await saveMedications(uid, next);
  }

  function addMedication() {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist([...medications, { id: crypto.randomUUID(), name: trimmed, time }]);
    setName("");
    setTime("Morning");
  }

  function deleteMedication(id) {
    persist(medications.filter(m => m.id !== id));
  }

  if (loading) return <div className="routine-page" />;

  return (
    <div className="routine-page">
      <header className="hero">
        <div className="hero-date">Settings</div>
        <h1>Medications</h1>
      </header>

      <section className="group">
        <div className="settings-add-row">
          <input
            className="settings-input"
            type="text"
            placeholder="Medication name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <select
            className="settings-select"
            value={time}
            onChange={e => setTime(e.target.value)}
          >
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Night</option>
          </select>
          <button className="settings-add-btn" onClick={addMedication}>
            Add
          </button>
        </div>

        {medications.length === 0 && <p className="empty-hint">No medications yet.</p>}

        {medications.map(m => (
          <div className="settings-med-row" key={m.id}>
            <div>
              <div className="settings-med-name">{m.name}</div>
              <div className="sub-label" style={{ margin: 0, marginTop: 2 }}>{m.time}</div>
            </div>
            <button className="settings-delete-btn" onClick={() => deleteMedication(m.id)}>
              ✕
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}

export default Settings;