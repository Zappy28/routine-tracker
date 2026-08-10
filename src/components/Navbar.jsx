import { Link, useLocation } from "react-router-dom";
import { HouseIcon, ClockIcon, GearIcon } from "./NavIcons";
import WaypointMark from "./WaypointMark";
import "./Navbar.css";

const links = [
  { to: "/", label: "Today", Icon: HouseIcon },
  { to: "/history", label: "History", Icon: ClockIcon },
  { to: "/settings", label: "Settings", Icon: GearIcon },
];

function Navbar() {
  const { pathname } = useLocation();
  const activeIndex = Math.max(0, links.findIndex((l) => l.to === pathname));
  const navVars = { "--nav-count": links.length, "--nav-index": activeIndex };

  return (
    <>
      {/* Desktop: vertical glass rail. Same material, icon cross-fade, and
          spring-eased sliding indicator as the mobile pill — just rotated. */}
      <aside className="nav nav-sidebar" style={navVars}>
        <div className="nav-sidebar-glass">
          <div className="nav-brand">
            <WaypointMark size={20} />
            <span className="nav-brand-text">Waypoint</span>
          </div>

          <div className="nav-sidebar-links">
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
        </div>
      </aside>

      <nav className="nav nav-bottom" style={navVars}>
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
