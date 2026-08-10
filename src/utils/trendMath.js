// Pure helpers shared by TrendsView (overlay + summary list) and MetricDetail.
// No React here — keeps the math testable/reusable independent of rendering.

// Chart descriptors are derived from the user's own metric list rather than a
// fixed constant. Sleep is appended because it's a permanent field that lives
// outside the metric system but still belongs on the charts.
//
// `relative: true` means "normalize against this metric's own observed range"
// — used for counts and weight, which have no fixed ceiling.
export function buildChartMetrics(userMetrics = []) {
  const fromUser = userMetrics.map(m => {
    if (m.type === "toggle") {
      return { key: m.id, label: m.label, unit: "", max: 1, kind: "toggle" };
    }
    if (m.type === "count") {
      return {
        key: m.id,
        label: m.label,
        unit: m.unit ? ` ${m.unit}` : "",
        relative: true,
        kind: "count"
      };
    }
    return { key: m.id, label: m.label, unit: "/10", max: 10, kind: "scale" };
  });

  return [...fromUser, { key: "sleep", label: "Sleep", unit: "h", max: 12, kind: "scale" }];
}

export function metricByKey(metrics, key) {
  return metrics.find(m => m.key === key);
}

// 0 is the app's "not logged" sentinel for the 1-10 scales, so treat it as a gap.
// Weight/sleep are never legitimately 0 either, so the same rule is safe app-wide.
export function hasValue(v, metric) {
  if (v === undefined || v === null) return false;
  // For counts and toggles, 0 is a genuine measurement, not "unset".
  if (metric && (metric.kind === "count" || metric.kind === "toggle")) return true;
  return v !== undefined && v !== null && v !== 0;
}

export function formatMetricValue(metric, value) {
  if (!hasValue(value)) return "—";
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${metric.unit}`;
}

// Like formatMetricValue, but for axis/gridline labels where 0 is a real
// position on the scale rather than the "not logged" sentinel.
export function formatAxisValue(metric, value) {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded}${metric.unit}`;
}

// Normalize a raw value to 0-1 for the shared overlay space.
// Fixed-scale metrics (1-5, sleep) divide by their max; weight normalizes
// against its own min/max across the visible range since it has no natural ceiling.
export function normalizeValue(metrics, key, raw, chartDays) {
  const metric = metricByKey(metrics, key);
  if (!hasValue(raw)) return null;

  if (!metric.relative) {
    return Math.max(0, Math.min(1, raw / metric.max));
  }

  const values = chartDays.map(d => d[key]).filter(hasValue);
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max === min) return 0.5;
  return (raw - min) / (max - min);
}

export function normalize(metrics, day, key, chartDays) {
  return normalizeValue(metrics, key, day[key], chartDays);
}

// Trailing moving average over however many non-missing values fall in the
// window — doesn't require exactly `windowDays` values to be present.
export function movingAverage(days, key, windowDays = 7) {
  return days.map((_, i) => {
    const windowStart = Math.max(0, i - windowDays + 1);
    const slice = days.slice(windowStart, i + 1).map(d => d[key]).filter(hasValue);
    if (slice.length === 0) return null;
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
}

// Builds gap-broken polyline point segments for an SVG chart. `valueFn(day, i)`
// returns a normalized (0-1) y-value or null/undefined to break the line.
export function buildSegments(days, valueFn, xFor, height) {
  const segments = [];
  let current = [];
  days.forEach((day, i) => {
    const norm = valueFn(day, i);
    if (norm === null || norm === undefined) {
      if (current.length) segments.push(current);
      current = [];
      return;
    }
    current.push(`${xFor(i)},${height - norm * height}`);
  });
  if (current.length) segments.push(current);
  return segments;
}

export function filterRange(days, rangeDays) {
  return [...days].sort((a, b) => a.id.localeCompare(b.id)).slice(-rangeDays);
}

// Trailing 7-day average vs. the prior 7-day average — independent of whatever
// lookback range a chart is currently showing, so every summary row reads
// consistently as "vs last week."
export function periodDelta(days, key) {
  const sorted = [...days].sort((a, b) => a.id.localeCompare(b.id));
  const last14 = sorted.slice(-14);
  const current = last14.slice(-7).map(d => d[key]).filter(hasValue);
  const previous = last14.slice(0, -7).map(d => d[key]).filter(hasValue);
  if (current.length === 0 || previous.length === 0) return null;
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const currentAvg = avg(current);
  const previousAvg = avg(previous);
  return { currentAvg, previousAvg, delta: currentAvg - previousAvg };
}

export function lastValue(days, key) {
  const sorted = [...days].sort((a, b) => a.id.localeCompare(b.id));
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (hasValue(sorted[i][key])) return sorted[i][key];
  }
  return null;
}

export function medsFullyTaken(day, medications) {
  if (!day || medications.length === 0) return null;
  return medications.every(m => day.takenToday?.[m.id]);
}

// Current consecutive-day streak of full medication adherence, counting back
// from the most recent logged day.
export function adherenceStreak(days, medications) {
  if (medications.length === 0) return 0;
  const sorted = [...days].sort((a, b) => b.id.localeCompare(a.id));
  let streak = 0;
  for (const day of sorted) {
    if (medsFullyTaken(day, medications)) streak++;
    else break;
  }
  return streak;
}

// --- Insight generators. Each returns a string or null if not applicable. ---

export function adherenceComparisonInsight(metrics, days, medications, metricKey) {
  if (medications.length === 0) return null;
  const metric = metricByKey(metrics, metricKey);
  if (!metric) return null;
  const full = [];
  const partial = [];
  days.forEach(day => {
    if (!hasValue(day[metricKey])) return;
    const adherent = medsFullyTaken(day, medications);
    (adherent ? full : partial).push(day[metricKey]);
  });
  if (full.length < 3 || partial.length < 3) return null;
  const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
  const fullAvg = avg(full);
  const partialAvg = avg(partial);
  // Threshold doubled alongside the 1-5 -> 1-10 scale change, to require the
  // same relative difference as before.
  if (Math.abs(fullAvg - partialAvg) < 0.8) return null;
  const direction = fullAvg > partialAvg ? "better" : "worse";
  return `${metric.label} tends to be ${direction} on days medication was fully taken (${fullAvg.toFixed(1)} vs ${partialAvg.toFixed(1)}).`;
}

export function streakInsight(days, medications) {
  const streak = adherenceStreak(days, medications);
  if (streak < 3) return null;
  return `You've taken all medications for ${streak} days in a row.`;
}

export function weekOverWeekInsight(metrics, days, metricKey) {
  const metric = metricByKey(metrics, metricKey);
  if (!metric) return null;
  const delta = periodDelta(days, metricKey);
  if (!delta) return null;
  // Same doubling as the adherence-comparison threshold above.
  if (Math.abs(delta.delta) < 0.6) return null;
  const direction = delta.delta > 0 ? "up" : "down";
  return `${metric.label} is ${direction} ${Math.abs(delta.delta).toFixed(1)} this week compared to last (${delta.currentAvg.toFixed(1)} vs ${delta.previousAvg.toFixed(1)}).`;
}

export function bestWorstInsight(metrics, days, metricKey) {
  const metric = metricByKey(metrics, metricKey);
  if (!metric) return null;
  const logged = days.filter(d => hasValue(d[metricKey]));
  if (logged.length < 5) return null;
  const best = logged.reduce((a, b) => (b[metricKey] > a[metricKey] ? b : a));
  const worst = logged.reduce((a, b) => (b[metricKey] < a[metricKey] ? b : a));
  if (best.id === worst.id) return null;
  const fmt = id => new Date(`${id}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `Best ${metric.label.toLowerCase()} day was ${fmt(best.id)} (${formatMetricValue(metric, best[metricKey])}); toughest was ${fmt(worst.id)} (${formatMetricValue(metric, worst[metricKey])}).`;
}
