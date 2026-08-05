import { useLoadingBar } from "../context/useLoadingBar";
import "./LoadingBar.css";

function LoadingBar() {
  const { active } = useLoadingBar();
  return (
    <div className={active ? "loading-bar active" : "loading-bar"} aria-hidden="true">
      <div className="loading-bar-fill" />
    </div>
  );
}

export default LoadingBar;
