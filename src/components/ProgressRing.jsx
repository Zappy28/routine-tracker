import { useId } from "react";

function ProgressRing({ value, total, size = 68, stroke = 6 }) {
  const gradientId = useId();
  const pct = total > 0 ? Math.min(1, value / total) : 0;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct);
  const complete = total > 0 && value >= total;

  return (
    <div className="progress-ring-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="progress-ring">
        <defs>
          {/* Deep racing green fading into the bold accent green — the same
              two-tone pairing used across the app's Aston Martin-inspired palette. */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-deep)" />
            <stop offset="100%" stopColor="var(--accent)" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} className="progress-ring-track" strokeWidth={stroke} fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          className={complete ? "progress-ring-fill complete" : "progress-ring-fill"}
          strokeWidth={stroke}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="progress-ring-label">
        <span className="progress-ring-value">{value}</span>
        <span className="progress-ring-total">/{total}</span>
      </div>
    </div>
  );
}

export default ProgressRing;
