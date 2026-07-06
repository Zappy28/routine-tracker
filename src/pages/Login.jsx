import { useState } from "react";
import {
    signInWithEmailAndPassword,
    signInWithPopup
} from "firebase/auth";
import {
    auth,
    googleProvider
} from "../firebase/Config";
import { useNavigate, Link } from "react-router-dom";

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
            setError("Invalid email or password.");
        }
    }
    async function handleGoogleLogin() {
    try {
        const result = await signInWithPopup(auth, googleProvider);

        console.log(result.user);

        navigate("/");
    } catch (error) {
        console.log(error);
        console.log(error.code);
        console.log(error.message);

        alert(error.code);
    }
}

    return (
        <div className="page">
            <h1>Login</h1>

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

                <button type="submit">
                    Login
                </button>
                <button
                    type="button"
                    onClick={handleGoogleLogin}
                >
                    Continue with Google
                </button>

                {error && <p>{error}</p>}
            </form>

            <p>
                Don't have an account?{" "}
                <Link to="/register">Register</Link>
            </p>
        </div>
    );
}