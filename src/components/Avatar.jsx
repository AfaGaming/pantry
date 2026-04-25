// Deterministic colour from display name — same person always gets same colour
const COLOURS = [
  "#007aff", "#34c759", "#ff9500", "#ff3b30",
  "#af52de", "#5ac8fa", "#ff2d55", "#ffcc00",
];

const nameToColour = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return COLOURS[Math.abs(hash) % COLOURS.length];
};

export default function Avatar({ user, size = 28 }) {
  if (!user) return null;

  const initial = (user.displayName || user.email || "?")[0].toUpperCase();
  const colour  = nameToColour(user.displayName || user.email || "");

  // Google users have a photoURL
  if (user.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt={user.displayName}
        referrerPolicy="no-referrer"
        style={{
          width:        size,
          height:       size,
          borderRadius: "50%",
          objectFit:    "cover",
          flexShrink:   0,
        }}
      />
    );
  }

  return (
    <div style={{
      width:          size,
      height:         size,
      borderRadius:   "50%",
      background:     colour,
      display:        "flex",
      alignItems:     "center",
      justifyContent: "center",
      fontSize:       size * 0.42,
      fontWeight:     700,
      color:          "#fff",
      flexShrink:     0,
    }}>
      {initial}
    </div>
  );
}
