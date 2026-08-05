import { useMemo, useRef, useState } from "react";
import {
  metricByKey,
  hasValue,
  formatMetricValue,
  formatAxisValue,
  movingAverage,
  buildSegments,
  filterRange,
  periodDelta,
  medsFullyTaken,
  adherenceComparisonInsight,
  weekOverWeekInsight
} from "../utils/trendMath";

const RANGES = [
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "1Y", days: 365 }
];

const CHART_W = 340;
const CHART_H = 150;
const PAD_X = 10;

function dateLabel(id) {
  return new Date(`${id}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function MetricDetail({ metricKey, days, medications, initialRange, onBack }) {
  const metric = metricByKey(metricKey);
  const [range, setRange] = useState(initialRange || "3M");
  const [showMedBand, setShowMedBand] = useState(false);
  const [inspectIndex, setInspectIndex] = useState(null);
  const svgRef = useRef(null);

  const rangeDays = RANGES.find(r => r.key === range).days;
  const chartDays = useMemo(() => filterRange(days, rangeDays), [days, rangeDays]);
  const n = chartDays.length;
  const xFor = i => (n <= 1 ? CHART_W / 2 : PAD_X + (i * (CHART_W - PAD_X * 2)) / (n - 1));

  const loggedValues = useMemo(
    () => chartDays.map(d => d[metricKey]).filter(hasValue),
    [chartDays, metricKey]
  );

  const domain = useMemo(() => {
    if (!metric.relative) return { min: 0, max: metric.max };
    if (loggedValues.length === 0) return { min: 0, max: 1 };
    const min = Math.min(...loggedValues);
    const max = Math.max(...loggedValues);
    if (min === max) return { min: min - 1, max: max + 1 };
    const pad = (max - min) * 0.1;
    return { min: min - pad, max: max + pad };
  }, [metric, loggedValues]);

  const yFor = value => {
    const t = (value - domain.min) / (domain.max - domain.min);
    return CHART_H - Math.max(0, Math.min(1, t)) * CHART_H;
  };

  const smoothed = useMemo(() => movingAverage(chartDays, metricKey, 7), [chartDays, metricKey]);

  const smoothedSegments = useMemo(() => {
    return buildSegments(
      chartDays,
      (day, i) => {
        const v = smoothed[i];
        if (v === null || v === undefined) return null;
        return (v - domain.min) / (domain.max - domain.min);
      },
      xFor,
      CHART_H
    );
  }, [chartDays, smoothed, domain]); // eslint-disable-line react-hooks/exhaustive-deps

  const bands = useMemo(() => {
    if (!showMedBand || medications.length === 0) return [];
    const result = [];
    let start = null;
    chartDays.forEach((day, i) => {
      const full = medsFullyTaken(day, medications);
      if (!full) {
        if (start === null) start = i;
      } else if (start !== null) {
        result.push([start, i - 1]);
        start = null;
      }
    });
    if (start !== null) result.push([start, chartDays.length - 1]);
    return result;
  }, [chartDays, showMedBand, medications]);

  const stats = useMemo(() => {
    if (loggedValues.length === 0) return null;
    const avg = loggedValues.reduce((a, b) => a + b, 0) / loggedValues.length;
    let best = chartDays.find(d => hasValue(d[metricKey]));
    let worst = best;
    chartDays.forEach(d => {
      if (!hasValue(d[metricKey])) return;
      if (d[metricKey] > best[metricKey]) best = d;
      if (d[metricKey] < worst[metricKey]) worst = d;
    });
    return { avg, best, worst };
  }, [chartDays, loggedValues, metricKey]);

  const delta = useMemo(() => periodDelta(days, metricKey), [days, metricKey]);

  const insights = useMemo(() => {
    return [
      adherenceComparisonInsight(chartDays, medications, metricKey),
      weekOverWeekInsight(days, metricKey)
    ].filter(Boolean);
  }, [chartDays, days, medications, metricKey]);

  function handleChartClick(e) {
    if (n === 0 || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * CHART_W;
    let closest = 0;
    let closestDist = Infinity;
    chartDays.forEach((_, i) => {
      const d = Math.abs(xFor(i) - clickX);
      if (d < closestDist) { closestDist = d; closest = i; }
    });
    setInspectIndex(closest);
  }

  const inspectDay = inspectIndex !== null ? chartDays[inspectIndex] : null;

  return (
    <div>
      <div className="metric-detail-header">
        <button className="back-btn" onClick={onBack}>‹ Back</button>
        <span className="metric-detail-title-text">{metric.label}</span>
      </div>

      {n === 0 ? (
        <div className="trend-chart-empty">
          <p className="empty-hint">Not enough data in this range yet.</p>
        </div>
      ) : (
        <>
          <svg
            ref={svgRef}
            className="trend-chart-wrap"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            onClick={handleChartClick}
          >
            {bands.map(([s, e], i) => {
              const x1 = Math.max(0, xFor(s) - 6);
              const x2 = Math.min(CHART_W, xFor(e) + 6);
              return <rect key={i} x={x1} y={0} width={x2 - x1} height={CHART_H} fill="var(--line)" />;
            })}

            <line x1={0} y1={yFor(domain.max)} x2={CHART_W} y2={yFor(domain.max)} stroke="var(--line)" strokeWidth="1" />
            <line x1={0} y1={yFor((domain.min + domain.max) / 2)} x2={CHART_W} y2={yFor((domain.min + domain.max) / 2)} stroke="var(--line)" strokeWidth="1" />
            <line x1={0} y1={yFor(domain.min)} x2={CHART_W} y2={yFor(domain.min)} stroke="var(--line)" strokeWidth="1" />

            {smoothedSegments.map((seg, i) => (
              <polyline
                key={i}
                className="chart-line-draw"
                points={seg.join(" ")}
                fill="none"
                stroke="var(--line-1)"
                strokeWidth="2"
              />
            ))}

            {chartDays.map((day, i) => hasValue(day[metricKey]) && (
              <circle
                key={day.id}
                cx={xFor(i)}
                cy={yFor(day[metricKey])}
                r={i === inspectIndex ? 4 : 2.5}
                fill={i === inspectIndex ? "var(--text-1)" : "var(--text-3)"}
              />
            ))}
          </svg>

          <div className="axis-caption-row">
            <span className="metric-detail-axis-label">{formatAxisValue(metric, domain.max)}</span>
            <span className="metric-detail-axis-label">{formatAxisValue(metric, domain.min)}</span>
          </div>

          {inspectDay && (
            <div className="trend-inspect-card">
              <div className="trend-inspect-date">{dateLabel(inspectDay.id)}</div>
              <div className="trend-inspect-value">{formatMetricValue(metric, inspectDay[metricKey])}</div>
              {medications.length > 0 && (
                <div className="trend-inspect-meds">
                  {medsFullyTaken(inspectDay, medications) ? "All medication taken" : "Medication missed"}
                </div>
              )}
            </div>
          )}

          <div className="chip-row" style={{ marginTop: "var(--sp-3)" }}>
            <span className={showMedBand ? "chip active" : "chip"} onClick={() => setShowMedBand(v => !v)}>
              + Medication
            </span>
          </div>

          <div className="range-row">
            {RANGES.map(r => (
              <button
                key={r.key}
                className={range === r.key ? "range-btn active" : "range-btn"}
                onClick={() => setRange(r.key)}
              >
                {r.key}
              </button>
            ))}
          </div>

          {stats && (
            <div className="day-stat-grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
              <div className="day-stat-card">
                <div className="day-stat-label">Average</div>
                <div className="day-stat-value">{formatMetricValue(metric, Math.round(stats.avg * 10) / 10)}</div>
              </div>
              <div className="day-stat-card">
                <div className="day-stat-label">Best</div>
                <div className="day-stat-value">{formatMetricValue(metric, stats.best[metricKey])}</div>
              </div>
              <div className="day-stat-card">
                <div className="day-stat-label">Worst</div>
                <div className="day-stat-value">{formatMetricValue(metric, stats.worst[metricKey])}</div>
              </div>
              <div className="day-stat-card">
                <div className="day-stat-label">vs Last Wk</div>
                <div className="day-stat-value" style={{ fontSize: 15 }}>
                  {delta ? (delta.delta > 0 ? "▲" : delta.delta < 0 ? "▼" : "–") : "—"}
                </div>
              </div>
            </div>
          )}

          {insights.map((text, i) => (
            <div
              className="insight-card stagger-in"
              key={i}
              style={{ marginTop: i === 0 ? 0 : "var(--sp-3)", animationDelay: `${i * 60}ms` }}
            >
              <div className="insight-title">Insight</div>
              <div className="insight-body">{text}</div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default MetricDetail;
