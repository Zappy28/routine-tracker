import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/Config";
import { useNavigate, Link } from "react-router-dom";
import { useLoadingBar } from "../context/useLoadingBar";
import AmbientGlow from "../components/AmbientGlow";
import WaypointMark from "../components/WaypointMark";
import "./Dashboard.css";
import "./Auth.css";

function messageForError(code) {
    switch (code) {
        case "auth/email-already-in-use":
            return "An account with that email already exists.";
        case "auth/invalid-email":
            return "That email address doesn't look right.";
        case "auth/weak-password":
            return "Password should be at least 6 characters.";
        default:
            return "Couldn't create your account. Please try again.";
    }
}

export default function Register() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const navigate = useNavigate();
    const { start, done } = useLoadingBar();

    async function handleRegister(e) {
        e.preventDefault();

        setError("");
        setBusy(true);
        start();
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch (err) {
            // Previously this was unhandled — a failed signup threw and left
            // the form in a stuck state with no feedback.
            setError(messageForError(err?.code));
        } finally {
            setBusy(false);
            done();
        }
    }

    return (
        <div className="auth-page">
            <AmbientGlow />

            <div className="auth-card">
                <div className="auth-brand">
                    <WaypointMark size={24} />
                    <span className="auth-brand-text">Waypoint</span>
                </div>

                <h1>Create your account.</h1>
                <p className="auth-sub">Start tracking your routine today.</p>

                <form className="auth-form" onSubmit={handleRegister}>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="register-email">Email</label>
                        <input
                            id="register-email"
                            className="auth-input"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="register-password">Password</label>
                        <input
                            id="register-password"
                            className="auth-input"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button className="auth-submit" type="submit" disabled={busy}>
                        {busy ? "Creating account…" : "Create account"}
                    </button>
                </form>

                {error && <p className="auth-error">{error}</p>}

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
