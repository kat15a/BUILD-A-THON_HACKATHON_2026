/**
 * ElevatorShaft — Central Elevator Shaft SVG Component
 */
import React from 'react';

const ElevatorShaft = ({ systemCritical }) => {
  return (
    <g id="elevator-shaft">
      <rect x="430" y="45" width="40" height="540" rx="4" fill="#1e293b"
        stroke={systemCritical ? '#dc2626' : '#334155'}
        strokeWidth={systemCritical ? 1.5 : 1} opacity="0.8" />
      <line x1="438" y1="50" x2="438" y2="580" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 6" />
      <line x1="462" y1="50" x2="462" y2="580" stroke="#334155" strokeWidth="0.5" strokeDasharray="2 6" />
      {[130, 310, 490].map((cy, i) => (
        <g key={`crossbeam-${i}`}>
          <line x1="432" y1={cy} x2="468" y2={cy} stroke="#475569" strokeWidth="1" />
          <line x1="432" y1={cy + 10} x2="468" y2={cy + 10} stroke="#475569" strokeWidth="1" />
          <circle cx="430" cy={cy + 5} r="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
          <circle cx="470" cy={cy + 5} r="3" fill="#1e293b" stroke="#475569" strokeWidth="1" />
        </g>
      ))}
      <rect x="436" y="120" width="28" height="20" rx="2" fill="#334155" stroke="#475569" strokeWidth="1">
        <animateTransform attributeName="transform" type="translate"
          values="0 0; 0 180; 0 360; 0 180; 0 0" dur="12s" repeatCount="indefinite" />
      </rect>
      <text x="450" y="595" textAnchor="middle" fill="#475569" fontSize="7"
        fontFamily="'JetBrains Mono', monospace" letterSpacing="0.08em">SHAFT-01</text>
      <polygon points="450,48 445,55 455,55"
        fill={systemCritical ? '#4ade80' : '#475569'}
        opacity={systemCritical ? 1 : 0.5}>
        {systemCritical && (
          <animate attributeName="opacity" values="0.6;1;0.6" dur="0.8s" repeatCount="indefinite" />
        )}
      </polygon>
    </g>
  );
};

export default ElevatorShaft;
