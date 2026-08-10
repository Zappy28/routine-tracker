import RatingSlider from "./RatingSlider";
import { formatMetricDisplay } from "../utils/metrics";

// Renders the right control for a metric's type. Deliberately reuses the
// controls the app already has (RatingSlider, .toggle-pill, .stepper-inline)
// rather than introducing a new visual language per type.
function MetricInput({ metric, value, onChange }) {
  if (metric.type === "toggle") {
    const on = value === true;
    return (
      <div className="metric-row-flat">
        <span className="metric-label">{metric.label}</span>
        <button
          type="button"
          className={on ? "toggle-pill done" : "toggle-pill"}
          onClick={() => onChange(!on)}
        >
          {on ? "Yes" : "No"}
        </button>
      </div>
    );
  }

  if (metric.type === "count") {
    const step = metric.step ?? 1;
    // First tap jumps to a sensible starting point (e.g. 150 lbs) rather than
    // making someone press + a hundred times; after that it steps normally.
    const seed = metric.seed ?? 0;
    const has = typeof value === "number";
    const bump = delta => {
      if (!has) return onChange(delta > 0 ? seed : Math.max(0, seed - step));
      onChange(Math.max(0, value + delta));
    };

    return (
      <div>
        <div className="metric-top">
          <span className="metric-label">{metric.label}</span>
          <span className="metric-value-lg">{formatMetricDisplay(metric, value)}</span>
        </div>
        <div className="stepper-inline">
          <button type="button" onClick={() => bump(-step)}>−</button>
          <button type="button" onClick={() => bump(step)}>+</button>
        </div>
      </div>
    );
  }

  // Default: 1-10 scale.
  return (
    <RatingSlider
      label={metric.label}
      value={typeof value === "number" ? value : 0}
      onChange={onChange}
    />
  );
}

export default MetricInput;
