import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/Config";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecked(true);
    });
    return unsub;
  }, []);

  if (!checked) return null; // or a spinner
  if (!user) return <Navigate to="/login" replace />;

  return children;
}