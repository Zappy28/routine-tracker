import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signOut,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  EmailAuthProvider
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/Config";
import {
  getMedications,
  saveMedications,
  getUserProfile,
  saveUserProfile,
  exportAllUserData,
  deleteAllUserData,
  getMetrics,
  saveMetrics
} from "../firebase/firestoreService";
import {
  METRIC_PRESETS, METRIC_TYPES, seedDefaultMetrics, sortMetrics, makeMetricId, findPreset
} from "../utils/metrics";
import { useLoadingBar } from "../context/useLoadingBar";
import Skeleton from "../components/Skeleton";
import AmbientGlow from "../components/AmbientGlow";
import {
  getStoredTimezone,
  setStoredTimezone,
  clearStoredTimezone,
  listTimezones,
  timezoneOffsetLabel
} from "../utils/timezone";
import { buildJSON, buildCSV, downloadFile, exportFilename } from "../utils/exportData";
import "./Dashboard.css";
import "./Auth.css";
import "./Settings.css";

const TIMEZONES = listTimezones();

// Typed exactly, to make deletion a deliberate act rather than a stray tap.
const DELETE_PHRASE = "DELETE";

function passwordErrorMessage(code) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    case "auth/weak-password":
      return "New password should be at least 6 characters.";
    default:
      return "Couldn't update your password. Please try again.";
  }
}

function deleteErrorMessage(code) {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Password is incorrect.";
    case "auth/requires-recent-login":
      return "For security, please log out and back in, then try again.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Google confirmation was cancelled — nothing was deleted.";
    case "auth/too-many-requests":
      return "Too many attempts. Try again in a few minutes.";
    default:
      return "Couldn't delete your account. Nothing was changed — please try again.";
  }
}

function Settings() {
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [name, setName] = useState("");
  const [time, setTime] = useState("Morning");
  const [timezone, setTimezone] = useState(getStoredTimezone());
  const [loading, setLoading] = useState(true);
  const { start, done } = useLoadingBar();

  // Only users who signed up with email/password have one to change — a
  // Google-only account has nothing here to reauthenticate against.
  const isPasswordUser = !!auth.currentUser?.providerData?.some(p => p.providerId === "password");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const [metrics, setMetrics] = useState([]);
  const [newMetricLabel, setNewMetricLabel] = useState("");
  const [newMetricType, setNewMetricType] = useState("scale");
  const [newMetricUnit, setNewMetricUnit] = useState("");

  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState("");

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);

  useEffect(() => {
    async function load() {
      const uid = auth.currentUser?.uid;
      if (!uid) { setLoading(false); return; }
      start();
      const [meds, profile, userMetrics] = await Promise.all([
        getMedications(uid),
        getUserProfile(uid),
        getMetrics(uid)
      ]);
      setMedications(meds);
      setMetrics(sortMetrics(userMetrics?.length ? userMetrics : seedDefaultMetrics()));
      if (profile?.timezone) {
        // A previously saved timezone (e.g. from another device) takes
        // precedence over whatever's cached locally.
        setTimezone(profile.timezone);
        setStoredTimezone(profile.timezone);
      }
      setLoading(false);
      done();
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function persist(next) {
    setMedications(next);
    const uid = auth.currentUser?.uid;
    if (uid) await saveMedications(uid, next);
  }

  // --- Tracked metrics ---

  async function persistMetrics(next) {
    // Re-index so `order` always matches the visible position.
    const ordered = next.map((m, i) => ({ ...m, order: i }));
    setMetrics(ordered);
    const uid = auth.currentUser?.uid;
    if (uid) await saveMetrics(uid, ordered);
  }

  function addPresetMetric(presetId) {
    if (metrics.some(m => m.id === presetId)) return;
    const preset = findPreset(presetId);
    if (preset) persistMetrics([...metrics, { ...preset }]);
  }

  function addCustomMetric() {
    const label = newMetricLabel.trim();
    if (!label) return;
    const metric = {
      id: makeMetricId(label, metrics),
      label,
      type: newMetricType
    };
    if (newMetricType === "count" && newMetricUnit.trim()) {
      metric.unit = newMetricUnit.trim();
    }
    persistMetrics([...metrics, metric]);
    setNewMetricLabel("");
    setNewMetricUnit("");
    setNewMetricType("scale");
  }

  function removeMetric(id) {
    persistMetrics(metrics.filter(m => m.id !== id));
  }

  function moveMetric(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= metrics.length) return;
    const next = [...metrics];
    [next[index], next[target]] = [next[target], next[index]];
    persistMetrics(next);
  }

  function addMedication() {
    const trimmed = name.trim();
    if (!trimmed) return;
    persist([...medications, { id: crypto.randomUUID(), name: trimmed, time }]);
    setName("");
    setTime("Morning");
  }

  function deleteMedication(id) {
    persist(medications.filter(m => m.id !== id));
  }

  async function handleTimezoneChange(tz) {
    setTimezone(tz);
    setStoredTimezone(tz);
    const uid = auth.currentUser?.uid;
    if (uid) await saveUserProfile(uid, { timezone: tz });
  }

  async function handleLogout() {
    setLogoutBusy(true);
    try {
      await signOut(auth);
      navigate("/login");
    } finally {
      setLogoutBusy(false);
    }
  }

  async function handleExport(format) {
    setExportError("");
    setExportBusy(true);
    try {
      const uid = auth.currentUser?.uid;
      if (!uid) return;
      const data = await exportAllUserData(uid);

      if (format === "json") {
        downloadFile(exportFilename("json"), buildJSON(data), "application/json");
      } else {
        downloadFile(
          exportFilename("csv"),
          buildCSV({ days: data.days, medications, metrics }),
          "text/csv"
        );
      }
    } catch {
      setExportError("Couldn't build your export. Please try again.");
    } finally {
      setExportBusy(false);
    }
  }

  function closeDelete() {
    setDeleteOpen(false);
    setDeletePhrase("");
    setDeletePassword("");
    setDeleteError("");
  }

  async function handleDeleteAccount(e) {
    e.preventDefault();
    setDeleteError("");
    setDeleteBusy(true);

    try {
      const user = auth.currentUser;
      if (!user) return;

      // Firebase refuses to delete an account on a stale session, so prove
      // identity first — by password, or by re-running the Google popup.
      if (isPasswordUser) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword);
        await reauthenticateWithCredential(user, credential);
      } else {
        await reauthenticateWithPopup(user, googleProvider);
      }

      // Order matters: the Firestore documents must go first, while the account
      // still exists. Security rules key off request.auth.uid, so deleting the
      // auth account first would leave the data permanently unreachable — and
      // therefore permanently undeletable.
      await deleteAllUserData(user.uid);

      clearStoredTimezone();
      await deleteUser(user);
      navigate("/login");
    } catch (err) {
      setDeleteError(deleteErrorMessage(err?.code));
    } finally {
      setDeleteBusy(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");

    if (newPassword.length < 6) {
      setPwError("New password should be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords don't match.");
      return;
    }

    setPwBusy(true);
    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPwSuccess("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPwError(passwordErrorMessage(err?.code));
    } finally {
      setPwBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="routine-page">
        <header className="hero">
          <Skeleton w={70} h={11} />
          <Skeleton w={160} h={26} style={{ margin: "8px 0 16px" }} />
        </header>
        <section className="group">
          <Skeleton h={42} style={{ marginBottom: "var(--sp-4)" }} />
          {[0, 1, 2].map(i => (
            <Skeleton key={i} h={52} style={{ marginBottom: "var(--sp-2)" }} />
          ))}
        </section>
      </div>
    );
  }

  return (
    <div className="routine-page">
      <AmbientGlow />

      <header className="hero">
        <div className="hero-date">Settings</div>
        <h1>Medications</h1>
      </header>

      <section className="group">
        <div className="settings-add-row">
          <input
            className="settings-input"
            type="text"
            placeholder="Medication name"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <select
            className="settings-select"
            value={time}
            onChange={e => setTime(e.target.value)}
          >
            <option>Morning</option>
            <option>Afternoon</option>
            <option>Night</option>
          </select>
          <button className="settings-add-btn" onClick={addMedication}>
            Add
          </button>
        </div>

        {medications.length === 0 && <p className="empty-hint">No medications yet.</p>}

        {medications.map((m, i) => (
          <div
            className="settings-med-row stagger-in"
            key={m.id}
            style={{ animationDelay: `${Math.min(i * 30, 300)}ms` }}
          >
            <div>
              <div className="settings-med-name">{m.name}</div>
              <div className="sub-label" style={{ margin: 0, marginTop: 2 }}>{m.time}</div>
            </div>
            <button className="settings-delete-btn" onClick={() => deleteMedication(m.id)}>
              ✕
            </button>
          </div>
        ))}
      </section>

      <section className="group">
        <h2 className="group-title">What You Track</h2>
        <p className="empty-hint" style={{ marginBottom: "var(--sp-3)" }}>
          These appear on your Today screen, in the order below. Sleep and Notes
          are always tracked. Removing something here stops it being asked for —
          past entries are kept and still included in your export.
        </p>

        {metrics.length === 0 && (
          <p className="empty-hint">Nothing yet — add something below.</p>
        )}

        {metrics.map((m, i) => (
          <div className="settings-metric-row" key={m.id}>
            <div className="settings-metric-main">
              <div className="settings-med-name">{m.label}</div>
              <div className="sub-label" style={{ margin: 0, marginTop: 2 }}>
                {METRIC_TYPES[m.type]?.label || m.type}
                {m.unit ? ` · ${m.unit}` : ""}
              </div>
            </div>
            <div className="settings-metric-actions">
              <button
                className="month-nav-btn"
                onClick={() => moveMetric(i, -1)}
                disabled={i === 0}
                aria-label={`Move ${m.label} up`}
              >↑</button>
              <button
                className="month-nav-btn"
                onClick={() => moveMetric(i, 1)}
                disabled={i === metrics.length - 1}
                aria-label={`Move ${m.label} down`}
              >↓</button>
              <button
                className="settings-delete-btn"
                onClick={() => removeMetric(m.id)}
                aria-label={`Stop tracking ${m.label}`}
              >✕</button>
            </div>
          </div>
        ))}

        <div className="sub-label">Quick add</div>
        {METRIC_PRESETS.map(group => (
          <div key={group.group}>
            <div className="settings-preset-group">{group.group}</div>
            <div className="chip-row settings-preset-row">
              {group.items.map(p => {
                const already = metrics.some(m => m.id === p.id);
                return (
                  <button
                    key={p.id}
                    className={already ? "chip active" : "chip"}
                    disabled={already}
                    onClick={() => addPresetMetric(p.id)}
                  >
                    {already ? "✓ " : "+ "}{p.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <div className="sub-label">Add your own</div>
        <div className="settings-add-row">
          <input
            className="settings-input"
            type="text"
            placeholder="e.g. IBS flare-up"
            value={newMetricLabel}
            onChange={e => setNewMetricLabel(e.target.value)}
          />
          <select
            className="settings-select"
            value={newMetricType}
            onChange={e => setNewMetricType(e.target.value)}
          >
            {Object.values(METRIC_TYPES).map(t => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
          {newMetricType === "count" && (
            <input
              className="settings-input"
              type="text"
              placeholder="Unit (e.g. glasses)"
              value={newMetricUnit}
              onChange={e => setNewMetricUnit(e.target.value)}
            />
          )}
          <button className="settings-add-btn" onClick={addCustomMetric}>Add</button>
        </div>
      </section>

      <section className="group">
        <h2 className="group-title">Timezone</h2>
        <p className="empty-hint" style={{ marginBottom: "var(--sp-3)" }}>
          "Today" rolls over to the next day at midnight in this timezone — this is
          what decides which day your entries get logged under.
        </p>
        <select
          className="settings-select settings-select-full"
          value={timezone}
          onChange={e => handleTimezoneChange(e.target.value)}
        >
          {TIMEZONES.map(tz => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")} ({timezoneOffsetLabel(tz)})
            </option>
          ))}
        </select>
      </section>

      <section className="group">
        <h2 className="group-title">Account</h2>

        {isPasswordUser ? (
          <form className="settings-password-form" onSubmit={handleChangePassword}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="current-password">Current Password</label>
              <input
                id="current-password"
                className="auth-input"
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
              />
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm-password">Confirm New Password</label>
              <input
                id="confirm-password"
                className="auth-input"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>

            {pwError && <p className="auth-error">{pwError}</p>}
            {pwSuccess && <p className="settings-success">{pwSuccess}</p>}

            <button className="settings-add-btn settings-full-btn" type="submit" disabled={pwBusy}>
              {pwBusy ? "Updating…" : "Change Password"}
            </button>
          </form>
        ) : (
          <p className="empty-hint" style={{ marginBottom: "var(--sp-3)" }}>
            You signed in with Google, so there's no separate app password to change here.
          </p>
        )}

        <button className="settings-logout-btn" onClick={handleLogout} disabled={logoutBusy}>
          {logoutBusy ? "Logging out…" : "Log Out"}
        </button>
      </section>

      <section className="group">
        <h2 className="group-title">Your Data</h2>
        <p className="empty-hint" style={{ marginBottom: "var(--sp-3)" }}>
          Download everything Waypoint has stored about you. JSON keeps the exact
          values for moving to another app; CSV opens directly in a spreadsheet.
        </p>

        <div className="settings-export-row">
          <button
            className="settings-export-btn"
            onClick={() => handleExport("json")}
            disabled={exportBusy}
          >
            {exportBusy ? "Preparing…" : "Export JSON"}
          </button>
          <button
            className="settings-export-btn"
            onClick={() => handleExport("csv")}
            disabled={exportBusy}
          >
            {exportBusy ? "Preparing…" : "Export CSV"}
          </button>
        </div>

        {exportError && <p className="auth-error">{exportError}</p>}
      </section>

      <section className="group settings-danger">
        <h2 className="group-title settings-danger-title">Delete Account</h2>

        {!deleteOpen ? (
          <>
            <p className="empty-hint" style={{ marginBottom: "var(--sp-3)" }}>
              Permanently erases your account and every entry you've logged. This
              cannot be undone — export your data first if you want to keep it.
            </p>
            <button className="settings-danger-btn" onClick={() => setDeleteOpen(true)}>
              Delete My Account
            </button>
          </>
        ) : (
          <form className="settings-password-form" onSubmit={handleDeleteAccount}>
            <p className="settings-danger-warning">
              This will permanently delete your profile, medication list, and all{" "}
              daily entries. There is no way to recover them.
            </p>

            <div className="auth-field">
              <label className="auth-label" htmlFor="delete-phrase">
                Type {DELETE_PHRASE} to confirm
              </label>
              <input
                id="delete-phrase"
                className="auth-input"
                type="text"
                autoComplete="off"
                value={deletePhrase}
                onChange={e => setDeletePhrase(e.target.value)}
              />
            </div>

            {isPasswordUser && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="delete-password">Your Password</label>
                <input
                  id="delete-password"
                  className="auth-input"
                  type="password"
                  autoComplete="current-password"
                  value={deletePassword}
                  onChange={e => setDeletePassword(e.target.value)}
                />
              </div>
            )}

            {!isPasswordUser && (
              <p className="empty-hint">
                You'll be asked to confirm with Google before anything is deleted.
              </p>
            )}

            {deleteError && <p className="auth-error">{deleteError}</p>}

            <div className="editor-actions">
              <button
                className="editor-cancel-btn"
                type="button"
                onClick={closeDelete}
                disabled={deleteBusy}
              >
                Cancel
              </button>
              <button
                className="settings-danger-btn"
                type="submit"
                disabled={
                  deleteBusy ||
                  deletePhrase !== DELETE_PHRASE ||
                  (isPasswordUser && !deletePassword)
                }
              >
                {deleteBusy ? "Deleting…" : "Permanently Delete"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

export default Settings;
