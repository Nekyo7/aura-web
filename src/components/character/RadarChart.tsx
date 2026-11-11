"use client";

import React from "react";
import { motion } from "framer-motion";

export type AttributeKey = "STR" | "AGI" | "INT" | "CHA" | "DEX" | "WIS";

export interface AttributeData {
  key: AttributeKey;
  label: string;
  points: number;
  color: string;
}

export interface RadarChartProps {
  attributes: Partial<Record<AttributeKey, number>>;
  maxPoints?: number;
  className?: string;
}

const ATTRIBUTE_CONFIG: {
  key: AttributeKey;
  label: string;
  color: string;
  description: string;
}[] = [
  { key: "STR", label: "STR", color: "#ef4444", description: "Strength & Power" },
  { key: "DEX", label: "DEX", color: "#f59e0b", description: "Dexterity & Precision" },
  { key: "INT", label: "INT", color: "#3b82f6", description: "Intellect & Logic" },
  { key: "WIS", label: "WIS", color: "#8b5cf6", description: "Wisdom & Insight" },
  { key: "CHA", label: "CHA", color: "#ec4899", description: "Charisma & Aura" },
  { key: "AGI", label: "AGI", color: "#10b981", description: "Agility & Speed" },
];

export const RadarChart: React.FC<RadarChartProps> = ({
  attributes,
  maxPoints,
  className = "",
}) => {
  const size = 320;
  const center = size / 2;
  const radius = 95;

  // Compute dynamic scale if maxPoints not explicitly provided
  const maxAttrValue = Math.max(
    10,
    ...ATTRIBUTE_CONFIG.map((a) => attributes[a.key] ?? 0)
  );
  const scaleMax = maxPoints ?? Math.max(50, Math.ceil(maxAttrValue / 25) * 25);

  const angleStep = (Math.PI * 2) / ATTRIBUTE_CONFIG.length;

  // Grid concentric levels (25%, 50%, 75%, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // Helper to get coordinates
  const getCoordinates = (index: number, ratio: number) => {
    // Start at top (-PI/2) and rotate clockwise
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: center + radius * ratio * Math.cos(angle),
      y: center + radius * ratio * Math.sin(angle),
    };
  };

  // Points for grid hexagons
  const gridHexagons = gridLevels.map((level) => {
    return ATTRIBUTE_CONFIG.map((_, i) => {
      const { x, y } = getCoordinates(i, level);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
  });

  // Points for data polygon
  const dataPoints = ATTRIBUTE_CONFIG.map((attr, i) => {
    const rawVal = attributes[attr.key] ?? 0;
    const ratio = Math.min(1.0, Math.max(0.08, rawVal / scaleMax));
    return getCoordinates(i, ratio);
  });

  const polygonPath = dataPoints
    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[300px] sm:max-w-[340px] h-auto drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
      >
        <defs>
          {/* Hexagonal radar gradient fill */}
          <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.1" />
          </radialGradient>
        </defs>

        {/* Outer Circular Bounds for aesthetic retro radar */}
        <circle
          cx={center}
          cy={center}
          r={radius + 8}
          fill="#080c14"
          stroke="#1e293b"
          strokeWidth="2"
        />

        {/* Concentric grid rings (Hexagons) */}
        {gridHexagons.map((points, idx) => (
          <polygon
            key={`grid-${idx}`}
            points={points}
            fill={idx === 3 ? "rgba(15, 23, 42, 0.4)" : "none"}
            stroke="#1e293b"
            strokeWidth={idx === 3 ? "1.5" : "1"}
            strokeDasharray={idx < 3 ? "3,3" : "none"}
          />
        ))}

        {/* Spoke Axes */}
        {ATTRIBUTE_CONFIG.map((attr, idx) => {
          const end = getCoordinates(idx, 1.0);
          return (
            <line
              key={`spoke-${attr.key}`}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="#2a354c"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Filled Data Polygon with Smooth Animation */}
        <motion.polygon
          points={polygonPath}
          fill="url(#radarGlow)"
          stroke="#a855f7"
          strokeWidth="2.5"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />

        {/* Vertex Dots */}
        {dataPoints.map((point, idx) => (
          <g key={`vertex-${idx}`}>
            {/* 3D pixel-style square dot */}
            <rect
              x={point.x - 3}
              y={point.y - 3}
              width="6"
              height="6"
              fill={ATTRIBUTE_CONFIG[idx].color}
              stroke="#000"
              strokeWidth="1"
            />
          </g>
        ))}

        {/* Attribute Labels positioned outside hexagon */}
        {ATTRIBUTE_CONFIG.map((attr, idx) => {
          const labelDist = 1.25;
          const pos = getCoordinates(idx, labelDist);
          const val = (attributes[attr.key] ?? 0).toFixed(0);

          return (
            <g key={`label-${attr.key}`} transform={`translate(${pos.x}, ${pos.y})`}>
              <text
                textAnchor="middle"
                dominantBaseline="central"
                className="font-pixel text-[11px] font-bold"
                fill={attr.color}
                style={{
                  textShadow:
                    "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",
                }}
              >
                {attr.label}
              </text>
              <text
                y="11"
                textAnchor="middle"
                dominantBaseline="central"
                className="font-pixel text-[9px] fill-gray-300"
                style={{
                  textShadow: "1px 1px 0 #000, -1px -1px 0 #000",
                }}
              >
                {val}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

