import { useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import LoadingBar from "./LoadingBar";
import "./Layout.css";

function Layout({ children }) {
  const { pathname } = useLocation();

  return (
    <div className="app-shell full-app">
      <LoadingBar />
      <Navbar />
      <main key={pathname} className="page-fade">{children}</main>
    </div>
  );
}

export default Layout;
