// Shared time-of-day tiering — drives both the Home greeting text and the
// ambient background glow color, so the two stay in sync automatically.
import { getStoredTimezone } from "./timezone";

function hourInTimezone(date, timeZone) {
  // hour12: false can report midnight as "24" in some engines/locales —
  // normalize that back to 0.
  const h = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", hour12: false }).format(date),
    10
  );
  return h === 24 ? 0 : h;
}

export function getTimeTier(date = new Date(), timeZone = getStoredTimezone()) {
  const h = hourInTimezone(date, timeZone);
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

const GREETINGS = {
  morning: "Good morning.",
  afternoon: "Good afternoon.",
  evening: "Good evening.",
  night: "Good night."
};

export function getGreeting(tier) {
  return GREETINGS[tier] || GREETINGS.night;
}

// Two ambient-glow colors per tier. Deliberately kept within the app's own
// green + leather-gold palette rather than jumping to unrelated hues
// (previous version used blue/purple/rose here, which fought with the rest
// of the page's colors) — tiers vary mainly in warmth/brightness, not hue.
export const TIER_COLORS = {
  morning: ["#2ee69e", "#e8b84b"],
  afternoon: ["#22d38a", "#1a8f66"],
  evening: ["#1a5c47", "#b17a3f"],
  night: ["#123d30", "#0a2620"]
};
