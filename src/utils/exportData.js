import { formatMinutes } from "./sleepMath";
import { readDayValues } from "./metrics";

// Turns the user's Firestore data into downloadable files.
//
// JSON is the faithful/portable copy (raw stored values, nothing reshaped).
// CSV is the spreadsheet-friendly copy: medication and metric IDs resolved to
// their human labels, times formatted for humans.

export function buildJSON({ profile, days }) {
  return JSON.stringify(
    {
      application: "Waypoint",
      exportedAt: new Date().toISOString(),
      profile,
      dayCount: days.length,
      days
    },
    null,
    2
  );
}

// RFC 4180 escaping: wrap in quotes if the value contains a comma, quote, or
// newline, and double any embedded quotes. Notes are free text, so this is the
// difference between a valid file and a mangled one.
function csvCell(value) {
  if (value === null || value === undefined) return "";
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Columns are derived from the user's own metric list, so a custom metric like
// "IBS" simply appears as its own column. Any metric that was removed but still
// has history is appended after the active ones, so deleting a metric never
// silently drops data from an export.
export function buildCSV({ days, medications = [], metrics = [] }) {
  const perDayValues = new Map(days.map(d => [d.id, readDayValues(d)]));

  const activeIds = metrics.map(m => m.id);
  const seen = new Set(activeIds);
  const retiredIds = [];
  for (const values of perDayValues.values()) {
    for (const key of Object.keys(values)) {
      if (!seen.has(key)) { seen.add(key); retiredIds.push(key); }
    }
  }

  const columns = [
    ...metrics.map(m => ({ id: m.id, label: m.label, type: m.type })),
    ...retiredIds.map(id => ({ id, label: `${id} (removed)`, type: null }))
  ];

  const header = [
    "date",
    "sleepHours",
    "bedtime",
    "wakeTime",
    ...columns.map(c => c.label),
    ...medications.map(m => m.name),
    "notes"
  ];

  // Oldest-first reads more naturally in a spreadsheet than the newest-first
  // order the app uses on screen.
  const ordered = [...days].sort((a, b) => a.id.localeCompare(b.id));

  const rows = ordered.map(day => {
    const values = perDayValues.get(day.id) || {};
    return [
      day.id,
      day.sleep ?? "",
      day.bedMinutes != null ? formatMinutes(day.bedMinutes) : "",
      day.wakeMinutes != null ? formatMinutes(day.wakeMinutes) : "",
      ...columns.map(c => {
        const v = values[c.id];
        if (v === undefined || v === null) return "";
        if (typeof v === "boolean") return v ? "yes" : "no";
        return v;
      }),
      ...medications.map(m => (day.takenToday?.[m.id] ? "taken" : "no")),
      day.notes ?? ""
    ];
  });

  return [header, ...rows].map(r => r.map(csvCell).join(",")).join("\r\n");
}

export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportFilename(extension) {
  const stamp = new Date().toISOString().split("T")[0];
  return `waypoint-export-${stamp}.${extension}`;
}
