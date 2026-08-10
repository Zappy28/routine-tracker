import "./RatingSlider.css";

// Shared 1-10 rating slider (Mood/Energy/Brain Fog/Stress/Congestion), used
// on both Home (today) and the History day editor (backfilling a past day).
// Range goes 0-10 rather than 1-10 — 0 is the app's existing "not logged"
// sentinel (same convention as every other metric), so it doubles as the
// resting/unset position rather than needing a separate touched flag.
function RatingSlider({ label, value, onChange }) {
  const pct = (value / 10) * 100;

  return (
    <div className={value ? "rating-slider" : "rating-slider dim"}>
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className="metric-value-lg">{value ? `${value}/10` : "—"}</span>
      </div>
      <input
        type="range"
        min="0"
        max="10"
        step="1"
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="rating-slider-input"
        style={{ "--rating-pct": `${pct}%` }}
        aria-label={label}
      />
    </div>
  );
}

export default RatingSlider;
