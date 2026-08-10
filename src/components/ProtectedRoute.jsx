import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/Config";
import { getMetrics, hasAnyDayEntries, saveMetrics } from "../firebase/firestoreService";
import { seedDefaultMetrics } from "../utils/metrics";
import { useLoadingBar } from "../context/useLoadingBar";

// `requireOnboarding` is off for the onboarding route itself, otherwise it
// would redirect to itself forever.
export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { start, done } = useLoadingBar();

  useEffect(() => {
    start();
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);

      if (u && requireOnboarding) {
        const metrics = await getMetrics(u.uid);

        if (!metrics?.length) {
          // No metric list yet. Two very different situations:
          //
          //  - An account that already has entries predates custom metrics.
          //    Seed it with the original defaults so nothing changes for them,
          //    and never show setup — being dumped into onboarding after
          //    months of use would be alarming and pointless.
          //  - A genuinely new account has nothing, so run setup.
          const hasHistory = await hasAnyDayEntries(u.uid);
          if (hasHistory) {
            await saveMetrics(u.uid, seedDefaultMetrics());
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true);
          }
        } else {
          setNeedsOnboarding(false);
        }
      }

      setChecked(true);
      done();
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) return null; // top loading bar covers this brief gap
  if (!user) return <Navigate to="/login" replace />;
  if (requireOnboarding && needsOnboarding) return <Navigate to="/onboarding" replace />;

  return children;
}
