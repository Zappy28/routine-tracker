// User-defined metrics.
//
// Everything a person tracks (other than Sleep and Notes, which are permanent)
// is described by an entry in their `metrics` array on the user document:
//
//   { id, label, type, unit?, step?, seed?, order }
//
// Values live in a `values` map on each day document, keyed by metric id.

export const METRIC_TYPES = {
  // 1-10 rating. 0 doubles as the "not logged" resting position.
  scale: { id: "scale", label: "Scale (1-10)", hint: "Rate from 1 to 10" },
  // Yes / no.
  toggle: { id: "toggle", label: "Yes / No", hint: "Did it happen?" },
  // A number with a unit. 0 is a real value here, not "unset".
  count: { id: "count", label: "Number", hint: "Count or measurement" }
};

export const DEFAULT_STEP = 1;

// Ready-made metrics for the setup screen. Preset ids intentionally reuse the
// original hardcoded field names (mood, energy, brainFog, stress, congestion,
// weight, workout) so historical entries map across without a migration.
export const METRIC_PRESETS = [
  { group: "Mind", items: [
    { id: "mood",       label: "Mood",       type: "scale" },
    { id: "energy",     label: "Energy",     type: "scale" },
    { id: "focus",      label: "Focus",      type: "scale" },
    { id: "motivation", label: "Motivation", type: "scale" },
    { id: "anxiety",    label: "Anxiety",    type: "scale" },
    { id: "brainFog",   label: "Brain Fog",  type: "scale" },
    { id: "stress",     label: "Stress",     type: "scale" }
  ]},
  { group: "Body", items: [
    { id: "pain",       label: "Pain",       type: "scale" },
    { id: "headache",   label: "Headache",   type: "scale" },
    { id: "nausea",     label: "Nausea",     type: "scale" },
    { id: "congestion", label: "Congestion", type: "scale" },
    { id: "digestion",  label: "IBS / Digestion", type: "scale" },
    { id: "soreness",   label: "Soreness",   type: "scale" },
    { id: "weight",     label: "Weight",     type: "count", unit: "lbs", seed: 150 }
  ]},
  { group: "Habits", items: [
    { id: "workout",    label: "Workout",    type: "toggle" },
    { id: "meditation", label: "Meditation", type: "toggle" },
    { id: "outside",    label: "Went Outside", type: "toggle" },
    { id: "water",      label: "Water",      type: "count", unit: "glasses", seed: 1 },
    { id: "caffeine",   label: "Caffeine",   type: "count", unit: "drinks", seed: 1 },
    { id: "alcohol",    label: "Alcohol",    type: "count", unit: "drinks", seed: 1 }
  ]}
];

// What a brand-new account starts with if they skip the picker, and what an
// existing pre-metrics account gets seeded with so nothing changes for them.
export const DEFAULT_METRIC_IDS = [
  "mood", "energy", "brainFog", "stress", "congestion", "weight", "workout"
];

export function findPreset(id) {
  for (const g of METRIC_PRESETS) {
    const hit = g.items.find(i => i.id === id);
    if (hit) return hit;
  }
  return null;
}

export function seedDefaultMetrics(ids = DEFAULT_METRIC_IDS) {
  return ids
    .map(findPreset)
    .filter(Boolean)
    .map((preset, order) => ({ ...preset, order }));
}

// Fields that lived at the top level of a day document before metrics became
// user-defined. Kept readable forever so old entries never appear empty.
const LEGACY_VALUE_FIELDS = [
  "mood", "energy", "brainFog", "stress", "congestion", "weight", "workout"
];

// Merges a day document's legacy top-level fields with its modern `values` map.
// `values` wins on conflict, since that's what current code writes.
export function readDayValues(day) {
  if (!day) return {};
  const merged = {};
  for (const key of LEGACY_VALUE_FIELDS) {
    const v = day[key];
    if (v !== undefined && v !== null) merged[key] = v;
  }
  return { ...merged, ...(day.values || {}) };
}

// Flattens a day document into the shape the charting code expects: metric
// values hoisted to the top level (legacy + modern merged), toggles coerced to
// 0/1 so they plot, and the permanent fields carried through untouched.
export function flattenDay(day) {
  const values = readDayValues(day);
  const flat = {};
  for (const [k, v] of Object.entries(values)) {
    flat[k] = typeof v === "boolean" ? (v ? 1 : 0) : v;
  }
  return {
    ...flat,
    id: day.id,
    sleep: day.sleep ?? null,
    notes: day.notes ?? "",
    takenToday: day.takenToday || {}
  };
}

// Is there real data here? Type-aware because 0 means different things:
// on a 1-10 scale it's the resting/unset position, but "0 coffees today" is a
// genuine measurement that must not be silently dropped from charts.
export function hasMetricValue(metric, value) {
  if (value === undefined || value === null) return false;
  if (!metric) return value !== 0;
  switch (metric.type) {
    case "count":  return typeof value === "number";
    case "toggle": return typeof value === "boolean";
    default:       return value !== 0;
  }
}

// Does this count toward "everything logged" on the Today screen? Stricter than
// hasMetricValue — an unchecked toggle is data, but it isn't a completed entry.
export function isMetricLogged(metric, value) {
  if (value === undefined || value === null) return false;
  switch (metric?.type) {
    case "count":  return typeof value === "number";
    case "toggle": return value === true;
    default:       return typeof value === "number" && value > 0;
  }
}

// Numeric form for charting. Toggles plot as 0/1.
export function metricNumericValue(metric, value) {
  if (!hasMetricValue(metric, value)) return null;
  if (metric?.type === "toggle") return value ? 1 : 0;
  return typeof value === "number" ? value : null;
}

export function metricMax(metric) {
  if (metric?.type === "scale") return 10;
  if (metric?.type === "toggle") return 1;
  return null; // count metrics normalize against their own observed range
}

export function formatMetricDisplay(metric, value) {
  if (!hasMetricValue(metric, value)) return "—";
  switch (metric.type) {
    case "toggle": return value ? "Yes" : "No";
    case "count":  return metric.unit ? `${value} ${metric.unit}` : String(value);
    default:       return `${value}/10`;
  }
}

export function emptyValueFor(metric) {
  return metric.type === "toggle" ? false : metric.type === "count" ? null : 0;
}

// Turns a user-typed label into a stable id, avoiding collisions with existing
// metrics, presets, and the reserved day-document field names.
const RESERVED_IDS = new Set([
  "date", "notes", "values", "takenToday", "updatedAt",
  "sleep", "bedMinutes", "wakeMinutes", "id"
]);

export function makeMetricId(label, existing = []) {
  const base =
    label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") ||
    "metric";
  const taken = new Set([...existing.map(m => m.id), ...RESERVED_IDS]);
  if (!taken.has(base)) return base;
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

export function sortMetrics(metrics = []) {
  return [...metrics].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
}
