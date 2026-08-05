import { Link, useLocation } from "react-router-dom";
import { HouseIcon, ClockIcon, GearIcon } from "./NavIcons";
import "./Navbar.css";

const links = [
  { to: "/", label: "Today", glyph: "○", Icon: HouseIcon },
  { to: "/history", label: "History", glyph: "▤", Icon: ClockIcon },
  { to: "/settings", label: "Settings", glyph: "⚙", Icon: GearIcon },
];

function Navbar() {
  const { pathname } = useLocation();
  const activeIndex = Math.max(0, links.findIndex((l) => l.to === pathname));

  return (
    <>
      <aside className="nav nav-sidebar">
        <span className="nav-brand">Waypoint</span>
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${pathname === link.to ? "active" : ""}`}
          >
            <span className="nav-icon">{link.glyph}</span>
            {link.label}
          </Link>
        ))}
      </aside>

      <nav className="nav nav-bottom" style={{ "--nav-count": links.length, "--nav-index": activeIndex }}>
        <div className="nav-bottom-glass">
          {links.map((link) => {
            const { Icon } = link;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`nav-link ${pathname === link.to ? "active" : ""}`}
              >
                <Icon />
                <span className="nav-label">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
