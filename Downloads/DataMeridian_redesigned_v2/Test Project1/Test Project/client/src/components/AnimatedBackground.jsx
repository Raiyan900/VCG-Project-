/**
 * DataMeridian data-network background.
 *
 * A purely decorative, viewport-fixed layer: technical grid, ambient green
 * light, and a constellation of connected data nodes ("datasets linked across
 * a research network"). It never intercepts pointer events and sits below all
 * page content (content wrappers use z-10).
 *
 * The node layout is generated once from a seeded PRNG so it is identical on
 * every render, on every device, and needs no runtime work after import.
 */

const VIEW = 1200; // square-ish viewBox; `slice` keeps it filled on any screen
const COLS = 10;
const ROWS = 10;
const MAX_LINK_DIST = 235;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildNetwork() {
  const rand = mulberry32(20260921);
  const cellW = VIEW / COLS;
  const cellH = VIEW / ROWS;

  // Jittered grid => evenly spread but natural-looking distribution
  const nodes = [];
  for (let r = 0; r < ROWS; r += 1) {
    for (let c = 0; c < COLS; c += 1) {
      if (rand() < 0.12) continue; // leave a few gaps
      const x = (c + 0.15 + rand() * 0.7) * cellW;
      const y = (r + 0.15 + rand() * 0.7) * cellH;
      const roll = rand();
      nodes.push({
        x: Math.round(x),
        y: Math.round(y),
        r: roll > 0.9 ? 5 : roll > 0.55 ? 3.5 : 2.5,     // ~2-5px
        hub: roll > 0.9,
        opacity: 0.35 + rand() * 0.55,                    // varied brightness
        pulse: rand() < 0.28,
        delay: (rand() * 6).toFixed(2),
        dur: (4 + rand() * 4).toFixed(2),
      });
    }
  }

  // Link each node to its 2 nearest neighbours (deduplicated)
  const seen = new Set();
  const lines = [];
  nodes.forEach((n, i) => {
    nodes
      .map((m, j) => ({ j, d: Math.hypot(m.x - n.x, m.y - n.y) }))
      .filter(({ j, d }) => j !== i && d < MAX_LINK_DIST)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2)
      .forEach(({ j }) => {
        const key = i < j ? `${i}-${j}` : `${j}-${i}`;
        if (seen.has(key)) return;
        seen.add(key);
        lines.push({
          x1: n.x, y1: n.y, x2: nodes[j].x, y2: nodes[j].y,
          opacity: +(0.12 + rand() * 0.08).toFixed(3),     // 0.12 - 0.20
        });
      });
  });

  return { nodes, lines };
}

const NETWORK = buildNetwork();

export default function AnimatedBackground() {
  return (
    <div className="data-network-background" aria-hidden="true">
      <div className="data-network-grid" />
      <div className="data-network-glow" />

      <svg
        className="data-network-svg"
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <defs>
          <radialGradient id="dm-halo">
            <stop offset="0%" stopColor="#08CB00" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#08CB00" stopOpacity="0" />
          </radialGradient>
        </defs>

        <g>
          {NETWORK.lines.map((l, i) => (
            <line
              key={i}
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke="#08CB00"
              strokeOpacity={l.opacity}
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </g>

        <g>
          {NETWORK.nodes.map((n, i) => (
            <g
              key={i}
              className={n.pulse ? 'data-network-pulse' : undefined}
              style={n.pulse ? { animationDelay: `${n.delay}s`, animationDuration: `${n.dur}s` } : undefined}
            >
              {(n.hub || n.pulse) && <circle cx={n.x} cy={n.y} r={n.r * 3.4} fill="url(#dm-halo)" />}
              <circle cx={n.x} cy={n.y} r={n.r} fill="#08CB00" fillOpacity={n.opacity} />
              {n.hub && (
                <circle cx={n.x} cy={n.y} r={n.r + 4} fill="none" stroke="#08CB00" strokeOpacity="0.35" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
