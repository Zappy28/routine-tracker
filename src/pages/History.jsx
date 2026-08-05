import { useState, useEffect, useCallback } from "react";
import { auth } from "../firebase/Config";
import { getHistory, getMedications } from "../firebase/firestoreService";
import { useLoadingBar } from "../context/useLoadingBar";
import Skeleton from "../components/Skeleton";
import AmbientGlow from "../components/AmbientGlow";
import TrendsView from "./TrendsView";
import DaysView from "./DaysView";
import "./Dashboard.css";
import "./History.css";

function History() {
  const [days, setDays] = useState([]);
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("trends");
  const { start, done } = useLoadingBar();

  useEffect(() => {
    async function loadHistory() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }

      start();
      const [history, meds] = await Promise.all([
        getHistory(uid),
        getMedications(uid)
      ]);
      setDays(history);
      setMedications(meds);
      setLoading(false);
      done();
    }
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lets DaysView's editor write a day's changes back into this page's own
  // `days` state immediately, without needing a full history re-fetch —
  // covers both edits to an existing day and backfilling a day that never
  // had an entry at all.
  const handleDayUpdate = useCallback(updatedDay => {
    setDays(prev => {
      const idx = prev.findIndex(d => d.id === updatedDay.id);
      if (idx === -1) {
        return [...prev, updatedDay].sort((a, b) => b.id.localeCompare(a.id));
      }
      const next = [...prev];
      next[idx] = updatedDay;
      return next;
    });
  }, []);

  if (loading) {
    return (
      <div className="routine-page">
        <header className="hero">
          <Skeleton w={70} h={11} />
          <Skeleton w={160} h={26} style={{ margin: "8px 0 16px" }} />
        </header>
        <section className="group" style={{ borderTop: "none", paddingBottom: 0 }}>
          <Skeleton h={40} radius="var(--r-md)" />
        </section>
        <section className="group">
          <Skeleton h={150} />
        </section>
      </div>
    );
  }

  return (
    <div className="routine-page">
      <AmbientGlow />

      <header className="hero hero-centered">
        <div className="hero-date">History</div>
        <h1>{tab === "trends" ? "Your trends." : "Your days."}</h1>
      </header>

      {days.length === 0 ? (
        <section className="group">
          <p className="empty-hint">No entries yet — log something on the Home page.</p>
        </section>
      ) : (
        <>
          <section className="group" style={{ borderTop: "none", paddingBottom: 0 }}>
            <div className="segmented" style={{ "--seg-count": 2, "--seg-index": tab === "trends" ? 0 : 1 }}>
              <button
                className={tab === "trends" ? "seg-btn active" : "seg-btn"}
                onClick={() => setTab("trends")}
              >
                Trends
              </button>
              <button
                className={tab === "days" ? "seg-btn active" : "seg-btn"}
                onClick={() => setTab("days")}
              >
                Days
              </button>
            </div>
          </section>

          <section className="group">
            {tab === "trends" ? (
              <TrendsView days={days} medications={medications} />
            ) : (
              <DaysView days={days} medications={medications} onDayUpdate={handleDayUpdate} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default History;
