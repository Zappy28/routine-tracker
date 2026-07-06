import { useState } from "react";
import {
    signInWithEmailAndPassword,
    signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "../firebase/Config";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const navigate = useNavigate();

    async function handleLogin(e) {
        e.preventDefault();

        try {
            await signInWithEmailAndPassword(auth, email, password);
            navigate("/");
        } catch {
            setError("Incorrect email or password.");
        }
    }

    async function handleGoogleLogin() {
        try {
            await signInWithPopup(auth, googleProvider);
            navigate("/");
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">

                <h1>Routine Tracker</h1>
                <p>Track your habits. Improve every day.</p>

                <form onSubmit={handleLogin}>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e)=>setEmail(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e)=>setPassword(e.target.value)}
                    />

                    <button className="login-btn">
                        Login
                    </button>

                </form>

                <div className="divider">
                    <span>OR</span>
                </div>

                <button
                    className="google-btn"
                    onClick={handleGoogleLogin}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt=""
                    />
                    Continue with Google
                </button>

                {error && <p className="error">{error}</p>}

                <p className="bottom-text">
                    Don't have an account?
                    <Link to="/register"> Create one</Link>
                </p>

            </div>
        </div>
    );
}