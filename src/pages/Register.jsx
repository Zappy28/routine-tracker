import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase/Config";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {

    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");

    const navigate = useNavigate();

    async function handleRegister(e){

        e.preventDefault();

        await createUserWithEmailAndPassword(
            auth,
            email,
            password
        );

        navigate("/");
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