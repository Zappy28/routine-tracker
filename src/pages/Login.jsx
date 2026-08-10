import { useState } from "react";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/Config";
import { useNavigate, Link } from "react-router-dom";
import { useLoadingBar } from "../context/useLoadingBar";
import AmbientGlow from "../components/AmbientGlow";
import WaypointMark from "../components/WaypointMark";
import "./Dashboard.css";
import "./Auth.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [busy, setBusy] = useState(false);

    const navigate = useNavigate();
    const { start, done } = useLoadingBar();

    async function handleLogin(e) {
        e.preventDefault();

        setError("");
        setBusy(true);
        start();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch {
            setError("Incorrect email or password.");
        } finally {
            setBusy(false);
            done();
        }
    }

    async function handleGoogleLogin() {
        setError("");
        setBusy(true);
        start();
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch (err) {
            console.error(err);
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

                <h1>Welcome back.</h1>
                <p className="auth-sub">Track your habits. Improve every day.</p>

                <form className="auth-form" onSubmit={handleLogin}>
                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            className="auth-input"
                            type="email"
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="auth-field">
                        <label className="auth-label" htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            className="auth-input"
                            type="password"
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <button className="auth-submit" type="submit" disabled={busy}>
                        {busy ? "Signing in…" : "Sign in"}
                    </button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <button
                    className="auth-google-btn"
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={busy}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt=""
                        width="18"
                        height="18"
                    />
                    Continue with Google
                </button>

                {error && <p className="auth-error">{error}</p>}

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>
            </div>
        </div>
    );
}
