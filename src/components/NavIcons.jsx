// Hand-authored icon set (no icon font/library — keeps this at zero added
// weight). Each icon stacks an outline + filled SVG; Navbar.css cross-fades
// between them based on the parent .nav-link's active state.

function IconSwap({ outline, filled }) {
  return (
    <span className="nav-icon-swap">
      <svg className="icon-outline" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {outline}
      </svg>
      <svg className="icon-filled" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {filled}
      </svg>
    </span>
  );
}

export function HouseIcon() {
  return (
    <IconSwap
      outline={
        <path
          d="M4 11.2 12 4.5l8 6.7V19a1 1 0 0 1-1 1h-3.5v-6h-7v6H5a1 1 0 0 1-1-1v-7.8Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      }
      filled={
        <path
          d="M12 3.3 3 10.8V19a2 2 0 0 0 2 2h4v-6.5h6V21h4a2 2 0 0 0 2-2v-8.2L12 3.3Z"
          fill="currentColor"
        />
      }
    />
  );
}

export function ClockIcon() {
  return (
    <IconSwap
      outline={
        <>
          <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
          <path d="M12 7.8V12l3 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </>
      }
      filled={
        <>
          <circle cx="12" cy="12" r="9" fill="currentColor" />
          <path d="M12 7.5V12.2l3.2 1.9" stroke="var(--nav-glass-bg, #0b0c0d)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </>
      }
    />
  );
}

export function GearIcon() {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <IconSwap
      outline={
        <>
          {teeth.map(deg => (
            <rect key={deg} x="11" y="1.3" width="2" height="3.6" rx="1" fill="currentColor" transform={`rotate(${deg} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="6.4" stroke="currentColor" strokeWidth="1.8" />
          <circle cx="12" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.6" />
        </>
      }
      filled={
        <>
          {teeth.map(deg => (
            <rect key={deg} x="11" y="1" width="2" height="4.2" rx="1" fill="currentColor" transform={`rotate(${deg} 12 12)`} />
          ))}
          <circle cx="12" cy="12" r="7" fill="currentColor" />
          <circle cx="12" cy="12" r="2.6" fill="var(--nav-glass-bg, #0b0c0d)" />
        </>
      }
    />
  );
}
