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
  getPatternForLevel,
  getRowTarget,
  getScoreForStitch,
  getLivesForLevel,
} from "./game-engine";
import StitchSVG from "./StitchSVG";

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
  };
}

function getUnlockedCategories(level: number): string[] {
  const cats: string[] = ["basic"];
  if (level >= 2) cats.push("texture");
  if (level >= 6) cats.push("lace");
  if (level >= 8) cats.push("cable");
  if (level >= 9) cats.push("colorwork");
  return cats;
}

function getCurrentTargetRow(pattern: PatternDef, rowIndex: number): StitchType[] {
  return pattern.rows[rowIndex % pattern.rows.length];
}

let floatingIdCounter = 0;

export default function KnitGame() {
  const [game, setGame] = useState<GameState>({
    ...initLevel(1),
    screen: "menu",
  });
  const fabricRef = useRef<HTMLDivElement>(null);
  const [shakeRow, setShakeRow] = useState(false);
  const [needleAnim, setNeedleAnim] = useState(false);

  // Vibrate on mobile if available
  const haptic = useCallback((ms: number = 15) => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(ms);
    }
  }, []);

  // Handle stitch tap
  const handleStitch = useCallback((tappedType: StitchType) => {
    setGame((prev) => {
      if (prev.screen !== "playing") return prev;

      const targetRow = getCurrentTargetRow(prev.currentPattern, prev.currentRowIndex);
      const expectedType = targetRow[prev.currentStitchIndex];
      const isCorrect = tappedType === expectedType;

      setNeedleAnim(true);
      setTimeout(() => setNeedleAnim(false), 150);

      const newStitch: Stitch = {
        type: tappedType,
        completed: true,
        correct: isCorrect,
      };

      const newCurrentRow = [...prev.currentRowStitches, newStitch];
      const newCombo = isCorrect ? prev.combo + 1 : 0;
      const newMaxCombo = Math.max(prev.maxCombo, newCombo);
      const newLives = isCorrect ? prev.lives : prev.lives - 1;
      let newScore = prev.score;
      let newFloating = [...prev.floatingScores];
      const newTotalStitches = prev.totalStitches + 1;
      const newLifetime = prev.totalLifetimeStitches + 1;

      if (isCorrect) {
        const pts = getScoreForStitch(newCombo, prev.level);
        newScore += pts;
        haptic(15);
        newFloating.push({
          id: ++floatingIdCounter,
          value: pts,
          x: (prev.currentStitchIndex / prev.currentPattern.width) * 100,
          y: 50,
        });
        // Clean old floating scores
        if (newFloating.length > 8) newFloating = newFloating.slice(-8);
      } else {
        haptic(50);
        setShakeRow(true);
        setTimeout(() => setShakeRow(false), 400);
      }

      // Check if row is complete
      if (newCurrentRow.length >= prev.currentPattern.width) {
        const isPerfectRow = newCurrentRow.every((s) => s.correct);
        const newPerfectRows = isPerfectRow ? prev.perfectRows + 1 : prev.perfectRows;

        // Row complete bonus
        if (isPerfectRow) {
          const rowBonus = 50 * prev.level;
          newScore += rowBonus;
          newFloating.push({
            id: ++floatingIdCounter,
            value: rowBonus,
            x: 50,
            y: 30,
          });
        }

        const newCompletedRows = [
          ...prev.completedRows,
          {
            stitches: newCurrentRow,
            yarnColor: getYarnColor(prev.yarnColorIndex),
          },
        ];

        const newRowIndex = prev.currentRowIndex + 1;

        // Check if level is complete
        if (newCompletedRows.length >= prev.rowsToComplete) {
          // Level complete!
          const lvlBonus = prev.level * 100 + newPerfectRows * 50;
          newScore += lvlBonus;

          if (newScore > prev.highScore) {
            saveHighScore(newScore);
          }
          saveLifetimeStitches(newLifetime);

          return {
            ...prev,
            screen: "levelComplete",
            score: newScore,
            combo: newCombo,
            maxCombo: newMaxCombo,
            lives: newLives,
            currentRowIndex: newRowIndex,
            currentStitchIndex: 0,
            completedRows: newCompletedRows,
            currentRowStitches: [],
            totalStitches: newTotalStitches,
            perfectRows: newPerfectRows,
            floatingScores: newFloating,
            highScore: Math.max(prev.highScore, newScore),
            totalLifetimeStitches: newLifetime,
          };
        }

        return {
          ...prev,
          score: newScore,
          combo: newCombo,
          maxCombo: newMaxCombo,
          lives: newLives,
          currentRowIndex: newRowIndex,
          currentStitchIndex: 0,
          completedRows: newCompletedRows,
          currentRowStitches: [],
          totalStitches: newTotalStitches,
          perfectRows: newPerfectRows,
          floatingScores: newFloating,
          totalLifetimeStitches: newLifetime,
        };
      }

      // Game over check
      if (newLives <= 0) {
        if (newScore > prev.highScore) {
          saveHighScore(newScore);
        }
        saveLifetimeStitches(newLifetime);
        return {
          ...prev,
          screen: "gameOver",
          score: newScore,
          combo: 0,
          maxCombo: newMaxCombo,
          lives: 0,
          currentStitchIndex: prev.currentStitchIndex + 1,
          currentRowStitches: newCurrentRow,
          totalStitches: newTotalStitches,
          floatingScores: newFloating,
          highScore: Math.max(prev.highScore, newScore),
          totalLifetimeStitches: newLifetime,
        };
      }

      return {
        ...prev,
        score: newScore,
        combo: newCombo,
        maxCombo: newMaxCombo,
        lives: newLives,
        currentStitchIndex: prev.currentStitchIndex + 1,
        currentRowStitches: newCurrentRow,
        totalStitches: newTotalStitches,
        floatingScores: newFloating,
        totalLifetimeStitches: newLifetime,
      };
    });
  }, [haptic]);

  // Auto-scroll fabric
  useEffect(() => {
    if (fabricRef.current) {
      fabricRef.current.scrollTop = fabricRef.current.scrollHeight;
    }
  }, [game.completedRows.length]);

  // Clean floating scores
  useEffect(() => {
    if (game.floatingScores.length > 0) {
      const timer = setTimeout(() => {
        setGame((prev) => ({
          ...prev,
          floatingScores: prev.floatingScores.slice(1),
        }));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [game.floatingScores]);

  const startGame = () => {
    setGame(initLevel(1));
  };

  const nextLevel = () => {
    setGame((prev) => initLevel(prev.level + 1, prev));
  };

  const goToMenu = () => {
    setGame((prev) => ({
      ...initLevel(1),
      screen: "menu",
      highScore: prev.highScore,
      totalLifetimeStitches: prev.totalLifetimeStitches,
    }));
  };

  // ============ RENDER ============

  // Menu Screen
  if (game.screen === "menu") {
    return <MenuScreen highScore={game.highScore} lifetime={game.totalLifetimeStitches} onStart={startGame} />;
  }

  // Game Over Screen
  if (game.screen === "gameOver") {
    return (
      <GameOverScreen
        score={game.score}
        highScore={game.highScore}
        level={game.level}
        maxCombo={game.maxCombo}
        totalStitches={game.totalStitches}
        onRestart={startGame}
        onMenu={goToMenu}
      />
    );
  }

  // Level Complete Screen
  if (game.screen === "levelComplete") {
    const newCats = getUnlockedCategories(game.level + 1);
    const prevCats = getUnlockedCategories(game.level);
    const newUnlock = newCats.find((c) => !prevCats.includes(c));
    const newPatterns = PATTERNS.filter((p) => p.unlockLevel === game.level + 1);

    return (
      <LevelCompleteScreen
        level={game.level}
        score={game.score}
        perfectRows={game.perfectRows}
        rowsToComplete={game.rowsToComplete}
        maxCombo={game.maxCombo}
        newCategory={newUnlock}
        newPatterns={newPatterns}
        onNext={nextLevel}
      />
    );
  }

  // Playing Screen
  const targetRow = getCurrentTargetRow(game.currentPattern, game.currentRowIndex);
  const uniqueStitches = game.currentPattern.stitchTypes;
  const yarnColor = getYarnColor(game.yarnColorIndex);

  return (
    <div className="h-dvh w-full flex flex-col overflow-hidden" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-50 to-rose-50 border-b border-amber-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-amber-800">Lvl {game.level}</span>
          <span className="text-xs px-2 py-0.5 bg-amber-100 rounded-full text-amber-700 font-medium">
            {game.currentPattern.emoji} {game.currentPattern.name}
          </span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-amber-900">{game.score.toLocaleString()}</div>
        </div>
      </div>

      {/* Lives & Combo */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-white/50">
        <div className="flex gap-1">
          {Array.from({ length: getLivesForLevel(game.level) }).map((_, i) => (
            <span key={i} className={`text-lg ${i < game.lives ? "" : "opacity-20"}`}>
              {i < game.lives ? "❤️" : "🖤"}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {game.combo > 2 && (
            <span className={`text-sm font-bold text-orange-500 ${game.combo > 5 ? "combo-pulse" : ""}`}>
              🔥 {game.combo}x
            </span>
          )}
          <span className="text-xs text-gray-500">
            Row {Math.min(game.completedRows.length + 1, game.rowsToComplete)}/{game.rowsToComplete}
          </span>
        </div>
      </div>

      {/* Pattern Preview — shows next row */}
      <div className="px-3 py-2 bg-gradient-to-b from-amber-50/80 to-transparent">
        <div className="text-[10px] uppercase tracking-wider text-amber-600 mb-1 font-semibold">Pattern</div>
        <div className="flex gap-0.5 justify-center">
          {targetRow.map((st, i) => {
            const done = i < game.currentStitchIndex;
            const current = i === game.currentStitchIndex;
            return (
              <div
                key={i}
                className={`rounded transition-all duration-150 ${
                  current
                    ? "ring-2 ring-amber-400 ring-offset-1 scale-110 bg-amber-50"
                    : done
                    ? "opacity-40"
                    : "bg-white/60"
                }`}
                style={{
                  width: `${Math.min(40, (100 / targetRow.length) * 3.2)}px`,
                  height: `${Math.min(40, (100 / targetRow.length) * 3.2)}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <StitchSVG
                  type={st}
                  size={Math.min(32, (100 / targetRow.length) * 2.8)}
                  color={done ? "#aaa" : STITCH_INFO[st].bgColor}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Fabric Area — completed rows */}
      <div
        ref={fabricRef}
        className="flex-1 overflow-y-auto px-2 py-1 relative"
        style={{ minHeight: 0 }}
      >
        {/* Floating scores */}
        {game.floatingScores.map((fs) => (
          <div
            key={fs.id}
            className="score-fly absolute text-amber-500 font-bold text-lg pointer-events-none z-10"
            style={{ left: `${fs.x}%`, top: `${fs.y}%` }}
          >
            +{fs.value}
          </div>
        ))}

        {game.completedRows.length === 0 && (
          <div className="flex items-center justify-center h-full text-amber-300 text-sm italic">
            Start knitting! Tap the stitches below...
          </div>
        )}

        <div className="flex flex-col-reverse gap-0.5">
          {[...game.completedRows].reverse().map((row, ri) => (
            <div key={ri} className="flex gap-0.5 justify-center">
              {row.stitches.map((stitch, si) => (
                <div
                  key={si}
                  className={`stitch-pop rounded-sm flex items-center justify-center`}
                  style={{
                    width: `${Math.min(40, (100 / game.currentPattern.width) * 3.2)}px`,
                    height: `${Math.min(40, (100 / game.currentPattern.width) * 3.2)}px`,
                    backgroundColor: stitch.correct
                      ? `${row.yarnColor}30`
                      : "#fee2e230",
                  }}
                >
                  <StitchSVG
                    type={stitch.type}
                    size={Math.min(30, (100 / game.currentPattern.width) * 2.6)}
                    color={stitch.correct ? row.yarnColor : "#e05050"}
                    colorA={row.yarnColor}
                    colorB={game.completedRows.length > 1 ? YARN_COLORS[(game.yarnColorIndex + 1) % YARN_COLORS.length].hex : "#5e8ed4"}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Current row being worked */}
        {game.currentRowStitches.length > 0 && (
          <div className={`flex gap-0.5 justify-center mt-0.5 ${shakeRow ? "row-complete" : ""}`}>
            {game.currentRowStitches.map((stitch, si) => (
              <div
                key={si}
                className="stitch-pop rounded-sm flex items-center justify-center"
                style={{
                  width: `${Math.min(40, (100 / game.currentPattern.width) * 3.2)}px`,
                  height: `${Math.min(40, (100 / game.currentPattern.width) * 3.2)}px`,
                  backgroundColor: stitch.correct ? `${yarnColor}30` : "#fee2e230",
                }}
              >
                <StitchSVG
                  type={stitch.type}
                  size={Math.min(30, (100 / game.currentPattern.width) * 2.6)}
                  color={stitch.correct ? yarnColor : "#e05050"}
                />
              </div>
            ))}
            {/* Remaining empty slots */}
            {Array.from({ length: game.currentPattern.width - game.currentRowStitches.length }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="rounded-sm border border-dashed border-amber-200"
                style={{
                  width: `${Math.min(40, (100 / game.currentPattern.width) * 3.2)}px`,
                  height: `${Math.min(40, (100 / game.currentPattern.width) * 3.2)}px`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Knitting Needles visual */}
      <div className={`flex justify-center py-1 ${needleAnim ? "needle-click" : ""}`}>
        <div className="text-2xl">🪡</div>
      </div>

      {/* Stitch Buttons */}
      <div className="px-3 pb-4 pt-2 bg-gradient-to-t from-amber-50 to-transparent">
        <div className="flex gap-2 justify-center flex-wrap">
          {uniqueStitches.map((st) => {
            const info = STITCH_INFO[st];
            return (
              <button
                key={st}
                onClick={() => handleStitch(st)}
                className="active:scale-90 transition-transform duration-100 rounded-xl shadow-md flex flex-col items-center gap-1 px-3 py-2 min-w-[64px] border-2 border-white/50"
                style={{ backgroundColor: info.bgColor }}
              >
                <div className="bg-white/20 rounded-lg p-1">
                  <StitchSVG type={st} size={28} color="#ffffff" />
                </div>
                <span className="text-[11px] font-bold text-white drop-shadow-sm">
                  {info.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============ SUB-SCREENS ============

function MenuScreen({
  highScore,
  lifetime,
  onStart,
}: {
  highScore: number;
  lifetime: number;
  onStart: () => void;
}) {
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center px-6 fade-in-up" style={{ maxWidth: 480, margin: "0 auto" }}>
      {/* Yarn ball decoration */}
      <div className="text-6xl mb-2">🧶</div>
      <h1 className="text-4xl font-black text-amber-900 tracking-tight mb-1">
        Knitty Gritty
      </h1>
      <p className="text-amber-600 text-sm mb-8 text-center">
        Match the pattern, grow your fabric, chase the high score!
      </p>

      <button
        onClick={onStart}
        className="bg-gradient-to-br from-rose-400 to-rose-500 text-white px-10 py-4 rounded-2xl text-xl font-bold shadow-lg active:scale-95 transition-transform mb-6 w-full max-w-[280px]"
      >
        🪡 Start Knitting
      </button>

      {highScore > 0 && (
        <div className="text-amber-700 font-medium">
          Best: {highScore.toLocaleString()} pts
        </div>
      )}
      {lifetime > 0 && (
        <div className="text-amber-500 text-sm mt-1">
          {lifetime.toLocaleString()} lifetime stitches
        </div>
      )}

      <div className="mt-8 bg-white/60 rounded-xl p-4 text-center max-w-[300px]">
        <div className="text-sm font-semibold text-amber-800 mb-2">How to Play</div>
        <div className="text-xs text-amber-700 space-y-1">
          <p>👆 Tap the correct stitch to match the pattern</p>
          <p>🔥 Build combos for bonus points</p>
          <p>❤️ Don&apos;t run out of lives!</p>
          <p>📈 Level up to unlock new patterns & stitches</p>
        </div>
      </div>

      <div className="mt-6 text-xs text-amber-400">
        Stitch types unlock as you level up!
      </div>

      {/* Pattern preview */}
      <div className="mt-4 flex gap-3 flex-wrap justify-center">
        {["basic", "texture", "lace", "cable", "colorwork"].map((cat) => (
          <div key={cat} className="text-center">
            <div className="text-[10px] uppercase tracking-wider text-amber-500">{cat}</div>
            <div className="text-lg">
              {cat === "basic" && "🧣"}
              {cat === "texture" && "🌿"}
              {cat === "lace" && "🕊️"}
              {cat === "cable" && "🪢"}
              {cat === "colorwork" && "🌈"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GameOverScreen({
  score,
  highScore,
  level,
  maxCombo,
  totalStitches,
  onRestart,
  onMenu,
}: {
  score: number;
  highScore: number;
  level: number;
  maxCombo: number;
  totalStitches: number;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const isNew = score >= highScore && score > 0;
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center px-6 fade-in-up" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="text-5xl mb-3">🧶</div>
      <h2 className="text-3xl font-black text-amber-900 mb-1">Dropped a Stitch!</h2>
      <p className="text-amber-600 text-sm mb-6">Your yarn ran out...</p>

      <div className="bg-white/70 rounded-2xl p-6 w-full max-w-[300px] space-y-3 mb-6">
        <div className="text-center">
          <div className="text-3xl font-black text-amber-900">{score.toLocaleString()}</div>
          <div className="text-sm text-amber-600">points</div>
          {isNew && (
            <div className="text-xs font-bold text-rose-500 mt-1 combo-pulse">
              ✨ NEW HIGH SCORE! ✨
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-amber-100">
          <div>
            <div className="text-lg font-bold text-amber-800">Lvl {level}</div>
            <div className="text-[10px] text-amber-500">reached</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-800">{maxCombo}x</div>
            <div className="text-[10px] text-amber-500">best combo</div>
          </div>
          <div>
            <div className="text-lg font-bold text-amber-800">{totalStitches}</div>
            <div className="text-[10px] text-amber-500">stitches</div>
          </div>
        </div>
      </div>

      <button
        onClick={onRestart}
        className="bg-gradient-to-br from-rose-400 to-rose-500 text-white px-8 py-3 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-transform mb-3 w-full max-w-[280px]"
      >
        🔄 Try Again
      </button>
      <button
        onClick={onMenu}
        className="text-amber-600 font-medium text-sm py-2 active:opacity-60"
      >
        Back to Menu
      </button>
    </div>
  );
}

function LevelCompleteScreen({
  level,
  score,
  perfectRows,
  rowsToComplete,
  maxCombo,
  newCategory,
  newPatterns,
  onNext,
}: {
  level: number;
  score: number;
  perfectRows: number;
  rowsToComplete: number;
  maxCombo: number;
  newCategory?: string;
  newPatterns: PatternDef[];
  onNext: () => void;
}) {
  return (
    <div className="h-dvh w-full flex flex-col items-center justify-center px-6 fade-in-up" style={{ maxWidth: 480, margin: "0 auto" }}>
      <div className="text-5xl mb-3">🎉</div>
      <h2 className="text-3xl font-black text-amber-900 mb-1">Level {level} Complete!</h2>
      <div className="text-2xl font-bold text-amber-700 mb-4">{score.toLocaleString()} pts</div>

      <div className="bg-white/70 rounded-2xl p-4 w-full max-w-[300px] space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-amber-600">Perfect rows</span>
          <span className="font-bold text-amber-800">
            {perfectRows}/{rowsToComplete} {"⭐".repeat(Math.min(perfectRows, 5))}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-amber-600">Best combo</span>
          <span className="font-bold text-amber-800">{maxCombo}x 🔥</span>
        </div>
      </div>

      {/* Unlock notifications */}
      {newCategory && (
        <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 mb-3 text-center w-full max-w-[300px] shimmer-bg">
          <div className="text-xs uppercase tracking-wider text-purple-600 font-bold">New Category Unlocked!</div>
          <div className="text-lg font-bold text-purple-800 capitalize">{newCategory}</div>
        </div>
      )}

      {newPatterns.length > 0 && (
        <div className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-xl p-3 mb-4 w-full max-w-[300px]">
          <div className="text-xs uppercase tracking-wider text-amber-600 font-bold mb-1">New Patterns!</div>
          {newPatterns.map((p) => (
            <div key={p.name} className="flex items-center gap-2 text-sm text-amber-800">
              <span>{p.emoji}</span>
              <span className="font-medium">{p.name}</span>
              <span className="text-xs text-amber-500">— {p.description}</span>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={onNext}
        className="bg-gradient-to-br from-amber-400 to-orange-500 text-white px-8 py-3 rounded-2xl text-lg font-bold shadow-lg active:scale-95 transition-transform w-full max-w-[280px]"
      >
        Level {level + 1} →
      </button>
    </div>
  );
}
