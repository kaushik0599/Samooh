/**
 * Static network visualization: independent nodes converging into one
 * coordinated structure (SAMOOH), which radiates back out into collective
 * outcomes. Built as discrete SVG elements (not a flattened raster) so a
 * later animation pass can target individual nodes/lines/paths.
 */
export function HeroVisual() {
  const sourceNodes = [
    { x: 40, y: 60 },
    { x: 30, y: 150 },
    { x: 50, y: 240 },
    { x: 35, y: 330 },
    { x: 55, y: 400 },
  ];

  const centerNode = { x: 300, y: 230 };

  const outcomeNodes = [
    { x: 540, y: 110, label: "Collective resources" },
    { x: 560, y: 230, label: "Collective decisions" },
    { x: 540, y: 350, label: "Collective growth" },
  ];

  return (
    <svg
      viewBox="0 0 780 460"
      className="h-auto w-full max-w-2xl"
      role="img"
      aria-label="Independent participants converging into SAMOOH, which coordinates collective resources, decisions, and growth"
    >
      {/*
        Ambient motion only: nodes settle in with a small on-load stagger,
        and the radiating (outcome) lines carry a slow, low-amplitude
        opacity pulse — multi-second cycle, never a "loading" feel.
        `prefers-reduced-motion: reduce` disables both via the media query
        below, falling back to each element's own resting opacity (1).
      */}
      <style>{`
        .samooh-hv-node {
          opacity: 1;
          animation: samooh-hv-fade-in 700ms var(--samooh-hv-ease, cubic-bezier(0.4,0,0.2,1)) backwards;
        }
        .samooh-hv-pulse {
          animation: samooh-hv-pulse 6s ease-in-out infinite;
        }
        @keyframes samooh-hv-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes samooh-hv-pulse {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.85; }
        }
        @media (prefers-reduced-motion: reduce) {
          .samooh-hv-node, .samooh-hv-pulse {
            animation: none;
          }
        }
      `}</style>

      <g aria-hidden="true">
        {/* Converging lines: independent nodes -> center */}
        {sourceNodes.map((node, i) => (
          <line
            key={`in-${i}`}
            x1={node.x}
            y1={node.y}
            x2={centerNode.x}
            y2={centerNode.y}
            className="stroke-border"
            strokeWidth="1"
          />
        ))}

        {/* Radiating lines: center -> outcomes, gentle ambient pulse */}
        {outcomeNodes.map((node, i) => (
          <line
            key={`out-${i}`}
            x1={centerNode.x}
            y1={centerNode.y}
            x2={node.x}
            y2={node.y}
            className="samooh-hv-pulse stroke-primary/40"
            strokeWidth="1.5"
            style={{ animationDelay: `${i * 700}ms` }}
          />
        ))}

        {/* Independent source nodes */}
        {sourceNodes.map((node, i) => (
          <circle
            key={`sn-${i}`}
            cx={node.x}
            cy={node.y}
            r="6"
            className="samooh-hv-node fill-surface stroke-text-secondary"
            strokeWidth="1.5"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}

        {/* Outcome nodes */}
        {outcomeNodes.map((node, i) => (
          <circle
            key={`on-${i}`}
            cx={node.x}
            cy={node.y}
            r="7"
            className="samooh-hv-node fill-accent-bg stroke-primary"
            strokeWidth="1.5"
            style={{ animationDelay: `${400 + i * 80}ms` }}
          />
        ))}

        {/* Center node */}
        <circle
          cx={centerNode.x}
          cy={centerNode.y}
          r="34"
          className="samooh-hv-node fill-primary"
          style={{ animationDelay: "300ms" }}
        />
      </g>

      <text
        x={centerNode.x}
        y={centerNode.y + 5}
        textAnchor="middle"
        className="fill-white text-[13px] font-semibold tracking-tight"
      >
        SAMOOH
      </text>

      {outcomeNodes.map((node, i) => (
        <text
          key={`ol-${i}`}
          x={node.x + 16}
          y={node.y + 4}
          className="fill-current text-[12px] text-text-secondary"
        >
          {node.label}
        </text>
      ))}
    </svg>
  );
}
