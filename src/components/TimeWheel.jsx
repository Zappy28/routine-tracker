import { useLayoutEffect, useMemo, useRef } from "react";
import { formatMinutes, MINUTES_IN_DAY } from "../utils/sleepMath";
import "./TimeWheel.css";

// A vertical scroll picker, like the iOS Timer wheel. Deliberately does NOT
// use CSS scroll-snap — mandatory/proximity snap forces a hard jump to the
// nearest row on every discrete mouse-wheel notch, which feels jumpy and
// imprecise on desktop. Instead scrolling is fully free (smooth and exact on
// both mouse wheel and touch), and a short debounce "settles" the wheel onto
// the nearest row only once scrolling actually stops.
const ITEM_H = 34;
const VISIBLE_ROWS = 5;
const VIEWPORT_H = ITEM_H * VISIBLE_ROWS;
const PAD = (VIEWPORT_H - ITEM_H) / 2;
const STEP = 15; // minutes per row
const SETTLE_DELAY = 140;

function buildValues(rangeStart, rangeSpan) {
  const count = Math.round(rangeSpan / STEP) + 1;
  return Array.from({ length: count }, (_, i) => (rangeStart + i * STEP) % MINUTES_IN_DAY);
}

function nearestIndex(values, minutes) {
  let bestIdx = 0;
  let bestDist = Infinity;
  values.forEach((v, i) => {
    const raw = Math.abs(v - minutes);
    const d = Math.min(raw, MINUTES_IN_DAY - raw);
    if (d < bestDist) { bestDist = d; bestIdx = i; }
  });
  return bestIdx;
}

function TimeWheel({ label, minutes, onChange, accentVar, dim, rangeStart = 0, rangeSpan = MINUTES_IN_DAY - STEP }) {
  const trackRef = useRef(null);
  const settleTimer = useRef(null);

  const values = useMemo(() => buildValues(rangeStart, rangeSpan), [rangeStart, rangeSpan]);

  // Scroll to the loaded value on mount only — after that, the wheel's own
  // scroll position is the source of truth, driven purely by the user.
  useLayoutEffect(() => {
    const idx = nearestIndex(values, minutes);
    if (trackRef.current) {
      trackRef.current.scrollTop = idx * ITEM_H;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll(e) {
    const raw = Math.round(e.target.scrollTop / ITEM_H);
    const idx = Math.max(0, Math.min(values.length - 1, raw));
    onChange(values[idx]);

    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      trackRef.current?.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }, SETTLE_DELAY);
  }

  return (
    <div className={dim ? "time-wheel dim" : "time-wheel"}>
      <div className="time-wheel-viewport" style={{ height: VIEWPORT_H }}>
        <div className="time-wheel-track" ref={trackRef} onScroll={handleScroll}>
          <div className="time-wheel-pad" style={{ height: PAD }} />
          {values.map(v => (
            <div key={v} className="time-wheel-item" style={{ height: ITEM_H }}>
              {formatMinutes(v)}
            </div>
          ))}
          <div className="time-wheel-pad" style={{ height: PAD }} />
        </div>
        <div
          className="time-wheel-selection"
          style={{ height: ITEM_H, borderColor: `var(${accentVar})` }}
        />
      </div>
      <div className="time-wheel-label">{label}</div>
    </div>
  );
}

export default TimeWheel;
