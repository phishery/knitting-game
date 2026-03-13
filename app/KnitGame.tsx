"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  StitchType,
  Stitch,
  PatternDef,
  GameState,
  PATTERNS,
  YARN_COLORS,
  STITCH_INFO,
  START_LEVEL,
  getPatternForLevel,
  getRowTarget,
  getScoreForStitch,
  getLivesForLevel,
  getTimeForLevel,
  getTimerBonus,
  getUnlockedCategories,
} from "./game-engine";
import StitchSVG from "./StitchSVG";
import YarnPhysics from "./YarnPhysics";

function getYarnColor(index: number): string {
  const c = YARN_COLORS[index % YARN_COLORS.length];
  if (c.hex === "rainbow") {
    const hue = (Date.now() / 20) % 360;
    return `hsl(${hue}, 70%, 70%)`;
  }
  return c.hex;
}

function loadHighScore(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("knitty-highscore") || "0", 10);
}
function loadLifetimeStitches(): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem("knitty-lifetime") || "0", 10);
}
function saveHighScore(score: number) {
  localStorage.setItem("knitty-highscore", score.toString());
}
function saveLifetimeStitches(n: number) {
  localStorage.setItem("knitty-lifetime", n.toString());
}

function initLevel(level: number, prevState?: Partial<GameState>): GameState {
  const pattern = getPatternForLevel(level);
  const rowTarget = getRowTarget(level);
  return {
    screen: "playing",
    level,
    score: prevState?.score ?? 0,
    combo: 0,
    maxCombo: prevState?.maxCombo ?? 0,
    lives: getLivesForLevel(level),
    currentPattern: pattern,
    currentRowIndex: 0,
    currentStitchIndex: 0,
    completedRows: [],
    currentRowStitches: [],
    totalStitches: prevState?.totalStitches ?? 0,
    perfectRows: 0,
    rowsToComplete: rowTarget,
    yarnColorIndex: prevState?.yarnColorIndex ?? 0,
    floatingScores: [],
    highScore: prevState?.highScore ?? loadHighScore(),
    totalLifetimeStitches: prevState?.totalLifetimeStitches ?? loadLifetimeStitches(),
    unlockedCategories: getUnlockedCategories(level),
    timeRemaining: getTimeForLevel(level),
    timerBonus: 0,
  };
}

function getCurrentTargetRow(pattern: PatternDef, rowIndex: number): StitchType[] {
  return pattern.rows[rowIndex % pattern.rows.length];
}

let floatingIdCounter = 0;

// Static NeedleSVG and YarnStrand removed — replaced by YarnPhysics canvas

export default function KnitGame() {
  const [game, setGame] = useState<GameState>({
    ...initLevel(START_LEVEL),
    screen: "menu",
  });
  const fabricRef = useRef<HTMLDivElement>(null);
  const workAreaRef = useRef<HTMLDivElement>(null);
  const [shakeRow, setShakeRow] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (game.screen === "playing") {
      const timer = setInterval(() => {
        setGame((prev) => {
          if (prev.screen !== "playing") return prev;
          const newTime = prev.timeRemaining - 1;
          if (newTime <= 0) {
            if (prev.score > prev.highScore) saveHighScore(prev.score);
            saveLifetimeStitches(prev.totalLifetimeStitches);
            return { ...prev, screen: "gameOver", timeRemaining: 0, highScore: Math.max(prev.highScore, prev.score) };
          }
          return { ...prev, timeRemaining: newTime };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [game.screen, game.level]);

  const haptic = useCallback((ms: number = 15) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(ms);
  }, []);

  const handleStitch = useCallback((tappedType: StitchType) => {
    setGame((prev) => {
      if (prev.screen !== "playing") return prev;
      const targetRow = getCurrentTargetRow(prev.currentPattern, prev.currentRowIndex);
      const expectedType = targetRow[prev.currentStitchIndex];
      const isCorrect = tappedType === expectedType;

      const newStitch: Stitch = { type: tappedType, completed: true, correct: isCorrect };
      const newCurrentRow = [...prev.currentRowStitches, newStitch];
      const newCombo = isCorrect ? prev.combo + 1 : 0;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      const newLives = isCorrect ? prev.lives : prev.lives - 1;
      let newScore = prev.score;
      let newFloating = [...prev.floatingScores];
      const newTotalStitches = prev.totalStitches + 1;
      const newLifetime = prev.totalLifetimeStitches + 1;
      let newTime = prev.timeRemaining + (isCorrect ? 0.5 : 0);

      if (isCorrect) {
        const pts = getScoreForStitch(newCombo, prev.level);
        newScore += pts;
        haptic(15);
        newFloating.push({ id: ++floatingIdCounter, value: pts, x: (prev.currentStitchIndex / prev.currentPattern.width) * 80 + 10, y: 40 });
        if (newFloating.length > 8) newFloating = newFloating.slice(-8);
      } else {
        haptic(50);
        newTime -= 2;
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 400);
      }

      // Row complete
      if (newCurrentRow.length >= prev.currentPattern.width) {
        const isPerfectRow = newCurrentRow.every((s) => s.correct);
        const newPerfectRows = isPerfectRow ? prev.perfectRows + 1 : prev.perfectRows;
        if (isPerfectRow) {
          const rowBonus = 50 * prev.level;
          newScore += rowBonus;
          newTime += 3;
          newFloating.push({ id: ++floatingIdCounter, value: rowBonus, x: 50, y: 25 });
        }
        const newCompletedRows = [...prev.completedRows, { stitches: newCurrentRow, yarnColor: getYarnColor(prev.yarnColorIndex) }];
        const newRowIndex = prev.currentRowIndex + 1;

        if (newCompletedRows.length >= prev.rowsToComplete) {
          const tBonus = getTimerBonus(Math.round(newTime), prev.level);
          const lvlBonus = prev.level * 100 + newPerfectRows * 50;
          newScore += lvlBonus + tBonus;
          if (newScore > prev.highScore) saveHighScore(newScore);
          saveLifetimeStitches(newLifetime);
          return { ...prev, screen: "levelComplete", score: newScore, combo: newCombo, maxCombo: newMaxCombo, lives: newLives, currentRowIndex: newRowIndex, currentStitchIndex: 0, completedRows: newCompletedRows, currentRowStitches: [], totalStitches: newTotalStitches, perfectRows: newPerfectRows, floatingScores: newFloating, highScore: Math.max(prev.highScore, newScore), totalLifetimeStitches: newLifetime, timeRemaining: Math.round(newTime), timerBonus: tBonus };
        }
        return { ...prev, score: newScore, combo: newCombo, maxCombo: newMaxCombo, lives: newLives, currentRowIndex: newRowIndex, currentStitchIndex: 0, completedRows: newCompletedRows, currentRowStitches: [], totalStitches: newTotalStitches, perfectRows: newPerfectRows, floatingScores: newFloating, totalLifetimeStitches: newLifetime, timeRemaining: Math.round(newTime), timerBonus: 0 };
      }

      if (newLives <= 0) {
        if (newScore > prev.highScore) saveHighScore(newScore);
        saveLifetimeStitches(newLifetime);
        return { ...prev, screen: "gameOver", score: newScore, combo: 0, maxCombo: newMaxCombo, lives: 0, currentStitchIndex: prev.currentStitchIndex + 1, currentRowStitches: newCurrentRow, totalStitches: newTotalStitches, floatingScores: newFloating, highScore: Math.max(prev.highScore, newScore), totalLifetimeStitches: newLifetime, timeRemaining: Math.round(newTime), timerBonus: 0 };
      }

      return { ...prev, score: newScore, combo: newCombo, maxCombo: newMaxCombo, lives: newLives, currentStitchIndex: prev.currentStitchIndex + 1, currentRowStitches: newCurrentRow, totalStitches: newTotalStitches, floatingScores: newFloating, totalLifetimeStitches: newLifetime, timeRemaining: Math.round(newTime), timerBonus: 0 };
    });
  }, [haptic]);

  useEffect(() => {
    if (fabricRef.current) fabricRef.current.scrollTop = fabricRef.current.scrollHeight;
  }, [game.completedRows.length]);

  useEffect(() => {
    if (game.floatingScores.length > 0) {
      const timer = setTimeout(() => setGame((prev) => ({ ...prev, floatingScores: prev.floatingScores.slice(1) })), 800);
      return () => clearTimeout(timer);
    }
  }, [game.floatingScores]);

  const startGame = () => setGame(initLevel(START_LEVEL));
  const nextLevel = () => setGame((prev) => initLevel(prev.level + 1, prev));
  const goToMenu = () => setGame((prev) => ({ ...initLevel(START_LEVEL), screen: "menu" as const, highScore: prev.highScore, totalLifetimeStitches: prev.totalLifetimeStitches }));

  // ============ RENDER ============

  if (game.screen === "menu") return <MenuScreen highScore={game.highScore} lifetime={game.totalLifetimeStitches} onStart={startGame} />;
  if (game.screen === "gameOver") return <GameOverScreen score={game.score} highScore={game.highScore} level={game.level} maxCombo={game.maxCombo} totalStitches={game.totalStitches} timeUp={game.timeRemaining <= 0} onRestart={startGame} onMenu={goToMenu} />;
  if (game.screen === "levelComplete") {
    const newCats = getUnlockedCategories(game.level + 1);
    const prevCats = getUnlockedCategories(game.level);
    const newUnlock = newCats.find((c) => !prevCats.includes(c));
    const newPatterns = PATTERNS.filter((p) => p.unlockLevel === game.level + 1);
    return <LevelCompleteScreen level={game.level} score={game.score} perfectRows={game.perfectRows} rowsToComplete={game.rowsToComplete} maxCombo={game.maxCombo} timerBonus={game.timerBonus} newCategory={newUnlock} newPatterns={newPatterns} onNext={nextLevel} />;
  }

  // === PLAYING ===
  const targetRow = getCurrentTargetRow(game.currentPattern, game.currentRowIndex);
  const isColorwork = game.currentPattern.category === "colorwork";
  const yarnColor = getYarnColor(game.yarnColorIndex);
  const yarnColorB = YARN_COLORS[(game.yarnColorIndex + 1) % YARN_COLORS.length].hex;
  const timerPct = game.timeRemaining / getTimeForLevel(game.level);
  const timerUrgent = game.timeRemaining <= 10;

  // Responsive stitch cell size
  const maxWidth = typeof window !== "undefined" ? Math.min(window.innerWidth, 480) : 380;
  const needleWidth = 60;
  const fabricWidth = maxWidth - needleWidth * 2 - 8;
  const stitchCellSize = Math.min(38, Math.floor(fabricWidth / game.currentPattern.width));

  // For colorwork: left needle = color A (knit/purl), right = color B (knit/purl)
  // For other patterns: split stitch types between needles
  const uniqueStitches = game.currentPattern.stitchTypes;
  let leftButtons: { type: StitchType; color: string }[];
  let rightButtons: { type: StitchType; color: string }[];

  if (isColorwork) {
    leftButtons = [
      { type: "color-a", color: yarnColor },
      { type: "color-b", color: yarnColorB },
    ];
    rightButtons = []; // All on left for colorwork simplicity
  } else {
    const half = Math.ceil(uniqueStitches.length / 2);
    leftButtons = uniqueStitches.slice(0, half).map(t => ({ type: t, color: STITCH_INFO[t].bgColor }));
    rightButtons = uniqueStitches.slice(half).map(t => ({ type: t, color: STITCH_INFO[t].bgColor }));
  }

  // Calculate active stitch X position for yarn strand
  const activeStitchX = ((game.currentStitchIndex + 0.5) / game.currentPattern.width) * fabricWidth;

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-amber-50 to-rose-50 border-b border-amber-200">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-bold text-amber-800">Lvl {game.level}</span>
          <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 rounded-full text-amber-700 font-medium truncate max-w-[120px]">
            {game.currentPattern.emoji} {game.currentPattern.name}
          </span>
        </div>
        <div className="text-lg font-bold text-amber-900">{game.score.toLocaleString()}</div>
      </div>

      {/* Timer Bar */}
      <div className="h-2 bg-gray-100 relative">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-r ${timerUrgent ? "bg-red-500 animate-pulse" : timerPct > 0.5 ? "bg-emerald-400" : "bg-amber-400"}`}
          style={{ width: `${timerPct * 100}%` }}
        />
        <div className={`absolute right-2 -top-0.5 text-[10px] font-bold ${timerUrgent ? "text-red-600" : "text-gray-500"}`}>
          {Math.floor(game.timeRemaining / 60)}:{(game.timeRemaining % 60).toString().padStart(2, "0")}
        </div>
      </div>

      {/* Lives & Combo */}
      <div className="flex items-center justify-between px-3 py-1 bg-white/50">
        <div className="flex gap-0.5">
          {Array.from({ length: getLivesForLevel(game.level) }).map((_, i) => (
            <span key={i} className={`text-sm ${i < game.lives ? "" : "opacity-20"}`}>
              {i < game.lives ? "❤️" : "🖤"}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {game.combo > 2 && (
            <span className={`text-xs font-bold text-orange-500 ${game.combo > 5 ? "combo-pulse" : ""}`}>
              🔥 {game.combo}x
            </span>
          )}
          <span className="text-[10px] text-gray-500">
            Row {Math.min(game.completedRows.length + 1, game.rowsToComplete)}/{game.rowsToComplete}
          </span>
        </div>
      </div>

      {/* Pattern Preview */}
      <div className="px-3 py-1.5 bg-gradient-to-b from-amber-50/80 to-transparent">
        <div className="text-[9px] uppercase tracking-wider text-amber-600 mb-0.5 font-semibold">Pattern</div>
        <div className="flex gap-0.5 justify-center">
          {targetRow.map((st, i) => {
            const done = i < game.currentStitchIndex;
            const current = i === game.currentStitchIndex;
            return (
              <div
                key={i}
                className={`rounded transition-all duration-150 ${current ? "ring-2 ring-amber-400 ring-offset-1 scale-110 bg-amber-50" : done ? "opacity-30" : "bg-white/60"}`}
                style={{ width: stitchCellSize, height: stitchCellSize, display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <StitchSVG type={st} size={stitchCellSize - 6} color={done ? "#bbb" : STITCH_INFO[st].bgColor} colorA={yarnColor} colorB={yarnColorB} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Area: Physics Yarn + Needles + Fabric */}
      <div ref={workAreaRef} className="flex-1 flex overflow-hidden relative" style={{ minHeight: 0 }}>

        {/* Verlet Yarn Physics Canvas — renders needles + yarn ropes */}
        <YarnPhysics
          startX={25}
          startY={15}
          endX={needleWidth + activeStitchX}
          endY={70}
          color={yarnColor}
          thickness={4}
          segments={14}
          gravity={0.12}
          tension={0.65}
          width={maxWidth}
          height={80}
          secondaryColor={isColorwork ? yarnColorB : (rightButtons.length > 0 ? yarnColor : undefined)}
          secondaryStartX={rightButtons.length > 0 || isColorwork ? maxWidth - 25 : undefined}
          secondaryStartY={15}
          secondaryEndX={rightButtons.length > 0 || isColorwork ? needleWidth + activeStitchX : undefined}
          secondaryEndY={70}
        />

        {/* Left Buttons */}
        <div className="flex flex-col items-center justify-end gap-1.5 px-0.5 py-2" style={{ width: needleWidth, zIndex: 20, marginTop: 80 }}>
          {leftButtons.map(({ type: st }) => {
            const info = STITCH_INFO[st];
            const isColorBtn = st === "color-a" || st === "color-b";
            const displayColor = isColorBtn ? (st === "color-a" ? yarnColor : yarnColorB) : info.bgColor;
            return (
              <button
                key={st}
                onClick={() => handleStitch(st)}
                className="active:scale-90 transition-transform duration-100 rounded-lg shadow-md flex flex-col items-center gap-0.5 p-1.5 border border-white/40"
                style={{ backgroundColor: displayColor, width: 52 }}
              >
                <StitchSVG type={st} size={20} color="#ffffff" colorA={yarnColor} colorB={yarnColorB} />
                <span className="text-[8px] font-bold text-white drop-shadow-sm leading-none">
                  {isColorBtn ? (st === "color-a" ? "Col A" : "Col B") : info.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Fabric Area — KnitLab physics engine + current row */}
        <div className="flex-1 relative overflow-hidden" style={{ minHeight: 0 }}>
          {/* Floating scores */}
          {game.floatingScores.map((fs) => (
            <div key={fs.id} className="score-fly absolute text-amber-500 font-bold text-sm pointer-events-none z-20" style={{ left: `${fs.x}%`, top: `${fs.y}%` }}>
              +{fs.value}
            </div>
          ))}

          {game.completedRows.length === 0 && game.currentRowStitches.length === 0 && (
            <div className="flex items-center justify-center h-full text-amber-300 text-xs italic px-4 text-center" style={{ marginTop: 80 }}>
              Tap a stitch to begin!
            </div>
          )}

          {/* Fabric — completed rows rendered as stitch tile grid */}
          {(game.completedRows.length > 0 || game.currentRowStitches.length > 0) && (
            <div ref={fabricRef} className="overflow-y-auto" style={{ marginTop: 80, height: `calc(100% - 120px)` }}>
              {/* Completed rows — stitch SVG grid */}
              <div className="flex flex-col items-center gap-0">
                {game.completedRows.map((row, ri) => (
                  <div key={ri} className="flex gap-0 justify-center" style={{ opacity: Math.max(0.4, 1 - ri * 0.06) }}>
                    {row.stitches.map((stitch, si) => (
                      <div key={si} style={{ width: stitchCellSize - 2, height: stitchCellSize - 2 }}>
                        <StitchSVG type={stitch.type} size={stitchCellSize - 4} color={yarnColor} colorA={yarnColor} colorB={yarnColorB} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Current working row — SVG overlay for game feedback */}
              <div className={`flex gap-px justify-center mt-1 ${shakeRow ? "row-complete" : ""}`}>
                {game.currentRowStitches.map((stitch, si) => (
                  <div key={si} className="stitch-pop rounded-sm flex items-center justify-center" style={{ width: stitchCellSize - 2, height: stitchCellSize - 2, backgroundColor: stitch.correct ? `${yarnColor}25` : "#fee2e225" }}>
                    <StitchSVG type={stitch.type} size={stitchCellSize - 8} color={stitch.correct ? yarnColor : "#e05050"} colorA={yarnColor} colorB={yarnColorB} />
                  </div>
                ))}
                {game.currentRowStitches.length < game.currentPattern.width && (
                  <>
                    <div className="rounded-sm border-2 border-amber-400 bg-amber-50/50 flex items-center justify-center" style={{ width: stitchCellSize - 2, height: stitchCellSize - 2 }}>
                      <span className="text-amber-400 text-[10px] font-bold">?</span>
                    </div>
                    {Array.from({ length: game.currentPattern.width - game.currentRowStitches.length - 1 }).map((_, i) => (
                      <div key={`e-${i}`} className="rounded-sm border border-dashed border-amber-200/40" style={{ width: stitchCellSize - 2, height: stitchCellSize - 2 }} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Buttons */}
        <div className="flex flex-col items-center justify-end gap-1.5 px-0.5 py-2" style={{ width: needleWidth, zIndex: 20, marginTop: 80 }}>
          {rightButtons.map(({ type: st }) => {
            const info = STITCH_INFO[st];
            return (
              <button
                key={st}
                onClick={() => handleStitch(st)}
                className="active:scale-90 transition-transform duration-100 rounded-lg shadow-md flex flex-col items-center gap-0.5 p-1.5 border border-white/40"
                style={{ backgroundColor: info.bgColor, width: 52 }}
              >
                <StitchSVG type={st} size={20} color="#ffffff" />
                <span className="text-[8px] font-bold text-white drop-shadow-sm leading-none">
                  {info.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="px-3 py-1.5 bg-gradient-to-t from-amber-50 to-transparent text-center">
        <span className="text-[10px] text-amber-500">{game.currentPattern.description}</span>
      </div>
    </div>
  );
}

// ============ SUB-SCREENS ============

function MenuScreen({ highScore, lifetime, onStart }: { highScore: number; lifetime: number; onStart: () => void }) {
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center px-6 fade-in-up" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="text-6xl mb-2">🧶</div>
      <h1 className="text-4xl font-black text-amber-900 tracking-tight mb-1">Knitty Gritty</h1>
      <p className="text-amber-600 text-sm mb-6 text-center">Match the pattern, beat the clock, grow your fabric!</p>

      <button onClick={onStart} className="bg-gradient-to-br from-rose-400 to-rose-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-lg active:scale-95 transition-transform mb-6 w-full max-w-[280px]">
        🪡 Start Knitting
      </button>

      {highScore > 0 && <div className="text-amber-700 font-medium">Best: {highScore.toLocaleString()} pts</div>}
      {lifetime > 0 && <div className="text-amber-500 text-sm mt-1">{lifetime.toLocaleString()} lifetime stitches</div>}

      <div className="mt-6 bg-white/60 rounded-xl p-4 text-center max-w-[300px]">
        <div className="text-sm font-semibold text-amber-800 mb-2">How to Play</div>
        <div className="text-xs text-amber-700 space-y-1">
          <p>🪡 Tap the matching stitch on the needles</p>
          <p>⏱️ Beat the clock — correct stitches add time!</p>
          <p>🔥 Build combos for bonus points</p>
          <p>📈 Unlock: YO, K2tog, SSK, M1R, M1L, cables, colorwork</p>
        </div>
      </div>

      <div className="mt-5 flex gap-3 flex-wrap justify-center">
        {[
          { cat: "texture", icon: "🌿", lvl: 2 },
          { cat: "increases", icon: "📐", lvl: 5 },
          { cat: "lace", icon: "🕊️", lvl: 7 },
          { cat: "cables", icon: "🪢", lvl: 9 },
          { cat: "colorwork", icon: "🌈", lvl: 10 },
        ].map(({ cat, icon, lvl }) => (
          <div key={cat} className="text-center">
            <div className="text-lg">{icon}</div>
            <div className="text-[9px] uppercase tracking-wider text-amber-500">{cat}</div>
            <div className="text-[8px] text-amber-400">Lvl {lvl}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameOverScreen({ score, highScore, level, maxCombo, totalStitches, timeUp, onRestart, onMenu }: { score: number; highScore: number; level: number; maxCombo: number; totalStitches: number; timeUp: boolean; onRestart: () => void; onMenu: () => void }) {
  const isNew = score >= highScore && score > 0;
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center px-6 fade-in-up" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="text-5xl mb-3">🧶</div>
      <h2 className="text-3xl font-black text-amber-900 mb-1">{timeUp ? "Time\u2019s Up!" : "Dropped a Stitch!"}</h2>
      <p className="text-amber-600 text-sm mb-6">{timeUp ? "The clock ran out..." : "Too many mistakes!"}</p>
      <div className="bg-white/70 rounded-2xl p-6 w-full max-w-[300px] space-y-3 mb-6">
        <div className="text-center">
          <div className="text-3xl font-black text-amber-900">{score.toLocaleString()}</div>
          <div className="text-sm text-amber-600">points</div>
          {isNew && <div className="text-xs font-bold text-rose-500 mt-1 combo-pulse">✨ NEW HIGH SCORE! ✨</div>}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-amber-100">
          <div><div className="text-lg font-bold text-amber-800">Lvl {level}</div><div className="text-[10px] text-amber-500">reached</div></div>
          <div><div className="text-lg font-bold text-amber-800">{maxCombo}x</div><div className="text-[10px] text-amber-500">best combo</div></div>
          <div><div className="text-lg font-bold text-amber-800">{totalStitches}</div><div className="text-[10px] text-amber-500">stitches</div></div>
        </div>
      </div>
      <button onClick={onRestart} className="bg-gradient-to-br from-rose-400 to-rose-500 text-white px-8 py-3 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-transform mb-3 w-full max-w-[280px]">🔄 Try Again</button>
      <button onClick={onMenu} className="text-amber-600 font-medium text-sm py-2 active:opacity-60">Back to Menu</button>
    </div>
  );
}

function LevelCompleteScreen({ level, score, perfectRows, rowsToComplete, maxCombo, timerBonus, newCategory, newPatterns, onNext }: { level: number; score: number; perfectRows: number; rowsToComplete: number; maxCombo: number; timerBonus: number; newCategory?: string; newPatterns: PatternDef[]; onNext: () => void }) {
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center px-6 fade-in-up" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="text-5xl mb-3">🎉</div>
      <h2 className="text-3xl font-black text-amber-900 mb-1">Level {level} Complete!</h2>
      <div className="text-2xl font-bold text-amber-700 mb-4">{score.toLocaleString()} pts</div>
      <div className="bg-white/70 rounded-2xl p-4 w-full max-w-[300px] space-y-2 mb-4">
        <div className="flex justify-between text-sm"><span className="text-amber-600">Perfect rows</span><span className="font-bold text-amber-800">{perfectRows}/{rowsToComplete} {"⭐".repeat(Math.min(perfectRows, 5))}</span></div>
        <div className="flex justify-between text-sm"><span className="text-amber-600">Best combo</span><span className="font-bold text-amber-800">{maxCombo}x 🔥</span></div>
        {timerBonus > 0 && <div className="flex justify-between text-sm"><span className="text-amber-600">Time bonus</span><span className="font-bold text-emerald-600">+{timerBonus.toLocaleString()} ⏱️</span></div>}
      </div>
      {newCategory && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 mb-3 text-center w-full max-w-[300px] shimmer-bg">
          <div className="text-xs uppercase tracking-wider text-purple-600 font-bold">New Category Unlocked!</div>
          <div className="text-lg font-bold text-purple-800 capitalize">{newCategory}</div>
        </div>
      )}
      {newPatterns.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl p-3 mb-4 w-full max-w-[300px]">
          <div className="text-xs uppercase tracking-wider text-amber-600 font-bold mb-1">New Patterns!</div>
          {newPatterns.map((p) => <div key={p.name} className="flex items-center gap-2 text-sm text-amber-800"><span>{p.emoji}</span><span className="font-medium">{p.name}</span></div>)}
        </div>
      )}
      <button onClick={onNext} className="bg-gradient-to-br from-amber-400 to-orange-500 text-white px-8 py-3 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-transform w-full max-w-[280px]">
        Level {level + 1} →
      </button>
    </div>
  );
}
