// The app's brand glyph — a location pin, matching the favicon/app-icon set.
// Colors read from the design tokens so it stays in sync with the palette.
function WaypointMark({ size = 18 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect width="100" height="100" rx="22" fill="var(--bg-0)" />
      <path
        d="M50 16 C36 16 25 27.2 25 41 C25 61.5 50 86 50 86 C50 86 75 61.5 75 41 C75 27.2 64 16 50 16 Z"
        fill="var(--accent)"
      />
      <circle cx="50" cy="41" r="11" fill="var(--bg-0)" />
    </svg>
  );
}

export default WaypointMark;
