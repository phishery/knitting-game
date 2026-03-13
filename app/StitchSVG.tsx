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

// All stitch types have SVG tiles in /stitches/
const STITCH_FILES: Record<StitchType, string> = {
  knit: "/stitches/knit.svg",
  purl: "/stitches/purl.svg",
  "yarn-over": "/stitches/yarn-over.svg",
  k2tog: "/stitches/k2tog.svg",
  ssk: "/stitches/ssk.svg",
  m1r: "/stitches/m1r.svg",
  m1l: "/stitches/m1l.svg",
  slip: "/stitches/slip.svg",
  "cable-left": "/stitches/cable-left.svg",
  "cable-right": "/stitches/cable-right.svg",
  "color-a": "/stitches/color-a.svg",
  "color-b": "/stitches/color-b.svg",
};

// Convert hex color to CSS hue-rotate + saturate + brightness filter
// This recolors black SVG strokes to the target color
function hexToFilter(hex: string): string {
  // For white buttons, just invert
  if (hex === "#ffffff" || hex === "#fff" || hex === "white") {
    return "invert(1) brightness(2)";
  }

  // Parse hex
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Simple brightness for grays
  if (hex === "#bbb" || hex === "#aaa") {
    return "invert(0.7) brightness(1.2)";
  }
  if (hex === "#e05050") {
    return "invert(0.4) sepia(1) saturate(5) hue-rotate(330deg) brightness(0.9)";
  }

  // Convert RGB to HSL for filter
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  const hDeg = Math.round(h * 360);
  const sat = Math.round(s * 100);
  const light = Math.round(l * 100);

  // Build filter: invert to white, then sepia + hue-rotate + saturate to target
  const invertAmt = light > 60 ? 0.8 : 0.5;
  const brightnessAmt = light > 60 ? 1.5 : light > 40 ? 1.2 : 0.9;

  return `invert(${invertAmt}) sepia(1) saturate(${Math.max(2, sat / 10)}) hue-rotate(${hDeg}deg) brightness(${brightnessAmt})`;
}

export default function StitchSVG({ type, size = 32, color = "#4a3728", opacity = 1, colorA = "#d45e5e", colorB = "#5e8ed4" }: StitchSVGProps) {
  const s = size;
  const half = s / 2;
  const pad = s * 0.1;
  const yarnW = Math.max(2.5, s * 0.1);

  // Color-a and color-b: render as colored block with knit V texture
  if (type === "color-a" || type === "color-b") {
    const blockColor = type === "color-a" ? colorA : colorB;
    return (
      <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ opacity }}>
        <rect x={1} y={1} width={s - 2} height={s - 2} rx={3} fill={blockColor} />
        <path
          d={`M${pad + 2},${pad + 2} Q${half * 0.7},${half} ${half},${s - pad - 2}`}
          fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={yarnW * 0.7} strokeLinecap="round"
        />
        <path
          d={`M${s - pad - 2},${pad + 2} Q${half * 1.3},${half} ${half},${s - pad - 2}`}
          fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={yarnW * 0.7} strokeLinecap="round"
        />
        <rect x={1} y={1} width={s - 2} height={s * 0.35} rx={3} fill="white" opacity="0.12" />
      </svg>
    );
  }

  // All other stitches: use the tile SVG with CSS filter for color
  const file = STITCH_FILES[type];
  const filter = hexToFilter(color);

  return (
    <img
      src={file}
      alt={type}
      width={s}
      height={s}
      draggable={false}
      style={{
        width: s,
        height: s,
        display: "block",
        opacity,
        filter,
      }}
    />
  );
}
