/**
 * Level — Individual Mine Level SVG Component
 * =============================================
 * Renders a single mine level with tunnels, air flow animations,
 * telemetry data overlay, fan indicator, and dynamic state coloring.
 */

import React from 'react';
import AirFlowPath from './AirFlowPath';

const STATE_COLORS = {
  NOMINAL: { bg: 'rgba(34,211,238,0.06)', border: '#0e7490', text: '#22d3ee', fill: '#22d3ee' },
  WARNING: { bg: 'rgba(245,158,11,0.08)', border: '#b45309', text: '#f59e0b', fill: '#f59e0b' },
  CRITICAL: { bg: 'rgba(239,68,68,0.1)', border: '#dc2626', text: '#ef4444', fill: '#ef4444' },
};

const Level = ({
  id,
  label,
  sublabel,
  y,
  data = {},
  systemCritical,
  isCriticalLevel,
  tunnelPaths = [],
  fanPosition,
  fanId,
}) => {
  const state = data.state || 'NOMINAL';
  const colors = STATE_COLORS[state];
  const isThisLevelCritical = state === 'CRITICAL';
  const isDimmed = systemCritical && !isCriticalLevel;

  // Format values for display
  const o2 = (data.oxygen_pct ?? 20.9).toFixed(1);
  const co = (data.co_ppm ?? 0).toFixed(0);
  const temp = (data.temp_c ?? 22).toFixed(1);
  const rpm = (data.fan_rpm ?? 0).toFixed(0);

  return (
    <g id={id} opacity={isDimmed ? 0.2 : 1} style={{ transition: 'opacity 0.8s ease' }}>
      {/* Level Background Zone */}
      <rect
        x="60"
        y={y}
        width="780"
        height="170"
        rx="8"
        fill={colors.bg}
        stroke={colors.border}
        strokeWidth={isThisLevelCritical ? 2 : 0.5}
        strokeDasharray={isThisLevelCritical ? '' : '4 8'}
        opacity={isThisLevelCritical ? 0.9 : 0.5}
      >
        {isThisLevelCritical && (
          <animate
            attributeName="stroke-opacity"
            values="0.5;1;0.5"
            dur="1s"
            repeatCount="indefinite"
          />
        )}
      </rect>

      {/* Level Label */}
      <text
        x="85"
        y={y + 25}
        fill={colors.text}
        fontSize="13"
        fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.15em"
      >
        {label}
      </text>
      <text
        x="85"
        y={y + 40}
        fill="#64748b"
        fontSize="9"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.1em"
      >
        {sublabel}
      </text>

      {/* State Badge */}
      <rect
        x="230"
        y={y + 12}
        width={state.length * 9 + 16}
        height="20"
        rx="4"
        fill={state === 'NOMINAL' ? 'rgba(34,211,238,0.15)' : state === 'WARNING' ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.25)'}
        stroke={colors.border}
        strokeWidth="1"
      />
      <text
        x="238"
        y={y + 26}
        fill={colors.text}
        fontSize="9"
        fontWeight="700"
        fontFamily="'JetBrains Mono', monospace"
        letterSpacing="0.1em"
      >
        {state}
      </text>

      {/* Telemetry Data Overlay */}
      <g transform={`translate(380, ${y + 12})`}>
        {/* O2 */}
        <text x="0" y="10" fill="#94a3b8" fontSize="8" fontFamily="'JetBrains Mono', monospace">O₂</text>
        <text x="22" y="10" fill={parseFloat(o2) < 19.5 ? '#ef4444' : '#22d3ee'} fontSize="11" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
          {o2}%
        </text>

        {/* CO */}
        <text x="80" y="10" fill="#94a3b8" fontSize="8" fontFamily="'JetBrains Mono', monospace">CO</text>
        <text x="100" y="10" fill={parseFloat(co) > 25 ? '#ef4444' : '#22d3ee'} fontSize="11" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
          {co} ppm
        </text>

        {/* Temp */}
        <text x="175" y="10" fill="#94a3b8" fontSize="8" fontFamily="'JetBrains Mono', monospace">TEMP</text>
        <text x="205" y="10" fill="#94a3b8" fontSize="11" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
          {temp}°C
        </text>
      </g>

      {/* ──── Tunnel Structures ──── */}
      {tunnelPaths.map((tunnel, i) => (
        <g key={`${id}-tunnel-${i}`}>
          {/* Tunnel wall */}
          <path
            d={tunnel.d}
            stroke="#334155"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
          {/* Tunnel inner wall */}
          <path
            d={tunnel.d}
            stroke="#1e293b"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
          />
          {/* Air flow animation */}
          <AirFlowPath
            d={tunnel.d}
            state={state}
            filter={state === 'NOMINAL' ? 'url(#glowCyan)' : state === 'CRITICAL' ? 'url(#glowRed)' : ''}
          />
          {/* Tunnel label */}
          <text
            x={parseFloat(tunnel.d.split(' ')[1]) + 5}
            y={parseFloat(tunnel.d.split(' ')[2]) - 14}
            fill="#475569"
            fontSize="7"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="0.08em"
          >
            {tunnel.label}
          </text>
        </g>
      ))}

      {/* ──── Junction boxes ──── */}
      {/* Left junction */}
      <rect x="100" y={y + 48} width="30" height="30" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="115" y={y + 67} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="'JetBrains Mono', monospace">JB</text>

      {/* Right junction */}
      <rect x="770" y={y + 48} width="30" height="30" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1" />
      <text x="785" y={y + 67} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="'JetBrains Mono', monospace">JB</text>

      {/* ──── Fan Indicator ──── */}
      {fanPosition && (
        <g transform={`translate(${fanPosition.x}, ${fanPosition.y})`}>
          {/* Fan housing */}
          <circle
            cx="0"
            cy="0"
            r="16"
            fill={data.fan_status ? 'rgba(34,211,238,0.1)' : 'rgba(239,68,68,0.15)'}
            stroke={data.fan_status ? '#0e7490' : '#dc2626'}
            strokeWidth="1.5"
          />
          {/* Fan blades (animated when running) */}
          <g>
            {data.fan_status ? (
              <g>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 0 0"
                  to="360 0 0"
                  dur="0.8s"
                  repeatCount="indefinite"
                />
                <line x1="-8" y1="0" x2="8" y2="0" stroke={data.fan_status ? '#22d3ee' : '#ef4444'} strokeWidth="2" strokeLinecap="round" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke={data.fan_status ? '#22d3ee' : '#ef4444'} strokeWidth="2" strokeLinecap="round" />
                <line x1="-6" y1="-6" x2="6" y2="6" stroke={data.fan_status ? '#22d3ee' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" />
                <line x1="6" y1="-6" x2="-6" y2="6" stroke={data.fan_status ? '#22d3ee' : '#ef4444'} strokeWidth="1.5" strokeLinecap="round" />
              </g>
            ) : (
              <g>
                {/* Static X for failed fan */}
                <line x1="-7" y1="-7" x2="7" y2="7" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="7" y1="-7" x2="-7" y2="7" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            )}
          </g>

          {/* Fan label */}
          <text
            x="0"
            y="28"
            textAnchor="middle"
            fill={data.fan_status ? '#94a3b8' : '#ef4444'}
            fontSize="7"
            fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
          >
            {fanId}
          </text>
          <text
            x="0"
            y="38"
            textAnchor="middle"
            fill={data.fan_status ? '#64748b' : '#ef4444'}
            fontSize="6"
            fontFamily="'JetBrains Mono', monospace"
          >
            {data.fan_status ? `${rpm} RPM` : 'OFFLINE'}
          </text>
        </g>
      )}

      {/* ──── Sensor nodes ──── */}
      {/* Left sensor cluster */}
      <circle cx="250" cy={y + 100} r="4" fill={colors.fill} opacity="0.6">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2s" repeatCount="indefinite" />
      </circle>
      <text x="260" y={y + 103} fill="#64748b" fontSize="6" fontFamily="'JetBrains Mono', monospace">S-{id.split('_')[1]}A</text>

      {/* Right sensor cluster */}
      <circle cx="650" cy={y + 100} r="4" fill={colors.fill} opacity="0.6">
        <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <text x="660" y={y + 103} fill="#64748b" fontSize="6" fontFamily="'JetBrains Mono', monospace">S-{id.split('_')[1]}B</text>

      {/* Critical overlay effect */}
      {isThisLevelCritical && (
        <rect
          x="60"
          y={y}
          width="780"
          height="170"
          rx="8"
          fill="none"
          stroke="#ef4444"
          strokeWidth="2"
          opacity="0.8"
        >
          <animate
            attributeName="stroke"
            values="#ef4444;#a855f7;#ef4444"
            dur="1.5s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="stroke-width"
            values="1;3;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        </rect>
      )}
    </g>
  );
};

export default Level;
