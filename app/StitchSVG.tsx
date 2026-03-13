"use client";
import { useId } from "react";
import { StitchType } from "./game-engine";

interface StitchSVGProps {
  type: StitchType;
  size?: number;
  color?: string;
  opacity?: number;
  colorA?: string;
  colorB?: string;
}

// Renders realistic knitting stitch symbols as SVG with yarn-like appearance
export default function StitchSVG({ type, size = 32, color = "#4a3728", opacity = 1, colorA = "#d45e5e", colorB = "#5e8ed4" }: StitchSVGProps) {
  const s = size;
  const half = s / 2;
  const pad = s * 0.1;
  const strokeW = Math.max(1.5, s * 0.07);
  const yarnW = Math.max(2.5, s * 0.1); // thicker for yarn-like feel

  const reactId = useId();
  const filterId = `yarn-${reactId.replace(/:/g, "")}`;

  // Common yarn texture filter
  const yarnFilter = (
    <defs>
      <filter id={filterId} x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
      </filter>
      <linearGradient id={`${filterId}-grad`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0.3" />
        <stop offset="50%" stopColor="white" stopOpacity="0" />
        <stop offset="100%" stopColor="black" stopOpacity="0.15" />
      </linearGradient>
    </defs>
  );

  switch (type) {
    case "knit":
      // Realistic V-stitch with yarn-like loops
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Left leg of V */}
          <path
            d={`M${pad + 1},${pad} Q${half * 0.6},${half} ${half},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Right leg of V */}
          <path
            d={`M${s - pad - 1},${pad} Q${half * 1.4},${half} ${half},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Highlight for 3D yarn effect */}
          <path
            d={`M${pad + 2},${pad + 1} Q${half * 0.6},${half} ${half},${s - pad}`}
            fill="none" stroke={`url(#${filterId}-grad)`} strokeWidth={yarnW * 0.5}
            strokeLinecap="round"
          />
        </svg>
      );

    case "purl":
      // Purl bump — horizontal arc with a raised dot
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Curved bump */}
          <path
            d={`M${pad},${half + 2} Q${half},${pad - 2} ${s - pad},${half + 2}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Bottom arc */}
          <path
            d={`M${pad + 3},${half + 2} Q${half},${s - pad + 2} ${s - pad - 3},${half + 2}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.6}
            strokeLinecap="round" strokeOpacity="0.5"
          />
          {/* Center dot */}
          <circle cx={half} cy={half - 1} r={s * 0.07} fill={color} opacity="0.7" />
        </svg>
      );

    case "yarn-over":
      // Open eyelet — circle with yarn texture
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          <circle
            cx={half} cy={half} r={s * 0.3}
            fill="none" stroke={color} strokeWidth={yarnW}
            filter={`url(#${filterId})`}
          />
          {/* Inner highlight */}
          <circle
            cx={half - s * 0.05} cy={half - s * 0.05} r={s * 0.28}
            fill="none" stroke="white" strokeWidth={yarnW * 0.3}
            strokeOpacity="0.2"
          />
        </svg>
      );

    case "k2tog":
      // Right-leaning decrease — two stitches lean right
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Back leg */}
          <path
            d={`M${pad + 2},${pad} L${s - pad - 2},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.6}
            strokeLinecap="round" strokeOpacity="0.5"
          />
          {/* Front leg (dominant) */}
          <path
            d={`M${pad},${s - pad} Q${half},${half - 2} ${s - pad},${pad}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Small arrow tip */}
          <path
            d={`M${s - pad - 5},${pad + 1} L${s - pad},${pad} L${s - pad - 2},${pad + 6}`}
            fill="none" stroke={color} strokeWidth={strokeW * 0.7}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );

    case "ssk":
      // Left-leaning decrease — two stitches lean left
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Back leg */}
          <path
            d={`M${s - pad - 2},${pad} L${pad + 2},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.6}
            strokeLinecap="round" strokeOpacity="0.5"
          />
          {/* Front leg (dominant) */}
          <path
            d={`M${s - pad},${s - pad} Q${half},${half - 2} ${pad},${pad}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Small arrow tip */}
          <path
            d={`M${pad + 5},${pad + 1} L${pad},${pad} L${pad + 2},${pad + 6}`}
            fill="none" stroke={color} strokeWidth={strokeW * 0.7}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );

    case "m1r":
      // Make one right — upward loop curving right
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Lifted bar */}
          <path
            d={`M${pad},${s - pad} Q${pad},${half - 4} ${half},${half - 4}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Twist right */}
          <path
            d={`M${half},${half - 4} Q${s - pad},${half - 4} ${s - pad - 2},${pad + 2}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Arrow */}
          <path
            d={`M${s - pad - 6},${pad + 6} L${s - pad - 2},${pad + 2} L${s - pad + 1},${pad + 8}`}
            fill="none" stroke={color} strokeWidth={strokeW}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );

    case "m1l":
      // Make one left — upward loop curving left
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Lifted bar */}
          <path
            d={`M${s - pad},${s - pad} Q${s - pad},${half - 4} ${half},${half - 4}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Twist left */}
          <path
            d={`M${half},${half - 4} Q${pad},${half - 4} ${pad + 2},${pad + 2}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Arrow */}
          <path
            d={`M${pad + 6},${pad + 6} L${pad + 2},${pad + 2} L${pad - 1},${pad + 8}`}
            fill="none" stroke={color} strokeWidth={strokeW}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );

    case "slip":
      // Slipped stitch — elongated vertical with arrow
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          <path
            d={`M${half},${pad} L${half},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          <path
            d={`M${half - 4},${s - pad - 6} L${half},${s - pad} L${half + 4},${s - pad - 6}`}
            fill="none" stroke={color} strokeWidth={strokeW}
            strokeLinecap="round" strokeLinejoin="round"
          />
        </svg>
      );

    case "cable-left":
      // Cable cross left — two strands crossing
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Front strand (left cross) — goes over */}
          <path
            d={`M${s - pad},${pad} C${half},${pad + s * 0.15} ${half},${s - pad - s * 0.15} ${pad},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW * 1.1}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Back strand — dashed to show going behind */}
          <path
            d={`M${pad},${pad} L${half - 3},${half - 3}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.7}
            strokeLinecap="round" strokeOpacity="0.4"
          />
          <path
            d={`M${half + 3},${half + 3} L${s - pad},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.7}
            strokeLinecap="round" strokeOpacity="0.4"
          />
        </svg>
      );

    case "cable-right":
      // Cable cross right — two strands crossing
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          {yarnFilter}
          {/* Front strand (right cross) — goes over */}
          <path
            d={`M${pad},${pad} C${half},${pad + s * 0.15} ${half},${s - pad - s * 0.15} ${s - pad},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW * 1.1}
            strokeLinecap="round" filter={`url(#${filterId})`}
          />
          {/* Back strand */}
          <path
            d={`M${s - pad},${pad} L${half + 3},${half - 3}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.7}
            strokeLinecap="round" strokeOpacity="0.4"
          />
          <path
            d={`M${half - 3},${half + 3} L${pad},${s - pad}`}
            fill="none" stroke={color} strokeWidth={yarnW * 0.7}
            strokeLinecap="round" strokeOpacity="0.4"
          />
        </svg>
      );

    case "color-a":
      // Color block A with knit V texture inside
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <rect
            x={1} y={1} width={s - 2} height={s - 2}
            rx={3} fill={colorA}
          />
          {/* Knit V texture */}
          <path
            d={`M${pad + 2},${pad + 2} Q${half * 0.7},${half} ${half},${s - pad - 2}`}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={yarnW * 0.7}
            strokeLinecap="round"
          />
          <path
            d={`M${s - pad - 2},${pad + 2} Q${half * 1.3},${half} ${half},${s - pad - 2}`}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={yarnW * 0.7}
            strokeLinecap="round"
          />
          {/* Highlight */}
          <rect x={1} y={1} width={s - 2} height={s * 0.35} rx={3}
            fill="white" opacity="0.12"
          />
        </svg>
      );

    case "color-b":
      // Color block B with knit V texture inside
      return (
        <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
          <rect
            x={1} y={1} width={s - 2} height={s - 2}
            rx={3} fill={colorB}
          />
          {/* Knit V texture */}
          <path
            d={`M${pad + 2},${pad + 2} Q${half * 0.7},${half} ${half},${s - pad - 2}`}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={yarnW * 0.7}
            strokeLinecap="round"
          />
          <path
            d={`M${s - pad - 2},${pad + 2} Q${half * 1.3},${half} ${half},${s - pad - 2}`}
            fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth={yarnW * 0.7}
            strokeLinecap="round"
          />
          <rect x={1} y={1} width={s - 2} height={s * 0.35} rx={3}
            fill="white" opacity="0.12"
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
