// Stitch types — comprehensive knitting vocabulary
export type StitchType =
  | "knit"
  | "purl"
  | "yarn-over"
  | "k2tog"
  | "ssk"
  | "slip"
  | "cable-left"
  | "cable-right"
  | "color-a"
  | "color-b";

export interface Stitch {
  type: StitchType;
  completed: boolean;
  correct: boolean;
}

export interface PatternDef {
  name: string;
  description: string;
  difficulty: number; // 1-5
  stitchTypes: StitchType[];
  width: number;
  rows: StitchType[][];
  color: string;
  unlockLevel: number;
  emoji: string;
  category: "basic" | "texture" | "lace" | "cable" | "colorwork";
}

// Real knitting patterns with progressive difficulty
export const PATTERNS: PatternDef[] = [
  // ===== BASIC (Levels 1-2) =====
  {
    name: "Garter Stitch",
    description: "The classic beginner stitch — all knits!",
    difficulty: 1,
    stitchTypes: ["knit"],
    width: 8,
    category: "basic",
    rows: [
      ["knit","knit","knit","knit","knit","knit","knit","knit"],
    ],
    color: "#e8b4b8",
    unlockLevel: 1,
    emoji: "🧶",
  },
  {
    name: "Stockinette",
    description: "Alternating knit & purl rows — smooth & classic",
    difficulty: 1,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "basic",
    rows: [
      ["knit","knit","knit","knit","knit","knit","knit","knit"],
      ["purl","purl","purl","purl","purl","purl","purl","purl"],
    ],
    color: "#b4d8e8",
    unlockLevel: 1,
    emoji: "🧣",
  },

  // ===== TEXTURE (Levels 2-5) =====
  {
    name: "1x1 Ribbing",
    description: "Alternating knit & purl — stretchy & rhythmic",
    difficulty: 2,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "texture",
    rows: [
      ["knit","purl","knit","purl","knit","purl","knit","purl"],
    ],
    color: "#b8e8b4",
    unlockLevel: 2,
    emoji: "🧤",
  },
  {
    name: "2x2 Ribbing",
    description: "Two knits, two purls — chunky & cozy",
    difficulty: 2,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "texture",
    rows: [
      ["knit","knit","purl","purl","knit","knit","purl","purl"],
    ],
    color: "#e8d4b4",
    unlockLevel: 3,
    emoji: "🎀",
  },
  {
    name: "Seed Stitch",
    description: "Checkerboard of knits & purls — textured & bumpy",
    difficulty: 3,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "texture",
    rows: [
      ["knit","purl","knit","purl","knit","purl","knit","purl"],
      ["purl","knit","purl","knit","purl","knit","purl","knit"],
    ],
    color: "#d4b4e8",
    unlockLevel: 4,
    emoji: "🌸",
  },
  {
    name: "Moss Stitch",
    description: "2-row shifted checkerboard — elegant texture",
    difficulty: 3,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "texture",
    rows: [
      ["knit","purl","knit","purl","knit","purl","knit","purl"],
      ["knit","purl","knit","purl","knit","purl","knit","purl"],
      ["purl","knit","purl","knit","purl","knit","purl","knit"],
      ["purl","knit","purl","knit","purl","knit","purl","knit"],
    ],
    color: "#8bc49e",
    unlockLevel: 5,
    emoji: "🌿",
  },
  {
    name: "Basket Weave",
    description: "Blocks of knit & purl — woven texture",
    difficulty: 3,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "texture",
    rows: [
      ["knit","knit","knit","knit","purl","purl","purl","purl"],
      ["knit","knit","knit","knit","purl","purl","purl","purl"],
      ["purl","purl","purl","purl","knit","knit","knit","knit"],
      ["purl","purl","purl","purl","knit","knit","knit","knit"],
    ],
    color: "#c8b490",
    unlockLevel: 5,
    emoji: "🧺",
  },

  // ===== LACE (Levels 6-9) =====
  {
    name: "Eyelet Row",
    description: "Yarn overs & decreases — delicate holes",
    difficulty: 4,
    stitchTypes: ["knit", "purl", "yarn-over", "k2tog"],
    width: 8,
    category: "lace",
    rows: [
      ["knit","yarn-over","k2tog","knit","knit","yarn-over","k2tog","knit"],
      ["purl","purl","purl","purl","purl","purl","purl","purl"],
    ],
    color: "#f0c4d4",
    unlockLevel: 6,
    emoji: "🕊️",
  },
  {
    name: "Feather & Fan",
    description: "Classic lace wave pattern — beautiful drape",
    difficulty: 4,
    stitchTypes: ["knit", "purl", "yarn-over", "k2tog"],
    width: 8,
    category: "lace",
    rows: [
      ["k2tog","k2tog","yarn-over","knit","knit","yarn-over","k2tog","k2tog"],
      ["purl","purl","purl","purl","purl","purl","purl","purl"],
      ["knit","knit","knit","knit","knit","knit","knit","knit"],
      ["purl","purl","purl","purl","purl","purl","purl","purl"],
    ],
    color: "#a8d8f0",
    unlockLevel: 7,
    emoji: "🪶",
  },
  {
    name: "Chevron Lace",
    description: "Zigzag lace — dramatic & flowing",
    difficulty: 5,
    stitchTypes: ["knit", "purl", "yarn-over", "k2tog", "ssk"],
    width: 8,
    category: "lace",
    rows: [
      ["ssk","knit","yarn-over","knit","knit","yarn-over","knit","k2tog"],
      ["purl","purl","purl","purl","purl","purl","purl","purl"],
    ],
    color: "#d4c0f0",
    unlockLevel: 8,
    emoji: "〰️",
  },

  // ===== CABLES (Levels 8-11) =====
  {
    name: "Simple Cable",
    description: "Your first cable — twisted rope effect",
    difficulty: 4,
    stitchTypes: ["knit", "purl", "cable-right"],
    width: 8,
    category: "cable",
    rows: [
      ["purl","purl","knit","knit","knit","knit","purl","purl"],
      ["purl","purl","knit","knit","knit","knit","purl","purl"],
      ["purl","purl","cable-right","cable-right","knit","knit","purl","purl"],
      ["purl","purl","knit","knit","knit","knit","purl","purl"],
    ],
    color: "#d4c4a8",
    unlockLevel: 8,
    emoji: "🪢",
  },
  {
    name: "Braided Cable",
    description: "Crossing cables — rope-like braid",
    difficulty: 5,
    stitchTypes: ["knit", "purl", "cable-left", "cable-right"],
    width: 8,
    category: "cable",
    rows: [
      ["purl","knit","knit","knit","knit","knit","knit","purl"],
      ["purl","knit","knit","knit","knit","knit","knit","purl"],
      ["purl","cable-right","cable-right","knit","knit","cable-left","cable-left","purl"],
      ["purl","knit","knit","knit","knit","knit","knit","purl"],
      ["purl","knit","knit","cable-left","cable-left","knit","knit","purl"],
      ["purl","knit","knit","knit","knit","knit","knit","purl"],
    ],
    color: "#b8a888",
    unlockLevel: 10,
    emoji: "🫧",
  },

  // ===== COLORWORK (Levels 9-12) =====
  {
    name: "Stripes",
    description: "Simple two-color stripes — bold & fun",
    difficulty: 3,
    stitchTypes: ["color-a", "color-b"],
    width: 8,
    category: "colorwork",
    rows: [
      ["color-a","color-a","color-a","color-a","color-a","color-a","color-a","color-a"],
      ["color-a","color-a","color-a","color-a","color-a","color-a","color-a","color-a"],
      ["color-b","color-b","color-b","color-b","color-b","color-b","color-b","color-b"],
      ["color-b","color-b","color-b","color-b","color-b","color-b","color-b","color-b"],
    ],
    color: "#e0a0a0",
    unlockLevel: 9,
    emoji: "🌈",
  },
  {
    name: "Checkerboard",
    description: "Alternating color blocks — graphic & bold",
    difficulty: 4,
    stitchTypes: ["color-a", "color-b"],
    width: 8,
    category: "colorwork",
    rows: [
      ["color-a","color-a","color-b","color-b","color-a","color-a","color-b","color-b"],
      ["color-a","color-a","color-b","color-b","color-a","color-a","color-b","color-b"],
      ["color-b","color-b","color-a","color-a","color-b","color-b","color-a","color-a"],
      ["color-b","color-b","color-a","color-a","color-b","color-b","color-a","color-a"],
    ],
    color: "#c0b0d0",
    unlockLevel: 10,
    emoji: "🏁",
  },
  {
    name: "Fair Isle Hearts",
    description: "Two-color heart motif — cozy & cute",
    difficulty: 5,
    stitchTypes: ["color-a", "color-b"],
    width: 8,
    category: "colorwork",
    rows: [
      ["color-a","color-a","color-a","color-a","color-a","color-a","color-a","color-a"],
      ["color-a","color-b","color-a","color-a","color-a","color-b","color-a","color-a"],
      ["color-b","color-b","color-b","color-a","color-b","color-b","color-b","color-a"],
      ["color-b","color-b","color-b","color-a","color-b","color-b","color-b","color-a"],
      ["color-a","color-b","color-b","color-b","color-a","color-b","color-b","color-b"],
      ["color-a","color-a","color-b","color-a","color-a","color-a","color-b","color-a"],
    ],
    color: "#e8a0b0",
    unlockLevel: 12,
    emoji: "❤️",
  },
  {
    name: "Diamond Brocade",
    description: "A diamond pattern — impressive & satisfying",
    difficulty: 5,
    stitchTypes: ["knit", "purl"],
    width: 8,
    category: "texture",
    rows: [
      ["knit","knit","knit","purl","knit","knit","knit","knit"],
      ["knit","knit","purl","knit","purl","knit","knit","knit"],
      ["knit","purl","knit","knit","knit","purl","knit","knit"],
      ["purl","knit","knit","knit","knit","knit","purl","knit"],
      ["knit","purl","knit","knit","knit","purl","knit","knit"],
      ["knit","knit","purl","knit","purl","knit","knit","knit"],
    ],
    color: "#c4a4e0",
    unlockLevel: 6,
    emoji: "💎",
  },
];

export const YARN_COLORS = [
  { name: "Rose", hex: "#e8a0a0", unlockLevel: 1 },
  { name: "Sky", hex: "#a0c8e8", unlockLevel: 1 },
  { name: "Sage", hex: "#a0d8a0", unlockLevel: 2 },
  { name: "Butter", hex: "#e8d8a0", unlockLevel: 3 },
  { name: "Lavender", hex: "#c8a0e8", unlockLevel: 4 },
  { name: "Coral", hex: "#e8b0a0", unlockLevel: 5 },
  { name: "Mint", hex: "#a0e8d0", unlockLevel: 6 },
  { name: "Blush", hex: "#e8a0c0", unlockLevel: 7 },
  { name: "Storm", hex: "#8090a8", unlockLevel: 8 },
  { name: "Gold", hex: "#d4a848", unlockLevel: 10 },
  { name: "Midnight", hex: "#4a4a6a", unlockLevel: 11 },
  { name: "Rainbow", hex: "rainbow", unlockLevel: 12 },
];

export const STITCH_INFO: Record<StitchType, { symbol: string; label: string; color: string; bgColor: string }> = {
  knit:          { symbol: "V",  label: "Knit",   color: "#ffffff", bgColor: "#d45e5e" },
  purl:          { symbol: "—",  label: "Purl",   color: "#ffffff", bgColor: "#5e8ed4" },
  "yarn-over":   { symbol: "O",  label: "YO",     color: "#ffffff", bgColor: "#d4a85e" },
  k2tog:         { symbol: "⟋",  label: "K2tog",  color: "#ffffff", bgColor: "#5ed49e" },
  ssk:           { symbol: "⟍",  label: "SSK",    color: "#ffffff", bgColor: "#9e5ed4" },
  slip:          { symbol: "→",  label: "Slip",   color: "#ffffff", bgColor: "#888888" },
  "cable-left":  { symbol: "↶",  label: "CL",     color: "#ffffff", bgColor: "#c47a30" },
  "cable-right": { symbol: "↷",  label: "CR",     color: "#ffffff", bgColor: "#8b5e14" },
  "color-a":     { symbol: "■",  label: "A",      color: "#ffffff", bgColor: "#d45e5e" },
  "color-b":     { symbol: "■",  label: "B",      color: "#ffffff", bgColor: "#5e8ed4" },
};

export interface GameState {
  screen: "menu" | "playing" | "paused" | "levelComplete" | "gameOver";
  level: number;
  score: number;
  combo: number;
  maxCombo: number;
  lives: number;
  currentPattern: PatternDef;
  currentRowIndex: number;
  currentStitchIndex: number;
  completedRows: { stitches: Stitch[]; yarnColor: string }[];
  currentRowStitches: Stitch[];
  totalStitches: number;
  perfectRows: number;
  rowsToComplete: number;
  yarnColorIndex: number;
  floatingScores: { id: number; value: number; x: number; y: number }[];
  highScore: number;
  totalLifetimeStitches: number;
  unlockedCategories: string[];
}

export function getPatternForLevel(level: number): PatternDef {
  const available = PATTERNS.filter(p => p.unlockLevel <= level);
  // Bias toward recently unlocked patterns
  const weights = available.map(p => {
    const diff = level - p.unlockLevel;
    if (diff <= 1) return 4; // just unlocked = very likely
    if (diff <= 3) return 2;
    return 1;
  });
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * totalWeight;
  for (let i = 0; i < available.length; i++) {
    r -= weights[i];
    if (r <= 0) return available[i];
  }
  return available[available.length - 1];
}

export function getRowTarget(level: number): number {
  return Math.min(4 + Math.floor(level * 1.2), 16);
}

export function getScoreForStitch(combo: number, level: number): number {
  const base = 10;
  const comboMult = 1 + Math.min(combo, 30) * 0.1;
  const levelMult = 1 + (level - 1) * 0.15;
  return Math.round(base * comboMult * levelMult);
}

export function getLivesForLevel(level: number): number {
  // Start generous, get tighter
  if (level <= 2) return 5;
  if (level <= 5) return 4;
  return 3;
}
