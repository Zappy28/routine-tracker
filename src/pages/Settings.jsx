import { useState, useEffect } from "react";
import { auth } from "../firebase/Config";
import { getMedications, saveMedications, getUserProfile, saveUserProfile } from "../firebase/firestoreService";
import { useLoadingBar } from "../context/useLoadingBar";
import Skeleton from "../components/Skeleton";
import { getStoredTimezone, setStoredTimezone, listTimezones, timezoneOffsetLabel } from "../utils/timezone";
import "./Dashboard.css";
import "./Settings.css";

const TIMEZONES = listTimezones();

function Settings() {
  const [medications, setMedications] = useState([]);
  const [name, setName] = useState("");
  const [time, setTime] = useState("Morning");
  const [timezone, setTimezone] = useState(getStoredTimezone());
  const [loading, setLoading] = useState(true);
  const { start, done } = useLoadingBar();

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      start();
      const [meds, profile] = await Promise.all([
        getMedications(uid),
        getUserProfile(uid)
      ]);
      setMedications(meds);
      if (profile?.timezone) {
        // A previously saved timezone (e.g. from another device) takes
        // precedence over whatever's cached locally.
        setTimezone(profile.timezone);
        setStoredTimezone(profile.timezone);
      }
      setLoading(false);
      done();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  async function handleTimezoneChange(tz) {
    setTimezone(tz);
    setStoredTimezone(tz);
    const uid = auth.currentUser?.uid;
    if (uid) await saveUserProfile(uid, { timezone: tz });
  }

  if (loading) {
    return (
      <div className="routine-page">
        <header className="hero">
          <Skeleton w={70} h={11} />
          <Skeleton w={160} h={26} style={{ margin: "8px 0 16px" }} />
        </header>
        <section className="group">
          <Skeleton h={42} style={{ marginBottom: "var(--sp-4)" }} />
          {[0, 1, 2].map(i => (
            <Skeleton key={i} h={52} style={{ marginBottom: "var(--sp-2)" }} />
          ))}
        </section>
      </div>
    );
  }

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

        {medications.map((m, i) => (
          <div
            className="settings-med-row stagger-in"
            key={m.id}
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
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

      <section className="group">
        <h2 className="group-title">Timezone</h2>
        <p className="empty-hint" style={{ marginBottom: "var(--sp-3)" }}>
          "Today" rolls over to the next day at midnight in this timezone — this is
          what decides which day your entries get logged under.
        </p>
        <select
          className="settings-select settings-select-full"
          value={timezone}
          onChange={e => handleTimezoneChange(e.target.value)}
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")} ({timezoneOffsetLabel(tz)})
            </option>
          ))}
        </select>
      </section>
    </div>
  );
}

export default Settings;
