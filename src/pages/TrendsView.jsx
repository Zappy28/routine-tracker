import { useMemo, useRef, useState } from "react";
import MetricDetail from "./MetricDetail";
import {
  buildChartMetrics,
  hasValue,
  normalize,
  normalizeValue,
  movingAverage,
  buildSegments,
  filterRange,
  periodDelta,
  lastValue,
  formatMetricValue,
  medsFullyTaken,
  streakInsight,
  weekOverWeekInsight,
  adherenceComparisonInsight,
  bestWorstInsight
} from "../utils/trendMath";
import { flattenDay } from "../utils/metrics";

const RANGES = [
  { key: "1M", days: 30 },
  { key: "3M", days: 90 },
  { key: "1Y", days: 365 }
];

const MAX_LINES = 3;
const CHART_W = 340;
const CHART_H = 150;
const PAD_X = 10;
const SPARK_W = 64;
const SPARK_H = 22;

function dateLabel(id) {
  return new Date(`${id}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function Sparkline({ metrics, days, metricKey }) {
  const xFor = i => (days.length <= 1 ? SPARK_W / 2 : (i * SPARK_W) / (days.length - 1));
  const segments = useMemo(
    () => buildSegments(days, day => normalize(metrics, day, metricKey, days), xFor, SPARK_H),
    [metrics, days, metricKey] // eslint-disable-line react-hooks/exhaustive-deps
  );
  if (segments.length === 0) {
    return <svg className="trend-summary-sparkline" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} />;
  }
  return (
    <svg className="trend-summary-sparkline" viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}>
      {segments.map((seg, i) => (
        <polyline key={i} points={seg.join(" ")} fill="none" stroke="var(--text-3)" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function TrendsView({ days: rawDays, medications, metrics: userMetrics = [] }) {
  // Chart descriptors derived from the user's own metric list, and day docs
  // flattened so legacy + modern shapes both read the same way.
  const METRICS = useMemo(() => buildChartMetrics(userMetrics), [userMetrics]);
  const days = useMemo(() => rawDays.map(flattenDay), [rawDays]);

  // null means "user hasn't chosen yet" — the default is derived from whichever
  // metrics they actually track, rather than the old hardcoded mood/stress.
  const [selected, setSelected] = useState(null);
  const [showMedBand, setShowMedBand] = useState(false);
  const [range, setRange] = useState("3M");
  const [smoothed, setSmoothed] = useState(true);
  const [inspectIndex, setInspectIndex] = useState(null);
  const [detailMetric, setDetailMetric] = useState(null);
  const svgRef = useRef(null);

  const defaultSelection = useMemo(() => METRICS.slice(0, 2).map(m => m.key), [METRICS]);
  const activeKeys = selected ?? defaultSelection;

  const rangeDays = RANGES.find(r => r.key === range).days;
  const chartDays = useMemo(() => filterRange(days, rangeDays), [days, rangeDays]);
  const n = chartDays.length;
  const xFor = i => (n <= 1 ? CHART_W / 2 : PAD_X + (i * (CHART_W - PAD_X * 2)) / (n - 1));

  function toggleMetric(key) {
    setSelected(prev => {
      const base = prev ?? defaultSelection;
      if (base.includes(key)) return base.filter(k => k !== key);
      if (base.length >= MAX_LINES) return base;
      return [...base, key];
    });
  }

  const lines = useMemo(() => {
    return activeKeys.map((key, idx) => {
      const smoothedVals = smoothed ? movingAverage(chartDays, key, 7) : null;
      const valueFn = smoothed
        ? (day, i) => normalizeValue(METRICS, key, smoothedVals[i], chartDays)
        : day => normalize(METRICS, day, key, chartDays);
      const segments = buildSegments(chartDays, valueFn, xFor, CHART_H);
      const last = lastValue(chartDays, key);
      let labelY = null;
      if (segments.length > 0) {
        const lastSeg = segments[segments.length - 1];
        const [, y] = lastSeg[lastSeg.length - 1].split(",").map(Number);
        labelY = y;
      }
      return { key, segments, colorVar: `--line-${idx + 1}`, last, labelY };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeKeys, chartDays, smoothed]);

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

  const primary = activeKeys[0];

  const insights = useMemo(() => {
    if (!primary) return [];
    return [
      streakInsight(days, medications),
      weekOverWeekInsight(METRICS, days, primary),
      adherenceComparisonInsight(METRICS, chartDays, medications, primary),
      bestWorstInsight(METRICS, chartDays, primary)
    ].filter(Boolean).slice(0, 3);
  }, [METRICS, days, chartDays, medications, primary]);

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
  const summaryDays = useMemo(() => filterRange(days, 30), [days]);

  if (detailMetric) {
    return (
      <MetricDetail
        metricKey={detailMetric}
        days={rawDays}
        medications={medications}
        metrics={userMetrics}
        initialRange={range}
        onBack={() => setDetailMetric(null)}
      />
    );
  }

  return (
    <div>
      <div className="chip-row">
        {METRICS.map(m => {
          const idx = activeKeys.indexOf(m.key);
          const active = idx !== -1;
          return (
            <span
              key={m.key}
              className={active ? `chip chip-line-${idx + 1} active` : "chip"}
              onClick={() => toggleMetric(m.key)}
            >
              {m.label}
            </span>
          );
        })}
        <span className={showMedBand ? "chip active" : "chip"} onClick={() => setShowMedBand(v => !v)}>
          + Medication
        </span>
      </div>

      {n === 0 ? (
        <div className="trend-chart-empty">
          <p className="empty-hint">Not enough data in this range yet.</p>
        </div>
      ) : (
        <>
          <svg ref={svgRef} className="trend-chart-wrap" viewBox={`0 0 ${CHART_W} ${CHART_H}`} onClick={handleChartClick}>
            {bands.map(([s, e], i) => {
              const x1 = Math.max(0, xFor(s) - 6);
              const x2 = Math.min(CHART_W, xFor(e) + 6);
              return <rect key={i} x={x1} y={0} width={x2 - x1} height={CHART_H} fill="var(--line)" />;
            })}
            <line x1={0} y1={CHART_H / 2} x2={CHART_W} y2={CHART_H / 2} stroke="var(--line)" strokeWidth="1" />
            {inspectIndex !== null && (
              <line x1={xFor(inspectIndex)} y1={0} x2={xFor(inspectIndex)} y2={CHART_H} stroke="var(--line-strong)" strokeWidth="1" />
            )}
            {lines.map(line =>
              line.segments.map((seg, i) => (
                <polyline
                  key={`${line.key}-${i}`}
                  className="chart-line-draw"
                  points={seg.join(" ")}
                  fill="none"
                  stroke={`var(${line.colorVar})`}
                  strokeWidth="2"
                />
              ))
            )}
            {lines.map(line => {
              const metric = METRICS.find(m => m.key === line.key);
              if (line.labelY === null || !hasValue(line.last)) return null;
              return (
                <text
                  key={`${line.key}-label`}
                  x={CHART_W - 4}
                  y={Math.max(9, Math.min(CHART_H - 2, line.labelY - 4))}
                  textAnchor="end"
                  fontSize="9"
                  fill={`var(${line.colorVar})`}
                >
                  {formatMetricValue(metric, line.last)}
                </text>
              );
            })}
          </svg>

          <div className="axis-caption-row">
            <span className="metric-detail-axis-label">{dateLabel(chartDays[0].id)}</span>
            <button className="smooth-toggle" onClick={() => setSmoothed(v => !v)}>
              {smoothed ? "Smoothed" : "Raw"}
            </button>
            <span className="metric-detail-axis-label">{dateLabel(chartDays[n - 1].id)}</span>
          </div>

          {inspectDay && (
            <div className="trend-inspect-card">
              <div className="trend-inspect-date">{dateLabel(inspectDay.id)}</div>
              {activeKeys.map((key, idx) => {
                const metric = METRICS.find(m => m.key === key);
                return (
                  <div className="trend-inspect-row" key={key}>
                    <span style={{ color: `var(--line-${idx + 1})` }}>{metric.label}</span>
                    <span>{formatMetricValue(metric, inspectDay[key])}</span>
                  </div>
                );
              })}
              {medications.length > 0 && (
                <div className="trend-inspect-meds">
                  {medsFullyTaken(inspectDay, medications) ? "All medication taken" : "Medication missed"}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <div className="range-row">
        {RANGES.map(r => (
          <button key={r.key} className={range === r.key ? "range-btn active" : "range-btn"} onClick={() => setRange(r.key)}>
            {r.key}
          </button>
        ))}
      </div>

      {insights.map((text, i) => (
        <div
          className="insight-card stagger-in"
          key={i}
          style={{ marginBottom: i === insights.length - 1 ? 0 : "var(--sp-2)", animationDelay: `${i * 60}ms` }}
        >
          <div className="insight-title">Insight</div>
          <div className="insight-body">{text}</div>
        </div>
      ))}

      <div className="trend-summary-list">
        <div className="sub-label" style={{ marginTop: "var(--sp-4)" }}>All Metrics</div>
        {METRICS.map((m, i) => {
          const value = lastValue(summaryDays, m.key);
          const delta = periodDelta(days, m.key);
          return (
            <div
              className="trend-summary-row stagger-in"
              key={m.key}
              style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
              onClick={() => setDetailMetric(m.key)}
            >
              <span className="trend-summary-label">{m.label}</span>
              <Sparkline metrics={METRICS} days={summaryDays} metricKey={m.key} />
              <span className="trend-summary-value">{formatMetricValue(m, value)}</span>
              <span className={
                !delta || Math.abs(delta.delta) < 0.05
                  ? "trend-delta flat"
                  : delta.delta > 0 ? "trend-delta up" : "trend-delta down"
              }>
                {!delta ? "–" : Math.abs(delta.delta) < 0.05 ? "–" : delta.delta > 0 ? "▲" : "▼"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TrendsView;
