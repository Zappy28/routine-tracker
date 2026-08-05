import { useContext } from "react";
import { LoadingBarContext } from "./loadingBarContextValue";

export function useLoadingBar() {
  const ctx = useContext(LoadingBarContext);
  if (!ctx) throw new Error("useLoadingBar must be used within LoadingBarProvider");
  return ctx;
}
