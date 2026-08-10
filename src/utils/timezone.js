// User's timezone preference. Stored in localStorage for instant synchronous
// access (date-key computation can't wait on a Firestore round-trip), and
// mirrored to the Firestore user profile by Settings so it survives across
// devices too.
const STORAGE_KEY = "waypoint:timezone";

export function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function getStoredTimezone() {
  try {
    return localStorage.getItem(STORAGE_KEY) || detectTimezone();
  } catch {
    return detectTimezone();
  }
}

export function setStoredTimezone(tz) {
  try {
    localStorage.setItem(STORAGE_KEY, tz);
  } catch {
    // private browsing / storage disabled — timezone just won't persist locally
  }
}

// Called on account deletion so nothing personal is left behind on the device.
export function clearStoredTimezone() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // nothing to clean up if storage was unavailable in the first place
  }
}

// Curated fallback for browsers without Intl.supportedValuesOf (older Safari).
const COMMON_TIMEZONES = [
  "Pacific/Honolulu", "America/Anchorage", "America/Los_Angeles", "America/Denver",
  "America/Phoenix", "America/Chicago", "America/New_York", "America/Sao_Paulo",
  "UTC", "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
  "Africa/Cairo", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai", "Asia/Tokyo",
  "Asia/Seoul", "Australia/Sydney", "Pacific/Auckland"
];

export function listTimezones() {
  if (typeof Intl.supportedValuesOf === "function") {
    try {
      return Intl.supportedValuesOf("timeZone");
    } catch {
      // fall through
    }
  }
  return COMMON_TIMEZONES;
}

// The current UTC offset label for a zone, e.g. "GMT-6" — helps disambiguate
// similarly-named zones in a long dropdown list.
export function timezoneOffsetLabel(tz, date = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(date);
    const offset = parts.find(p => p.type === "timeZoneName");
    return offset ? offset.value : "";
  } catch {
    return "";
  }
}
