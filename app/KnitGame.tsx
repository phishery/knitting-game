"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// KNITCRAFT — Mobile-First Interlocking Loop Knitting Engine
// ═══════════════════════════════════════════════════════════════════════════════

const STITCH_W = 22;
const STITCH_H = 28;
const YARN_W = 6.5;
const COLS = 20;
const MAX_ROWS = 15;
const NEEDLE_OVERHANG = 20;
const CANVAS_W = STITCH_W * COLS + NEEDLE_OVERHANG * 2;
const TOP_PAD = 10;
const KNIT = 0;
const PURL = 1;

const PALETTE = [
  { name: "Natural",  hex: "#E8D5B5", shadow: "#B8A070", hi: "#F7EDD8" },
  { name: "Cream",    hex: "#F0E6D4", shadow: "#C8BA9C", hi: "#FFFCF5" },
  { name: "Rust",     hex: "#B44D3A", shadow: "#7E2E20", hi: "#D47060" },
  { name: "Forest",   hex: "#3E7A4A", shadow: "#20502A", hi: "#5FA06A" },
  { name: "Navy",     hex: "#3B4F72", shadow: "#1E2E48", hi: "#5A7098" },
  { name: "Mustard",  hex: "#C49525", shadow: "#8A6810", hi: "#DEB548" },
  { name: "Rose",     hex: "#BB6B6B", shadow: "#843E3E", hi: "#D89090" },
  { name: "Charcoal", hex: "#505050", shadow: "#282828", hi: "#787878" },
  { name: "Sky",      hex: "#6A9AB8", shadow: "#3E6E88", hi: "#90BCD8" },
  { name: "Plum",     hex: "#7A4872", shadow: "#4E2648", hi: "#A06898" },
];

// --- 3D Yarn Tube ---
function YarnTube({ d, ci, opacity = 1, wm = 1 }: { d: string; ci: number; opacity?: number; wm?: number }) {
  const c = PALETTE[ci] || PALETTE[0];
  const w = YARN_W * wm;
  return (
    <g opacity={opacity}>
      <path d={d} stroke={c.shadow} strokeWidth={w + 2.5}
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.40} />
      <path d={d} stroke={c.hex} strokeWidth={w}
        strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d={d} stroke={c.hi} strokeWidth={w * 0.28}
        strokeLinecap="round" strokeLinejoin="round" fill="none" opacity={0.45} />
    </g>
  );
}

// --- Knit Loop Geometry (interlocking U-loops) ---
const LEG_HW = STITCH_W * 0.36;
const LEG_TOP = STITCH_H * 0.42;
const LEG_BOT = STITCH_H * 0.12;
const U_DEPTH = STITCH_H * 0.42;

function knitLeftLeg(cx: number, cy: number) {
  const topX = cx - LEG_HW + STITCH_W * 0.04;
  const topY = cy - LEG_TOP;
  const botX = cx - LEG_HW;
  const botY = cy + LEG_BOT;
  return `M ${topX} ${topY}
    C ${topX - STITCH_W * 0.06} ${cy - LEG_TOP * 0.3},
      ${botX - STITCH_W * 0.04} ${cy + LEG_BOT * 0.2},
      ${botX} ${botY}`;
}

function knitRightLeg(cx: number, cy: number) {
  const topX = cx + LEG_HW - STITCH_W * 0.04;
  const topY = cy - LEG_TOP;
  const botX = cx + LEG_HW;
  const botY = cy + LEG_BOT;
  return `M ${botX} ${botY}
    C ${botX + STITCH_W * 0.04} ${cy + LEG_BOT * 0.2},
      ${topX + STITCH_W * 0.06} ${cy - LEG_TOP * 0.3},
      ${topX} ${topY}`;
}

function knitBottomU(cx: number, cy: number) {
  const lx = cx - LEG_HW;
  const rx = cx + LEG_HW;
  const sy = cy + LEG_BOT;
  const dy = cy + U_DEPTH;
  return `M ${lx} ${sy}
    C ${lx - STITCH_W * 0.02} ${sy + (dy - sy) * 0.65},
      ${cx - LEG_HW * 0.45} ${dy + STITCH_H * 0.04},
      ${cx} ${dy + STITCH_H * 0.03}
    C ${cx + LEG_HW * 0.45} ${dy + STITCH_H * 0.04},
      ${rx + STITCH_W * 0.02} ${sy + (dy - sy) * 0.65},
      ${rx} ${sy}`;
}

function knitTopArc(cx: number, cy: number) {
  const lx = cx - LEG_HW + STITCH_W * 0.04;
  const rx = cx + LEG_HW - STITCH_W * 0.04;
  const topY = cy - LEG_TOP;
  const peakY = topY - STITCH_H * 0.22;
  return `M ${lx} ${topY}
    C ${lx + STITCH_W * 0.04} ${peakY + STITCH_H * 0.04},
      ${cx - STITCH_W * 0.08} ${peakY},
      ${cx} ${peakY - STITCH_H * 0.01}
    C ${cx + STITCH_W * 0.08} ${peakY},
      ${rx - STITCH_W * 0.04} ${peakY + STITCH_H * 0.04},
      ${rx} ${topY}`;
}

// --- Purl Geometry ---
function purlBumpFront(cx: number, cy: number) {
  const hw = STITCH_W * 0.44;
  const by = cy + STITCH_H * 0.02;
  return `M ${cx - hw} ${by}
    C ${cx - hw * 0.35} ${by - STITCH_H * 0.28},
      ${cx + hw * 0.35} ${by - STITCH_H * 0.28},
      ${cx + hw} ${by}`;
}

function purlBumpBack(cx: number, cy: number) {
  const hw = STITCH_W * 0.44;
  const by = cy + STITCH_H * 0.02;
  return `M ${cx - hw} ${by}
    C ${cx - hw * 0.35} ${by + STITCH_H * 0.24},
      ${cx + hw * 0.35} ${by + STITCH_H * 0.24},
      ${cx + hw} ${by}`;
}

function purlLeftLeg(cx: number, cy: number) {
  return `M ${cx - STITCH_W * 0.24} ${cy - STITCH_H * 0.40}
    Q ${cx - STITCH_W * 0.024} ${cy},
      ${cx} ${cy + STITCH_H * 0.168}`;
}

function purlRightLeg(cx: number, cy: number) {
  return `M ${cx} ${cy + STITCH_H * 0.168}
    Q ${cx + STITCH_W * 0.024} ${cy},
      ${cx + STITCH_W * 0.24} ${cy - STITCH_H * 0.40}`;
}

function purlTopArc(cx: number, cy: number) {
  const hw = STITCH_W * 0.24;
  const topY = cy - STITCH_H * 0.40;
  const peakY = topY - STITCH_H * 0.16;
  return `M ${cx - hw} ${topY}
    C ${cx - hw * 0.3} ${peakY}, ${cx + hw * 0.3} ${peakY}, ${cx + hw} ${topY}`;
}

function purlBottomU(cx: number, cy: number) {
  const hw = STITCH_W * 0.22;
  const bs = cy + STITCH_H * 0.168;
  const dy = bs + STITCH_H * 0.28;
  return `M ${cx - hw} ${bs}
    C ${cx - hw * 0.4} ${dy}, ${cx + hw * 0.4} ${dy}, ${cx + hw} ${bs}`;
}

// --- Needles ---
function Needle({ y, variant }: { y: number; variant: "front" | "back" }) {
  const x1 = 1, x2 = CANVAS_W - 1;
  const ny = y + (variant === "back" ? 6 : -4);
  const op = variant === "back" ? 0.25 : 1;
  const body = variant === "back" ? "#B09878" : "#D4B890";
  const tip = variant === "back" ? "#A08060" : "#C8A878";
  return (
    <g opacity={op}>
      <line x1={x1} y1={ny} x2={x2} y2={ny}
        stroke={body} strokeWidth={10} strokeLinecap="round" />
      <line x1={x1 + 3} y1={ny - 2.2} x2={x2 - 3} y2={ny - 2.2}
        stroke="#E8D8C0" strokeWidth={1.4} strokeLinecap="round" opacity={0.32} />
      <circle cx={x2 + 2} cy={ny} r={4} fill={tip} />
      <ellipse cx={x2 + 5} cy={ny} rx={2.2} ry={3.2} fill={tip} opacity={0.5} />
      <circle cx={x1 - 2} cy={ny} r={5.5} fill={variant === "back" ? "#907858" : "#B89060"} />
    </g>
  );
}

// --- Row Renderer ---
interface StitchData {
  color: number;
  type: number;
}

function FabricRow({ stitches, y, animIdx = -1 }: { stitches: (StitchData | null)[]; y: number; animIdx?: number }) {
  const baseX = NEEDLE_OVERHANG;
  const topArcs: React.ReactNode[] = [];
  const legs: React.ReactNode[] = [];
  const bottomUs: React.ReactNode[] = [];
  const purlBehind: React.ReactNode[] = [];
  const purlFront: React.ReactNode[] = [];

  for (let i = 0; i < stitches.length; i++) {
    const s = stitches[i];
    if (!s) continue;
    const cx = baseX + i * STITCH_W + STITCH_W / 2;
    const cy = y + STITCH_H / 2;
    const ci = s.color;
    const op = i === animIdx ? 0.45 : 1;

    if (s.type === PURL) {
      purlBehind.push(
        <YarnTube key={`pta-${i}`} d={purlTopArc(cx, cy)} ci={ci} opacity={op * 0.25} wm={0.65} />,
        <YarnTube key={`pll-${i}`} d={purlLeftLeg(cx, cy)} ci={ci} opacity={op * 0.28} wm={0.68} />,
        <YarnTube key={`plr-${i}`} d={purlRightLeg(cx, cy)} ci={ci} opacity={op * 0.28} wm={0.68} />,
        <YarnTube key={`pbu-${i}`} d={purlBottomU(cx, cy)} ci={ci} opacity={op * 0.25} wm={0.65} />
      );
      purlFront.push(
        <YarnTube key={`pbb-${i}`} d={purlBumpBack(cx, cy)} ci={ci} opacity={op * 0.28} wm={0.62} />,
        <YarnTube key={`pbf-${i}`} d={purlBumpFront(cx, cy)} ci={ci} opacity={op} wm={1.15} />
      );
    } else {
      topArcs.push(
        <YarnTube key={`ta-${i}`} d={knitTopArc(cx, cy)} ci={ci} opacity={op * 0.35} wm={0.78} />
      );
      legs.push(
        <YarnTube key={`ll-${i}`} d={knitLeftLeg(cx, cy)} ci={ci} opacity={op} />,
        <YarnTube key={`rl-${i}`} d={knitRightLeg(cx, cy)} ci={ci} opacity={op} />
      );
      bottomUs.push(
        <YarnTube key={`bu-${i}`} d={knitBottomU(cx, cy)} ci={ci} opacity={op} wm={1.05} />
      );
    }
  }

  return (
    <g>
      {topArcs}
      {purlBehind}
      {legs}
      {bottomUs}
      {purlFront}
    </g>
  );
}

// --- Pattern Preview (compact) ---
function PatternPreview({ pattern, currentRow }: { pattern: StitchData[][]; currentRow: number }) {
  if (!pattern?.length) return null;
  const cell = 5;
  const vis = Math.min(10, pattern.length);
  const start = Math.max(0, currentRow - 1);
  const rows = pattern.slice(start, start + vis);
  return (
    <svg width={cell * COLS + 2} height={cell * vis + 2}
      style={{ border: '1px solid #D4C4B0', borderRadius: 3, background: '#FBF7F1' }}>
      {rows.map((row, ri) => row.map((s, ci) => {
        const active = start + ri === currentRow;
        return (
          <g key={`${ri}-${ci}`}>
            <rect x={ci * cell + 1} y={ri * cell + 1} width={cell} height={cell}
              fill={PALETTE[s.color]?.hex || PALETTE[0].hex}
              stroke={active ? '#4A3A2A' : '#EAE0D4'}
              strokeWidth={active ? 1 : 0.25} />
            {s.type === PURL && (
              <line x1={ci * cell + 1.5} y1={ri * cell + cell / 2 + 1}
                x2={ci * cell + cell - 0.5} y2={ri * cell + cell / 2 + 1}
                stroke="rgba(0,0,0,0.25)" strokeWidth={0.6} />
            )}
          </g>
        );
      }))}
    </svg>
  );
}

// --- Pattern Definitions ---
const PATTERNS = [
  { name: "Free Knit", desc: "Any color & stitch", generate: () => [] as StitchData[][] },
  {
    name: "Stockinette", desc: "All knit loops",
    generate: (R: number, C: number) => Array.from({ length: R }, () =>
      Array.from({ length: C }, () => ({ color: 0, type: KNIT })))
  },
  {
    name: "Garter", desc: "Knit/purl rows",
    generate: (R: number, C: number) => Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, () => ({ color: 0, type: r % 2 === 0 ? KNIT : PURL })))
  },
  {
    name: "Seed Stitch", desc: "K/P checkerboard",
    generate: (R: number, C: number) => Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, (_, c) => ({ color: 0, type: (r + c) % 2 === 0 ? KNIT : PURL })))
  },
  {
    name: "2x2 Rib", desc: "Ribbed columns",
    generate: (R: number, C: number) => Array.from({ length: R }, () =>
      Array.from({ length: C }, (_, c) => ({ color: 0, type: Math.floor(c / 2) % 2 === 0 ? KNIT : PURL })))
  },
  {
    name: "Basket", desc: "Block texture",
    generate: (R: number, C: number) => Array.from({ length: R }, (_, r) =>
      Array.from({ length: C }, (_, c) => ({
        color: 0, type: (Math.floor(r / 4) + Math.floor(c / 4)) % 2 === 0 ? KNIT : PURL
      })))
  },
  {
    name: "Stripes", desc: "Color stripes",
    generate: (R: number, C: number) => {
      const cs = [0, 2, 5, 4];
      return Array.from({ length: R }, (_, r) =>
        Array.from({ length: C }, () => ({ color: cs[Math.floor(r / 2) % cs.length], type: KNIT })));
    }
  },
  {
    name: "Fair Isle", desc: "Diamond motif",
    generate: (R: number, C: number) => {
      const m = [
        [0,0,0,0,2,0,0,0,0,0],[0,0,0,2,5,2,0,0,0,0],[0,0,2,5,5,5,2,0,0,0],
        [0,2,5,5,3,5,5,2,0,0],[2,5,5,3,3,3,5,5,2,0],[0,2,5,5,3,5,5,2,0,0],
        [0,0,2,5,5,5,2,0,0,0],[0,0,0,2,5,2,0,0,0,0],[0,0,0,0,2,0,0,0,0,0],
        [0,0,0,0,0,0,0,0,0,0],
      ];
      return Array.from({ length: R }, (_, r) =>
        Array.from({ length: C }, (_, c) => ({ color: m[r % m.length][c % m[0].length], type: KNIT })));
    }
  },
  {
    name: "Hearts", desc: "Heart motif",
    generate: (R: number, C: number) => {
      const m = [
        [1,0,0,0,0,0,0,0,0,0],[1,0,6,0,0,0,6,0,0,0],[1,6,6,6,0,6,6,6,0,0],
        [1,6,6,6,6,6,6,6,0,0],[1,0,6,6,6,6,6,0,0,0],[1,0,0,6,6,6,0,0,0,0],
        [1,0,0,0,6,0,0,0,0,0],[1,0,0,0,0,0,0,0,0,0],
      ];
      return Array.from({ length: R }, (_, r) =>
        Array.from({ length: C }, (_, c) => ({ color: m[r % m.length][c % m[0].length], type: KNIT })));
    }
  },
];

// --- Main Game ---
interface HistoryState {
  activeRow: (StitchData | null)[];
  curIdx: number;
  score: number;
  streak: number;
  totalRows: number;
  dir: number;
  completedRows: (StitchData | null)[][];
}

export default function KnitGame() {
  const [completedRows, setCompletedRows] = useState<(StitchData | null)[][]>([]);
  const [activeRow, setActiveRow] = useState<(StitchData | null)[]>(new Array(COLS).fill(null));
  const [curIdx, setCurIdx] = useState(0);
  const [selColor, setSelColor] = useState(0);
  const [animIdx, setAnimIdx] = useState(-1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [patIdx, setPatIdx] = useState(0);
  const [totalRows, setTotalRows] = useState(0);
  const [dir, setDir] = useState(1);
  const [showMenu, setShowMenu] = useState(false);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  const pattern = useMemo(() => {
    const gen = PATTERNS[patIdx].generate;
    return gen ? gen(300, COLS) : [];
  }, [patIdx]);

  const visibleRows = MAX_ROWS;
  const CANVAS_H = STITCH_H * (visibleRows + 1) + TOP_PAD + 10;

  const changePattern = useCallback((newIdx: number) => {
    setPatIdx(newIdx);
    setCompletedRows([]); setActiveRow(new Array(COLS).fill(null));
    setCurIdx(0); setScore(0); setStreak(0); setTotalRows(0); setDir(1);
    setHistory([]);
  }, []);

  const actualIdx = dir === 1 ? curIdx : COLS - 1 - curIdx;

  const expected = useCallback((row: number, col: number) => {
    if (!pattern.length) return null;
    return pattern[row % pattern.length]?.[col] ?? null;
  }, [pattern]);

  const doStitch = useCallback((stitchType: number) => {
    if (curIdx >= COLS) return;
    const si = dir === 1 ? curIdx : COLS - 1 - curIdx;
    setAnimIdx(si);

    setHistory(h => [...h, {
      activeRow: [...activeRow],
      curIdx,
      score,
      streak,
      totalRows,
      dir,
      completedRows: completedRows.map(r => [...r]),
    }]);

    const exp = expected(totalRows, si);
    if (exp) {
      const cm = exp.color === selColor;
      const tm = exp.type === stitchType;
      if (cm && tm) { setScore(s => s + 10 + streak * 2); setStreak(s => Math.min(s + 1, 15)); }
      else if (cm || tm) { setScore(s => s + 4); setStreak(0); }
      else setStreak(0);
    } else setScore(s => s + 3);

    const nr = [...activeRow];
    nr[si] = { color: selColor, type: stitchType };
    setActiveRow(nr);
    setTimeout(() => setAnimIdx(-1), 120);

    if (curIdx + 1 >= COLS) {
      setTimeout(() => {
        setCompletedRows(prev => [nr, ...prev].slice(0, MAX_ROWS));
        setActiveRow(new Array(COLS).fill(null));
        setCurIdx(0); setTotalRows(t => t + 1); setDir(d => -d);
      }, 180);
    } else setCurIdx(s => s + 1);
  }, [curIdx, dir, activeRow, selColor, streak, expected, totalRows, score, completedRows]);

  const undo = useCallback(() => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setActiveRow(prev.activeRow);
    setCurIdx(prev.curIdx);
    setScore(prev.score);
    setStreak(prev.streak);
    setTotalRows(prev.totalRows);
    setDir(prev.dir);
    setCompletedRows(prev.completedRows);
    setAnimIdx(-1);
  }, [history]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); doStitch(KNIT); }
      if (e.code === 'KeyP') { e.preventDefault(); doStitch(PURL); }
      if (e.code === 'ArrowRight') { e.preventDefault(); setSelColor(c => (c + 1) % PALETTE.length); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); setSelColor(c => (c - 1 + PALETTE.length) % PALETTE.length); }
      if (e.code === 'KeyZ' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); undo(); }
      if (e.code === 'Backspace') { e.preventDefault(); undo(); }
      const n = parseInt(e.key); if (!isNaN(n) && n >= 0 && n <= 9) setSelColor(n);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [doStitch, undo]);

  const rowY = TOP_PAD;
  const nextExp = expected(totalRows, actualIdx);
  const nextColor = nextExp ? PALETTE[nextExp.color] : null;
  const nextType = nextExp ? nextExp.type : null;

  return (
    <div style={{
      height: '100dvh', width: '100vw',
      background: 'linear-gradient(165deg, #F6EDE2 0%, #EDE2D4 45%, #E5DAC8 100%)',
      fontFamily: "'Georgia', 'Palatino', serif",
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', boxSizing: 'border-box',
    }}>

      {/* Top Bar: Title + Stats + Pattern Selector */}
      <div style={{
        padding: '10px 14px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontSize: 24, fontWeight: 500, color: '#4A3A2A',
            letterSpacing: 4, fontVariant: 'small-caps', lineHeight: 1,
          }}>knitcraft</div>
        </div>

        <div style={{ display: 'flex', gap: 14, fontSize: 15, color: '#7B6B5B', letterSpacing: 0.5 }}>
          <span><b style={{ color: '#4A3A2A' }}>{totalRows}</b> rows</span>
          <span><b style={{ color: '#4A3A2A' }}>{score}</b> pts</span>
          {streak > 1 && <span style={{ color: '#B44D3A' }}>x{streak}</span>}
        </div>

        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowMenu(!showMenu)} style={{
            background: '#FBF7F1', border: '1px solid #D4C4B0', borderRadius: 8,
            padding: '6px 14px', fontSize: 14, color: '#4A3A2A', cursor: 'pointer',
            letterSpacing: 0.8, fontFamily: 'inherit',
          }}>{PATTERNS[patIdx].name} &#9662;</button>
          {showMenu && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 100,
              background: '#FBF7F1', border: '1px solid #D4C4B0', borderRadius: 5,
              padding: 3, boxShadow: '0 4px 16px rgba(0,0,0,0.10)', minWidth: 150,
            }}>
              {PATTERNS.map((p, i) => (
                <div key={i}
                  onClick={() => { changePattern(i); setShowMenu(false); }}
                  style={{
                    padding: '8px 12px', fontSize: 14, borderRadius: 5, cursor: 'pointer',
                    color: i === patIdx ? '#B44D3A' : '#4A3A2A',
                    fontWeight: i === patIdx ? 600 : 400,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#EDE2D4')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div>{p.name}</div>
                  <div style={{ fontSize: 12, color: '#9B8B7B' }}>{p.desc}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{
        margin: '0 12px 4px', height: 3, background: '#E0D4C4', borderRadius: 2, flexShrink: 0,
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: `${(curIdx / COLS) * 100}%`,
          background: 'linear-gradient(90deg, #B44D3A, #C49525)',
          transition: 'width 0.1s ease',
        }} />
      </div>

      {/* Direction + Stitch Count */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 10, fontSize: 14,
        color: '#8B7B6B', marginBottom: 2, flexShrink: 0,
      }}>
        <span>{dir === 1 ? '\u2192' : '\u2190'} Stitch {curIdx + 1} of {COLS}</span>
        {nextExp && (
          <>
            <span style={{ color: '#D4C4B0' }}>&middot;</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              next:
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                background: nextColor?.hex, border: '1.5px solid #C8BA9C',
                verticalAlign: 'middle',
              }} />
              <b>{nextType === PURL ? 'P' : 'K'}</b>
            </span>
          </>
        )}
      </div>

      {/* Row Guide — shows current row stitches when a pattern is active */}
      {pattern.length > 0 && (() => {
        const rowData = pattern[totalRows % pattern.length];
        if (!rowData) return null;
        // In reverse direction, display the row reversed
        const displayRow = dir === 1 ? rowData : [...rowData].reverse();
        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 2,
            padding: '4px 12px', flexShrink: 0,
            overflowX: 'auto', justifyContent: 'center',
          }}>
            {displayRow.map((s, i) => {
              const done = i < curIdx;
              const isCurrent = i === curIdx;
              const c = PALETTE[s.color] || PALETTE[0];
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  opacity: done ? 0.3 : 1,
                  transform: isCurrent ? 'scale(1.25)' : 'scale(1)',
                  transition: 'transform 0.15s ease, opacity 0.15s ease',
                  zIndex: isCurrent ? 1 : 0,
                }}>
                  <div style={{
                    width: isCurrent ? 22 : 16,
                    height: isCurrent ? 22 : 16,
                    borderRadius: '50%',
                    background: `radial-gradient(circle at 38% 35%, ${c.hi}, ${c.hex} 60%, ${c.shadow})`,
                    border: isCurrent ? '2px solid #4A3A2A' : '1px solid #D4C4B0',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isCurrent ? '0 1px 6px rgba(74,58,42,0.3)' : 'none',
                  }}>
                    <span style={{
                      fontSize: isCurrent ? 10 : 7,
                      fontWeight: 700,
                      color: [0, 1, 5, 6, 8].includes(s.color) ? '#3A2A1A' : '#FFF',
                      lineHeight: 1,
                    }}>
                      {s.type === PURL ? 'P' : 'K'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Middle: Canvas + Yarn Colors */}
      <div style={{
        flex: '1 1 0', display: 'flex', gap: 6,
        minHeight: 0, padding: '0 4px',
        overflow: 'hidden',
      }}>

        {/* Canvas */}
        <div ref={svgContainerRef} style={{
          flex: 1, background: '#FBF7F1', borderRadius: 8,
          border: '1px solid #DDD0C0',
          overflow: 'hidden',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        }}>
          <svg
            width="100%"
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            preserveAspectRatio="xMidYMin meet"
            style={{ display: 'block', maxHeight: '100%' }}
          >
            <Needle y={rowY} variant="back" />

            {[...completedRows].reverse().map((row, ri) => {
              const idx = completedRows.length - 1 - ri;
              const y = rowY + STITCH_H + idx * STITCH_H;
              if (y > CANVAS_H) return null;
              return <FabricRow key={`cr-${idx}`} stitches={row} y={y} />;
            })}

            <FabricRow stitches={activeRow} y={rowY} animIdx={animIdx} />

            {activeRow.map((s, i) => {
              if (s) return null;
              const cx = NEEDLE_OVERHANG + i * STITCH_W + STITCH_W / 2;
              const cy = rowY + STITCH_H / 2;
              const isNext = i === actualIdx;
              return (
                <circle key={`m-${i}`} cx={cx} cy={cy}
                  r={isNext ? 4 : 1.5}
                  fill={isNext ? (nextExp ? PALETTE[nextExp.color].hex : PALETTE[selColor].hex) : 'none'}
                  stroke={isNext ? '#4A3A2A' : '#D4C4B0'}
                  strokeWidth={isNext ? 1.3 : 0.4}
                  opacity={isNext ? 0.50 : 0.12}>
                  {isNext && <animate attributeName="r" values="3;5;3" dur="1.3s" repeatCount="indefinite" />}
                </circle>
              );
            })}

            <Needle y={rowY} variant="front" />

            <text x={dir === 1 ? NEEDLE_OVERHANG - 10 : CANVAS_W - NEEDLE_OVERHANG + 8}
              y={rowY + STITCH_H / 2 + 4} fontSize={12} fill="#9B8B7B" textAnchor="middle">
              {dir === 1 ? '\u203A' : '\u2039'}
            </text>
          </svg>
        </div>

        {/* Yarn Palette */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: 3, padding: '4px 2px', flexShrink: 0, width: 44,
          justifyContent: 'flex-start', overflowY: 'auto', minHeight: 0,
        }}>
          <div style={{ fontSize: 8, color: '#8B7B6B', letterSpacing: 1, marginBottom: 1 }}>YARN</div>
          {PALETTE.map((c, i) => (
            <button key={i} onClick={() => setSelColor(i)}
              style={{
                width: i === selColor ? 34 : 26,
                height: i === selColor ? 34 : 26,
                borderRadius: '50%',
                background: `radial-gradient(circle at 38% 35%, ${c.hi}, ${c.hex} 55%, ${c.shadow})`,
                border: i === selColor ? '2.5px solid #4A3A2A' : '1.5px solid #D4C4B0',
                cursor: 'pointer', transition: 'all 0.12s ease', padding: 0,
                boxShadow: i === selColor ? '0 2px 8px rgba(74,58,42,0.3)' : 'none',
                position: 'relative', flexShrink: 0,
              }}>
              <div style={{
                position: 'absolute', top: '18%', left: '22%', width: '56%', height: '64%',
                borderRadius: '50%',
                background: `repeating-linear-gradient(-35deg, transparent, transparent 1.5px,
                  rgba(255,255,255,0.12) 1.5px, rgba(255,255,255,0.12) 2.5px)`,
                pointerEvents: 'none',
              }} />
            </button>
          ))}

          {/* Undo button */}
          <div style={{ marginTop: 'auto', paddingTop: 6, flexShrink: 0 }}>
            <button onClick={undo}
              disabled={!history.length}
              style={{
                width: 36, height: 36, borderRadius: 8,
                background: history.length ? '#FBF7F1' : '#EDE2D4',
                border: `1.5px solid ${history.length ? '#C4B4A0' : '#DDD0C0'}`,
                cursor: history.length ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: history.length ? 1 : 0.4,
                color: '#7B6B5B', fontSize: 16,
                boxShadow: history.length ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              }}
              title="Undo last stitch"
            >
              &#8617;
            </button>
            <div style={{ fontSize: 7, color: '#A89B8B', textAlign: 'center', marginTop: 2 }}>
              UNDO
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Preview (if active) */}
      {pattern.length > 0 && (
        <div style={{
          display: 'flex', justifyContent: 'center', padding: '4px 12px 2px', flexShrink: 0,
        }}>
          <PatternPreview pattern={pattern} currentRow={totalRows} />
        </div>
      )}

      {/* Bottom: 2x2 Action Buttons */}
      <div style={{
        padding: '6px 10px max(14px, env(safe-area-inset-bottom, 14px))',
        flexShrink: 0,
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
          maxWidth: 400,
          margin: '0 auto',
        }}>
          {/* Top row: PURL buttons */}
          <button
            onClick={() => { setSelColor(c => (c - 1 + PALETTE.length) % PALETTE.length); }}
            style={{
              height: 56, borderRadius: 12,
              background: 'linear-gradient(180deg, #F0E8E0 0%, #E8DDD0 100%)',
              border: '1.5px solid #D0C4B4',
              cursor: 'pointer', fontSize: 18, color: '#7B6B5B',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: 22 }}>&lsaquo;</span>
            <span style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 500 }}>COLOR</span>
          </button>

          <button
            onClick={() => doStitch(PURL)}
            style={{
              height: 56, borderRadius: 12,
              background: `linear-gradient(180deg, #6B5B4B 0%, #5A4A3A 100%)`,
              border: '1.5px solid #4A3A2A',
              cursor: 'pointer', fontSize: 15, color: '#F5EDE3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 3px 8px rgba(74,58,42,0.20)',
              fontFamily: 'inherit', letterSpacing: 2, fontWeight: 400,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: 10, opacity: 0.7 }}>&#9552;&#9552;&#9552;</span>
            <span>PURL</span>
          </button>

          {/* Bottom row: KNIT buttons */}
          <button
            onClick={() => { setSelColor(c => (c + 1) % PALETTE.length); }}
            style={{
              height: 56, borderRadius: 12,
              background: 'linear-gradient(180deg, #F0E8E0 0%, #E8DDD0 100%)',
              border: '1.5px solid #D0C4B4',
              cursor: 'pointer', fontSize: 18, color: '#7B6B5B',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
              fontFamily: 'inherit',
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: 12, letterSpacing: 0.5, fontWeight: 500 }}>COLOR</span>
            <span style={{ fontSize: 22 }}>&rsaquo;</span>
          </button>

          <button
            onClick={() => doStitch(KNIT)}
            style={{
              height: 56, borderRadius: 12,
              background: `linear-gradient(180deg, ${PALETTE[selColor].hex} 0%, ${PALETTE[selColor].shadow} 100%)`,
              border: `1.5px solid ${PALETTE[selColor].shadow}`,
              cursor: 'pointer', fontSize: 15,
              color: [0, 1, 5, 6, 8].includes(selColor) ? '#3A2A1A' : '#F5EDE3',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              boxShadow: `0 3px 8px ${PALETTE[selColor].shadow}44`,
              fontFamily: 'inherit', letterSpacing: 2, fontWeight: 500,
              WebkitTapHighlightColor: 'transparent',
              touchAction: 'manipulation',
            }}
          >
            <span style={{ fontSize: 14 }}>&or;</span>
            <span>KNIT</span>
          </button>
        </div>
      </div>
    </div>
  );
}
