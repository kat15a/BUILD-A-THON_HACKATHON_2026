/**
 * SafePath — Emergency Evacuation Route SVG Component
 * Renders a bold, neon-green animated path from Level 2 to the elevator shaft.
 */
import React from 'react';

const SafePath = () => {
  return (
    <g id="safe-path">
      {/* Outer glow path */}
      <path
        d="M 450 310 L 450 135 L 450 50"
        stroke="#4ade80"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
        opacity="0.15"
        filter="url(#glowGreen)"
      />
      {/* Inner animated safe path */}
      <path
        d="M 450 310 L 450 135 L 450 50"
        stroke="url(#safePathGrad)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        className="safe-path-line"
        filter="url(#glowGreen)"
      />
      {/* Path from Level 2 tunnels to shaft */}
      <path
        d="M 360 317 L 430 317"
        stroke="#4ade80"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="safe-path-line"
        filter="url(#glowGreen)"
      />
      <path
        d="M 470 317 L 540 317"
        stroke="#4ade80"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        className="safe-path-line"
        filter="url(#glowGreen)"
      />
      {/* Evacuation arrow markers */}
      <polygon points="450,52 444,65 456,65" fill="#4ade80" opacity="0.9">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="0.6s" repeatCount="indefinite" />
      </polygon>
      {/* EVAC label */}
      <rect x="465" y="170" width="55" height="18" rx="3" fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth="1" />
      <text x="492" y="182" textAnchor="middle" fill="#4ade80" fontSize="8" fontWeight="700"
        fontFamily="'JetBrains Mono', monospace" letterSpacing="0.1em">
        EVAC ↑
      </text>
    </g>
  );
};

export default SafePath;
