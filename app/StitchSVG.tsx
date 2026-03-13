"use client";
import { StitchType } from "./game-engine";

interface StitchSVGProps {
  type: StitchType;
  size?: number;
  color?: string;
  opacity?: number;
  colorA?: string;
  colorB?: string;
}

// Renders accurate knitting stitch symbols as SVG
export default function StitchSVG({ type, size = 32, color = "#4a3728", opacity = 1, colorA = "#d45e5e", colorB = "#5e8ed4" }: StitchSVGProps) {
  const s = size;
  const half = s / 2;
  const pad = s * 0.12;

  const strokeW = Math.max(2, s * 0.08);

  switch (type) {
    case "knit":
      // V shape — the classic knit stitch
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <path
            d={`M${pad},${pad + 2} L${half},${s - pad - 2} L${s - pad},${pad + 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "purl":
      // Horizontal bump — the purl dot/dash
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <line
            x1={pad + 2}
            y1={half}
            x2={s - pad - 2}
            y2={half}
            stroke={color}
            strokeWidth={strokeW * 1.5}
            strokeLinecap="round"
          />
          <circle cx={half} cy={half} r={s * 0.1} fill={color} />
        </svg>
      );

    case "yarn-over":
      // Open circle — the yarn over eyelet
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <circle
            cx={half}
            cy={half}
            r={s * 0.28}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
          />
        </svg>
      );

    case "k2tog":
      // Right-leaning decrease line
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <path
            d={`M${pad},${s - pad} L${s - pad},${pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          <path
            d={`M${pad + 4},${pad} L${s - pad},${pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW * 0.7}
            strokeLinecap="round"
          />
        </svg>
      );

    case "ssk":
      // Left-leaning decrease line
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <path
            d={`M${s - pad},${s - pad} L${pad},${pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          <path
            d={`M${pad},${pad} L${s - pad - 4},${pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW * 0.7}
            strokeLinecap="round"
          />
        </svg>
      );

    case "slip":
      // Right arrow
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <path
            d={`M${pad},${half} L${s - pad},${half}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          <path
            d={`M${s - pad - 6},${half - 5} L${s - pad},${half} L${s - pad - 6},${half + 5}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "cable-left":
      // Curved left cross
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <path
            d={`M${s - pad},${pad} C${half},${pad + 4} ${half},${s - pad - 4} ${pad},${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW * 1.2}
            strokeLinecap="round"
          />
          <path
            d={`M${pad},${pad} L${s - pad},${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW * 0.8}
            strokeLinecap="round"
            strokeDasharray={`${s * 0.12} ${s * 0.15}`}
          />
        </svg>
      );

    case "cable-right":
      // Curved right cross
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <path
            d={`M${pad},${pad} C${half},${pad + 4} ${half},${s - pad - 4} ${s - pad},${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW * 1.2}
            strokeLinecap="round"
          />
          <path
            d={`M${s - pad},${pad} L${pad},${s - pad}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeW * 0.8}
            strokeLinecap="round"
            strokeDasharray={`${s * 0.12} ${s * 0.15}`}
          />
        </svg>
      );

    case "color-a":
      // Filled square in color A
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <rect
            x={pad}
            y={pad}
            width={s - pad * 2}
            height={s - pad * 2}
            rx={3}
            fill={colorA}
            stroke={color}
            strokeWidth={strokeW * 0.5}
          />
          <path
            d={`M${pad + 3},${pad + 3} L${half},${s - pad - 3} L${s - pad - 3},${pad + 3}`}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={strokeW * 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case "color-b":
      // Filled square in color B
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <rect
            x={pad}
            y={pad}
            width={s - pad * 2}
            height={s - pad * 2}
            rx={3}
            fill={colorB}
            stroke={color}
            strokeWidth={strokeW * 0.5}
          />
          <path
            d={`M${pad + 3},${pad + 3} L${half},${s - pad - 3} L${s - pad - 3},${pad + 3}`}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={strokeW * 0.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    default:
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <text x={half} y={half + 4} textAnchor="middle" fontSize={s * 0.5} fill={color}>?</text>
        </svg>
      );
  }
}
