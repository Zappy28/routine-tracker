const LEVELS = ["Very Low", "Low", "Normal", "High", "Excellent"];

// Shared 1-5 segmented control (Mood/Energy/Brain Fog/Stress), used on both
// Home (today) and the History day editor (backfilling a past day).
function Segmented({ value, onChange }) {
  return (
    <div
      className={value ? "segmented" : "segmented segmented-empty"}
      style={{ "--seg-count": LEVELS.length, "--seg-index": Math.max(0, value - 1) }}
    >
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

export default Segmented;
