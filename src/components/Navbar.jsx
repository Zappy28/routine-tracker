import { Link, useLocation } from "react-router-dom";
import "./Navbar.css";

const links = [
  { to: "/", label: "Today", icon: "○" },
  { to: "/history", label: "History", icon: "▤" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

function Navbar() {
  const { pathname } = useLocation();

  return (
    <>
      <aside className="nav nav-sidebar">
        <span className="nav-brand">Routine Track</span>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${pathname === link.to ? "active" : ""}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </aside>

      <nav className="nav nav-bottom">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${pathname === link.to ? "active" : ""}`}
          >
            <span className="nav-icon">{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </nav>
    </>
  );
}

export default Navbar;