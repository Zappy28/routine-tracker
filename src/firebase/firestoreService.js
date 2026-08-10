import { db } from "./Config";
import {
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  writeBatch,
  collection,
  getDocs,
  query,
  limit,
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

// --- Tracked metrics (user-defined) ---

export async function saveMetrics(uid, metrics) {
  const ref = doc(db, "users", uid);
  await setDoc(ref, { metrics }, { merge: true });
}

export async function getMetrics(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() && snap.data().metrics ? snap.data().metrics : null;
}

// Cheap existence probe used by the onboarding gate: an account with entries but
// no metric list predates custom metrics and should be seeded silently rather
// than pushed through setup.
export async function hasAnyDayEntries(uid) {
  const snap = await getDocs(query(collection(db, "users", uid, "days"), limit(1)));
  return !snap.empty;
}

// --- Data portability / erasure ---

// Everything stored about this user, for the Settings export button.
export async function exportAllUserData(uid) {
  const [profile, days] = await Promise.all([
    getUserProfile(uid),
    getHistory(uid)
  ]);
  return { profile: profile || {}, days };
}

// Firestore batches cap at 500 writes; stay comfortably under.
const DELETE_BATCH_SIZE = 400;

// Permanently removes every document belonging to this user.
//
// Deleting /users/{uid} does NOT cascade to its `days` subcollection — Firestore
// subcollections live independently of their parent document. Deleting only the
// parent would leave every daily entry stranded in the database: still stored,
// still billable, and still the user's personal data despite them having asked
// for it to be erased. So the day documents are deleted explicitly first.
export async function deleteAllUserData(uid) {
  const daysSnap = await getDocs(collection(db, "users", uid, "days"));
  const dayDocs = daysSnap.docs;

  for (let i = 0; i < dayDocs.length; i += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    dayDocs.slice(i, i + DELETE_BATCH_SIZE).forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  await deleteDoc(doc(db, "users", uid));
  return dayDocs.length;
}
