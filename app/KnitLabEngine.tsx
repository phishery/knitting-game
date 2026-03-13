"use client";

import { useRef, useEffect, useCallback } from "react";

/***************************************************
 * KNITLAB ENGINE — Ported to React
 * Continuous Yarn Knitting Physics with Verlet Integration
 * Original by Ryan Whitaker, React integration for Knitty Gritty
 ***************************************************/

interface KnitLabProps {
  /** Pattern rows: each row is an array of stitch types ("K", "P", etc.) */
  pattern: string[][];
  /** Yarn color */
  yarnColor?: string;
  /** Secondary yarn color (for colorwork) */
  yarnColorB?: string;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Stitch cell width */
  stitchWidth?: number;
  /** Stitch cell height */
  stitchHeight?: number;
  /** Gravity strength */
  gravity?: number;
  /** Whether to enable touch/mouse interaction */
  interactive?: boolean;
  /** Offset X for centering */
  offsetX?: number;
  /** Offset Y */
  offsetY?: number;
}

// ============ PHYSICS CORE ============

class Point {
  x: number;
  y: number;
  oldx: number;
  oldy: number;
  locked: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.oldx = x;
    this.oldy = y;
    this.locked = false;
  }

  update(gravity: number) {
    if (this.locked) return;
    const vx = this.x - this.oldx;
    const vy = this.y - this.oldy;
    this.oldx = this.x;
    this.oldy = this.y;
    this.x += vx;
    this.y += vy + gravity;
  }
}

class Constraint {
  a: Point;
  b: Point;
  length: number;

  constructor(a: Point, b: Point, length: number) {
    this.a = a;
    this.b = b;
    this.length = length;
  }

  solve() {
    const dx = this.b.x - this.a.x;
    const dy = this.b.y - this.a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return;
    const diff = (dist - this.length) / dist;
    const offx = dx * 0.5 * diff;
    const offy = dy * 0.5 * diff;
    if (!this.a.locked) {
      this.a.x += offx;
      this.a.y += offy;
    }
    if (!this.b.locked) {
      this.b.x -= offx;
      this.b.y -= offy;
    }
  }
}

class Yarn {
  points: Point[] = [];
  constraints: Constraint[] = [];
  color: string;
  width: number;

  constructor(color: string, width: number) {
    this.color = color;
    this.width = width;
  }

  addPoint(x: number, y: number): Point {
    const p = new Point(x, y);
    this.points.push(p);
    return p;
  }

  connect(a: Point, b: Point, length?: number) {
    const l = length ?? Math.hypot(b.x - a.x, b.y - a.y);
    this.constraints.push(new Constraint(a, b, l));
  }

  update(gravity: number, iterations: number) {
    for (const p of this.points) p.update(gravity);
    for (let i = 0; i < iterations; i++) {
      for (const c of this.constraints) c.solve();
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    if (this.constraints.length === 0) return;

    // Shadow
    ctx.beginPath();
    for (const c of this.constraints) {
      ctx.moveTo(c.a.x, c.a.y + 1.5);
      ctx.lineTo(c.b.x, c.b.y + 1.5);
    }
    ctx.strokeStyle = "rgba(0,0,0,0.12)";
    ctx.lineWidth = this.width + 1.5;
    ctx.lineCap = "round";
    ctx.stroke();

    // Main yarn
    ctx.beginPath();
    for (const c of this.constraints) {
      ctx.moveTo(c.a.x, c.a.y);
      ctx.lineTo(c.b.x, c.b.y);
    }
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.lineCap = "round";
    ctx.stroke();

    // Highlight
    ctx.beginPath();
    for (const c of this.constraints) {
      ctx.moveTo(c.a.x - 0.5, c.a.y - 0.5);
      ctx.lineTo(c.b.x - 0.5, c.b.y - 0.5);
    }
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.lineWidth = this.width * 0.3;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

// ============ KNIT GRAPH (Stitch Topology) ============

class KnitGraph {
  yarn: Yarn;
  rows: number;
  cols: number;
  pattern: string[][];

  constructor(
    pattern: string[][],
    yarnColor: string,
    yarnWidth: number,
    stitchWidth: number,
    stitchHeight: number,
    offsetX: number,
    offsetY: number,
  ) {
    this.pattern = pattern;
    this.rows = pattern.length;
    this.cols = pattern[0]?.length ?? 0;
    this.yarn = new Yarn(yarnColor, yarnWidth);

    this.build(stitchWidth, stitchHeight, offsetX, offsetY);
  }

  private build(w: number, h: number, ox: number, oy: number) {
    let cursor: Point | null = null;

    for (let r = 0; r < this.rows; r++) {
      // Flat knitting: alternate direction each row (boustrophedon)
      // Even rows (RS): left to right. Odd rows (WS): right to left.
      const isWrongSide = r % 2 === 1;

      for (let ci = 0; ci < this.cols; ci++) {
        // On WS rows, traverse columns in reverse
        const c = isWrongSide ? (this.cols - 1 - ci) : ci;
        const type = this.pattern[r][c];
        const x = ox + c * w;
        const y = oy + r * h;

        // On WS rows, mirror the stitch horizontally within its cell
        // by passing negative width (stitch builders handle direction)
        const dirW = isWrongSide ? -w : w;

        if (type === "K") {
          cursor = this.makeKnit(x, y, dirW, h, cursor);
        } else if (type === "P") {
          cursor = this.makePurl(x, y, dirW, h, cursor);
        } else if (type === "YO") {
          cursor = this.makeYarnOver(x, y, dirW, h, cursor);
        } else if (type === "K2T") {
          cursor = this.makeK2tog(x, y, dirW, h, cursor);
        } else if (type === "SSK") {
          cursor = this.makeSSK(x, y, dirW, h, cursor);
        } else if (type === "M1R") {
          cursor = this.makeM1R(x, y, dirW, h, cursor);
        } else if (type === "M1L") {
          cursor = this.makeM1L(x, y, dirW, h, cursor);
        } else if (type === "CL") {
          cursor = this.makeCableLeft(x, y, dirW, h, cursor);
        } else if (type === "CR") {
          cursor = this.makeCableRight(x, y, dirW, h, cursor);
        } else {
          cursor = this.makeKnit(x, y, dirW, h, cursor);
        }
      }
    }
  }

  private makeKnit(x: number, y: number, w: number, h: number, start: Point | null): Point {
    const p1 = this.yarn.addPoint(x, y);
    const p2 = this.yarn.addPoint(x + w / 2, y + h);
    const p3 = this.yarn.addPoint(x + w, y);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    if (start) this.yarn.connect(start, p1);
    return p3;
  }

  private makePurl(x: number, y: number, w: number, h: number, start: Point | null): Point {
    const p1 = this.yarn.addPoint(x, y + h / 2);
    const p2 = this.yarn.addPoint(x + w / 2, y);
    const p3 = this.yarn.addPoint(x + w, y + h / 2);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    if (start) this.yarn.connect(start, p1);
    return p3;
  }

  private makeYarnOver(x: number, y: number, w: number, h: number, start: Point | null): Point {
    // Open loop — circle approximation
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = Math.min(w, h) * 0.3;
    const p1 = this.yarn.addPoint(x, cy);
    const p2 = this.yarn.addPoint(cx, cy - r);
    const p3 = this.yarn.addPoint(x + w, cy);
    const p4 = this.yarn.addPoint(cx, cy + r);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    this.yarn.connect(p3, p4);
    if (start) this.yarn.connect(start, p1);
    return p4;
  }

  private makeK2tog(x: number, y: number, w: number, h: number, start: Point | null): Point {
    // Two legs leaning right into one
    const p1 = this.yarn.addPoint(x, y);
    const p2 = this.yarn.addPoint(x + w * 0.35, y + h);
    const p3 = this.yarn.addPoint(x + w * 0.65, y);
    const p4 = this.yarn.addPoint(x + w, y + h);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    this.yarn.connect(p3, p4);
    if (start) this.yarn.connect(start, p1);
    return p4;
  }

  private makeSSK(x: number, y: number, w: number, h: number, start: Point | null): Point {
    // Two legs leaning left into one
    const p1 = this.yarn.addPoint(x, y + h);
    const p2 = this.yarn.addPoint(x + w * 0.35, y);
    const p3 = this.yarn.addPoint(x + w * 0.65, y + h);
    const p4 = this.yarn.addPoint(x + w, y);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    this.yarn.connect(p3, p4);
    if (start) this.yarn.connect(start, p1);
    return p4;
  }

  private makeM1R(x: number, y: number, w: number, h: number, start: Point | null): Point {
    // Increase — lifted bar with V
    const p1 = this.yarn.addPoint(x, y + h);
    const p2 = this.yarn.addPoint(x + w / 2, y);
    const p3 = this.yarn.addPoint(x + w, y + h);
    const p4 = this.yarn.addPoint(x + w * 0.8, y - h * 0.2);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    this.yarn.connect(p3, p4);
    if (start) this.yarn.connect(start, p1);
    return p4;
  }

  private makeM1L(x: number, y: number, w: number, h: number, start: Point | null): Point {
    const p1 = this.yarn.addPoint(x, y + h);
    const p2 = this.yarn.addPoint(x + w / 2, y);
    const p3 = this.yarn.addPoint(x + w, y + h);
    const p4 = this.yarn.addPoint(x + w * 0.2, y - h * 0.2);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    this.yarn.connect(p2, p4);
    if (start) this.yarn.connect(start, p1);
    return p3;
  }

  private makeCableLeft(x: number, y: number, w: number, h: number, start: Point | null): Point {
    const p1 = this.yarn.addPoint(x + w, y);
    const p2 = this.yarn.addPoint(x + w / 2, y + h * 0.3);
    const p3 = this.yarn.addPoint(x, y + h);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    if (start) this.yarn.connect(start, p1);
    return p3;
  }

  private makeCableRight(x: number, y: number, w: number, h: number, start: Point | null): Point {
    const p1 = this.yarn.addPoint(x, y);
    const p2 = this.yarn.addPoint(x + w / 2, y + h * 0.3);
    const p3 = this.yarn.addPoint(x + w, y + h);
    this.yarn.connect(p1, p2);
    this.yarn.connect(p2, p3);
    if (start) this.yarn.connect(start, p1);
    return p3;
  }

  update(gravity: number, iterations: number) {
    this.yarn.update(gravity, iterations);
  }

  draw(ctx: CanvasRenderingContext2D) {
    this.yarn.draw(ctx);
  }
}

// ============ REACT COMPONENT ============

export default function KnitLabEngine({
  pattern,
  yarnColor = "#d7a86e",
  width,
  height,
  stitchWidth = 30,
  stitchHeight = 24,
  gravity = 0.03,
  interactive = true,
  offsetX = 0,
  offsetY = 0,
}: KnitLabProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphRef = useRef<KnitGraph | null>(null);
  const animRef = useRef<number>(0);
  const patternKey = useRef<string>("");

  // Rebuild graph when pattern changes
  const key = pattern.map(r => r.join(",")).join("|");

  useEffect(() => {
    graphRef.current = new KnitGraph(
      pattern,
      yarnColor,
      4,
      stitchWidth,
      stitchHeight,
      offsetX,
      offsetY,
    );
    patternKey.current = key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // Update yarn color without rebuilding
  useEffect(() => {
    if (graphRef.current) {
      graphRef.current.yarn.color = yarnColor;
    }
  }, [yarnColor]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);

      if (graphRef.current) {
        graphRef.current.update(gravity, 8);
        graphRef.current.draw(ctx);
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();
    return () => cancelAnimationFrame(animRef.current);
  }, [width, height, gravity]);

  // Mouse/touch interaction — push yarn around
  // Store pointer position and apply in animation loop to avoid ref mutation in handler
  const pointerRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!interactive) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }, [interactive]);

  const handlePointerLeave = useCallback(() => {
    pointerRef.current = null;
  }, []);

  // Apply pointer interaction inside animation loop
  useEffect(() => {
    function applyInteraction() {
      const ptr = pointerRef.current;
      if (!ptr || !graphRef.current) return;
      for (const p of graphRef.current.yarn.points) {
        const dx = p.x - ptr.x;
        const dy = p.y - ptr.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 25) {
          p.x += dx * 0.15;
          p.y += dy * 0.15;
        }
      }
    }

    const id = setInterval(applyInteraction, 16);
    return () => clearInterval(id);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        width,
        height,
        display: "block",
        touchAction: "none",
      }}
    />
  );
}
