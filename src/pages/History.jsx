import { useState, useEffect } from "react";
import Card from "../components/Card";
import { auth } from "../firebase/Config";
import { getHistory } from "../firebase/firestoreService";

function History() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHistory() {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const data = await getHistory(uid);
      setDays(data);
      setLoading(false);
    }
    loadHistory();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h1>History</h1>

      {days.length === 0 && <p>No entries yet — log something on the Home page.</p>}

      {days.map(day => (
        <Card key={day.id} title={day.date}>
          <p>Medicine: {Object.values(day.takenToday || {}).some(Boolean) ? "Taken" : "Not logged"}</p>
          <p>Mood: {day.mood ? `${day.mood} / 5` : "Not logged"}</p>
          <p>Weight: {day.weight ? `${day.weight} lbs` : "Not logged"}</p>
        </Card>
      ))}
    </div>
  );
}

export default History;