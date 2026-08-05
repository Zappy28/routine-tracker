import { useMemo } from "react";
import { getTimeTier, TIER_COLORS } from "../utils/timeOfDay";

// Two soft, blurred color blobs drifting behind the page, tinted by time of
// day. Self-computes its tier by default; pages that already need the tier
// for something else (Home needs it for the greeting + TimeWheel accent) can
// pass color1/color2 down instead of computing it twice.
function AmbientGlow({ color1, color2 }) {
  const [tc1, tc2] = useMemo(() => {
    if (color1 && color2) return [color1, color2];
    return TIER_COLORS[getTimeTier()];
  }, [color1, color2]);

  return (
    <div className="ambient-glow" aria-hidden="true" style={{ "--tier-color-1": tc1, "--tier-color-2": tc2 }}>
      <div className="ambient-blob blob-1" />
      <div className="ambient-blob blob-2" />
    </div>
  );
}

export default AmbientGlow;
