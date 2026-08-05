import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/Config";
import { useLoadingBar } from "../context/useLoadingBar";

export default function ProtectedRoute({ children }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const { start, done } = useLoadingBar();

  useEffect(() => {
    start();
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecked(true);
      done();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null; // top loading bar covers this brief gap
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
