// Shared time-of-day math for the bedtime/wake-time dials.

export const MINUTES_IN_DAY = 1440;
export const DEFAULT_BED_MINUTES = 23 * 60; // 11:00 PM
export const DEFAULT_WAKE_MINUTES = 7 * 60; // 7:00 AM

export function angleForMinutes(min) {
  return (min / MINUTES_IN_DAY) * 360; // 0deg = top = midnight, clockwise
}

export function minutesForAngle(angleDeg) {
  const norm = ((angleDeg % 360) + 360) % 360;
  const raw = (norm / 360) * MINUTES_IN_DAY;
  const snapped = Math.round(raw / 5) * 5; // snap to nearest 5 minutes
  return snapped % MINUTES_IN_DAY;
}

export function formatMinutes(min) {
  const h24 = Math.floor(min / 60);
  const m = min % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(m).padStart(2, "0")} ${period}`;
}

// Duration from bedtime to wake time, always treated as crossing forward in
// time (wraps past midnight when wake <= bed), returned in hours.
export function sleepDurationHours(bedMinutes, wakeMinutes) {
  let diff = wakeMinutes - bedMinutes;
  if (diff <= 0) diff += MINUTES_IN_DAY;
  return Math.round((diff / 60) * 4) / 4; // quarter-hour precision
}

export function formatDuration(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// Legacy days only stored a plain `sleep` hours number. Derive a plausible
// bed/wake pair from it (anchored to the default wake time) so the dials
// have something sensible to show for old entries.
export function deriveBedMinutesFromHours(hours, wakeMinutes = DEFAULT_WAKE_MINUTES) {
  const bed = wakeMinutes - hours * 60;
  return ((Math.round(bed / 5) * 5) % MINUTES_IN_DAY + MINUTES_IN_DAY) % MINUTES_IN_DAY;
}
