// Small shimmering placeholder block, sized via inline style so each page can
// compose skeleton layouts that mirror its real content shape.
function Skeleton({ w = "100%", h = 14, radius, style }) {
  return (
    <div
      className="skel"
      style={{ width: w, height: h, borderRadius: radius, ...style }}
    />
  );
}

export default Skeleton;
