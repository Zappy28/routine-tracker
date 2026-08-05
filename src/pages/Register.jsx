import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/Config";
import { useNavigate, Link } from "react-router-dom";
import { useLoadingBar } from "../context/useLoadingBar";

export default function Register() {

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const navigate = useNavigate();
    const { start, done } = useLoadingBar();

    async function handleRegister(e){

        e.preventDefault();

        start();
        try {
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            navigate("/");
        } finally {
            done();
        }
    }

    return (

        <div className="page">

            <h1>Create Account</h1>

            <form onSubmit={handleRegister}>

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
                    Register
                </button>

            </form>

            <p>
                Already have an account?{" "}
                <Link to="/login">Login</Link>
            </p>

        </div>

    );

}