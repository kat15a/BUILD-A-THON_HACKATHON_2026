/**
 * AirFlowPath — Animated Air Flow SVG Path
 * ==========================================
 * Renders an animated SVG path that simulates air flowing through
 * mine tunnels. The animation style changes based on state:
 * - NOMINAL: Smooth cyan flow animation
 * - WARNING: Amber pulsing flow
 * - CRITICAL: Stopped flow with danger pulsing
 */

import React from 'react';

const AirFlowPath = ({ d, state = 'NOMINAL', filter = '' }) => {
  const isNominal = state === 'NOMINAL';
  const isWarning = state === 'WARNING';
  const isCritical = state === 'CRITICAL';

  const strokeColor = isNominal ? '#22d3ee' : isWarning ? '#f59e0b' : '#ef4444';
  const className = isCritical ? 'air-flow-stopped' : 'air-flow-nominal';

  return (
    <path
      d={d}
      stroke={strokeColor}
      strokeWidth={isCritical ? 3 : 2}
      strokeLinecap="round"
      fill="none"
      className={className}
      filter={filter}
      opacity={isCritical ? 0.9 : 0.7}
    />
  );
};

export default AirFlowPath;
