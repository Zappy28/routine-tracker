import { useCallback, useRef, useState } from "react";
import { LoadingBarContext } from "./loadingBarContextValue";

// Global top-of-screen loading bar, driven by a simple start/done counter so
// overlapping loads (e.g. auth check + a page's own data fetch) don't hide
// the bar early just because one of them finished first.
export function LoadingBarProvider({ children }) {
  const [active, setActive] = useState(false);
  const count = useRef(0);

  const start = useCallback(() => {
    count.current += 1;
    setActive(true);
  }, []);

  const done = useCallback(() => {
    count.current = Math.max(0, count.current - 1);
    if (count.current === 0) setActive(false);
  }, []);

  return (
    <LoadingBarContext.Provider value={{ active, start, done }}>
      {children}
    </LoadingBarContext.Provider>
  );
}
