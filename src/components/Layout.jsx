import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import LoadingBar from "./LoadingBar";
import "./Layout.css";

// Routes that get no app chrome — no nav rail, no bottom pill, and no
// constrained content column (these pages center themselves full-bleed).
// Onboarding is included: showing Today/History/Settings before setup is
// finished would invite people to skip out of a half-configured account.
const AUTH_ROUTES = ["/login", "/register", "/onboarding"];

function Layout({ children }) {
  const { pathname } = useLocation();
  const isAuth = AUTH_ROUTES.includes(pathname);

  return (
    <div className={isAuth ? "app-shell full-app app-shell-auth" : "app-shell full-app"}>
      <LoadingBar />
      {!isAuth && <Navbar />}
      <main key={pathname} className="page-fade">{children}</main>
    </div>
  );
}

export default Layout;
