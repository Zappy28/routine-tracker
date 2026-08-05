import { db } from "./Config";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  serverTimestamp
} from "firebase/firestore";
import { getStoredTimezone } from "../utils/timezone";

// Use a normalized date key like "2026-08-03" instead of a display string,
// so days sort correctly and never collide.
//
// Computed in a specific IANA timezone (the user's selected/detected zone by
// default) rather than UTC — a previous version used `date.toISOString()`,
// which always converts to UTC first. For anyone west of UTC that silently
// rolled the date over to "tomorrow" in the evening, well before local
// midnight (e.g. ~6-7pm in US Mountain time).
export function getDateKey(date = new Date(), timeZone = getStoredTimezone()) {
  // en-CA locale formats as YYYY-MM-DD, which is exactly the key shape we want.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(date);
}

// --- Today's entry ---

export async function saveDayEntry(uid, dateKey, data) {
  const ref = doc(db, "users", uid, "days", dateKey);
  await setDoc(
    ref,
    { ...data, updatedAt: serverTimestamp() },
    { merge: true } // merge so partial updates don't wipe other fields
  );
}

export async function getDayEntry(uid, dateKey) {
  const ref = doc(db, "users", uid, "days", dateKey);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// --- History (all past days) ---

export async function getHistory(uid) {
  const ref = collection(db, "users", uid, "days");
  const snap = await getDocs(ref); // no orderBy, no index needed
  const days = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return days.sort((a, b) => b.id.localeCompare(a.id)); // newest first, by dateKey string
}

// --- User profile ---

export async function saveUserProfile(uid, data) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, data, { merge: true });
}

export async function getUserProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}

// --- Medications (persistent list, not tied to a specific day) ---

export async function saveMedications(uid, medications) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { medications }, { merge: true });
}

export async function getMedications(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() && snap.data().medications ? snap.data().medications : [];
}
