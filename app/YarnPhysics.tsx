"use client";

import { useRef, useEffect, useCallback } from "react";

// ============================================================
// Verlet Integration Yarn Rope Physics
// ============================================================

interface Point {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
}

interface Constraint {
  a: number;
  b: number;
  length: number;
}

interface YarnRopeProps {
  // Start point (needle tip)
  startX: number;
  startY: number;
  // End point (active stitch position)
  endX: number;
  endY: number;
  // Appearance
  color: string;
  thickness?: number;
  // Physics
  segments?: number;
  gravity?: number;
  tension?: number; // 0-1, how taut the yarn is (1 = straight line, 0 = maximum sag)
  // Canvas dimensions
  width: number;
  height: number;
  // Optional second yarn strand
  secondaryColor?: string;
  secondaryStartX?: number;
  secondaryStartY?: number;
  secondaryEndX?: number;
  secondaryEndY?: number;
}

function createRope(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  segments: number,
  tension: number
): { points: Point[]; constraints: Constraint[] } {
  const points: Point[] = [];
  const constraints: Constraint[] = [];

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const x = startX + (endX - startX) * t;
    // Add sag based on tension — parabolic curve
    const sagAmount = (1 - tension) * 40;
    const sag = sagAmount * Math.sin(t * Math.PI);
    const y = startY + (endY - startY) * t + sag;

    points.push({
      x,
      y,
      oldX: x,
      oldY: y,
      pinned: i === 0 || i === segments,
    });
  }

  const segLength =
    Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2) / segments;

  for (let i = 0; i < segments; i++) {
    constraints.push({
      a: i,
      b: i + 1,
      length: segLength * (1 + (1 - tension) * 0.3), // Slightly longer for sag
    });
  }

  return { points, constraints };
}

function simulateRope(
  points: Point[],
  constraints: Constraint[],
  gravity: number,
  iterations: number = 5
) {
  // Verlet integration
  for (const p of points) {
    if (p.pinned) continue;

    const vx = (p.x - p.oldX) * 0.98; // damping
    const vy = (p.y - p.oldY) * 0.98;

    p.oldX = p.x;
    p.oldY = p.y;

    p.x += vx;
    p.y += vy + gravity;
  }

  // Constraint satisfaction
  for (let iter = 0; iter < iterations; iter++) {
    for (const c of constraints) {
      const a = points[c.a];
      const b = points[c.b];

      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist === 0) continue;

      const diff = (c.length - dist) / dist / 2;
      const offsetX = dx * diff;
      const offsetY = dy * diff;

      if (!a.pinned) {
        a.x -= offsetX;
        a.y -= offsetY;
      }
      if (!b.pinned) {
        b.x += offsetX;
        b.y += offsetY;
      }
    }
  }
}

function drawYarn(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  color: string,
  thickness: number
) {
  if (points.length < 2) return;

  // Draw yarn shadow
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y + 2);
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2 + 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y + 2, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y + 2);
  ctx.strokeStyle = "rgba(0,0,0,0.1)";
  ctx.lineWidth = thickness + 2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Draw main yarn strand
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2;
    const yc = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
  }
  ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Yarn highlight (lighter strand on top)
  ctx.beginPath();
  ctx.moveTo(points[0].x - 0.5, points[0].y - 0.5);
  for (let i = 1; i < points.length - 1; i++) {
    const xc = (points[i].x + points[i + 1].x) / 2 - 0.5;
    const yc = (points[i].y + points[i + 1].y) / 2 - 0.5;
    ctx.quadraticCurveTo(points[i].x - 0.5, points[i].y - 0.5, xc, yc);
  }
  ctx.lineTo(
    points[points.length - 1].x - 0.5,
    points[points.length - 1].y - 0.5
  );
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = thickness * 0.35;
  ctx.stroke();

  // Yarn texture — tiny perpendicular dashes for fiber effect
  for (let i = 1; i < points.length - 1; i += 2) {
    const prev = points[i - 1];
    const next = points[i + 1];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) continue;

    // Perpendicular direction
    const nx = -dy / len;
    const ny = dx / len;
    const fiberLen = thickness * 0.4;

    ctx.beginPath();
    ctx.moveTo(
      points[i].x - nx * fiberLen,
      points[i].y - ny * fiberLen
    );
    ctx.lineTo(
      points[i].x + nx * fiberLen,
      points[i].y + ny * fiberLen
    );
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

// Draw a knitting needle
function drawNeedle(
  ctx: CanvasRenderingContext2D,
  tipX: number,
  tipY: number,
  angle: number, // radians
  length: number,
  side: "left" | "right"
) {
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(angle);

  // Needle shaft
  const grad = ctx.createLinearGradient(0, -3, 0, 3);
  grad.addColorStop(0, "#e8d4b8");
  grad.addColorStop(0.5, "#c8a882");
  grad.addColorStop(1, "#a08060");

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-length, 0);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.stroke();

  // Needle tip (pointed)
  ctx.beginPath();
  ctx.moveTo(2, -3);
  ctx.lineTo(8, 0);
  ctx.lineTo(2, 3);
  ctx.fillStyle = "#d4b896";
  ctx.fill();

  // Needle stopper (ball at end)
  ctx.beginPath();
  ctx.arc(-length, 0, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#b89870";
  ctx.fill();
  ctx.strokeStyle = "#a08060";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export default function YarnPhysics({
  startX,
  startY,
  endX,
  endY,
  color,
  thickness = 4,
  segments = 12,
  gravity = 0.15,
  tension = 0.6,
  width,
  height,
  secondaryColor,
  secondaryStartX,
  secondaryStartY,
  secondaryEndX,
  secondaryEndY,
}: YarnRopeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ropeRef = useRef<{ points: Point[]; constraints: Constraint[] } | null>(null);
  const rope2Ref = useRef<{ points: Point[]; constraints: Constraint[] } | null>(null);
  const animRef = useRef<number>(0);
  const prevPropsRef = useRef({ startX, startY, endX, endY });

  // Initialize or update rope when endpoints change
  useEffect(() => {
    const prev = prevPropsRef.current;
    const moved =
      Math.abs(prev.endX - endX) > 2 ||
      Math.abs(prev.endY - endY) > 2 ||
      Math.abs(prev.startX - startX) > 2;

    if (!ropeRef.current || moved) {
      ropeRef.current = createRope(startX, startY, endX, endY, segments, tension);
      prevPropsRef.current = { startX, startY, endX, endY };
    }

    // Update pinned endpoints
    if (ropeRef.current) {
      ropeRef.current.points[0].x = startX;
      ropeRef.current.points[0].y = startY;
      ropeRef.current.points[ropeRef.current.points.length - 1].x = endX;
      ropeRef.current.points[ropeRef.current.points.length - 1].y = endY;
    }

    // Secondary rope
    if (secondaryColor && secondaryStartX != null && secondaryEndX != null) {
      if (!rope2Ref.current || moved) {
        rope2Ref.current = createRope(
          secondaryStartX,
          secondaryStartY ?? startY,
          secondaryEndX,
          secondaryEndY ?? endY,
          segments,
          tension
        );
      }
      rope2Ref.current.points[0].x = secondaryStartX;
      rope2Ref.current.points[0].y = secondaryStartY ?? startY;
      rope2Ref.current.points[rope2Ref.current.points.length - 1].x = secondaryEndX;
      rope2Ref.current.points[rope2Ref.current.points.length - 1].y = secondaryEndY ?? endY;
    }
  }, [startX, startY, endX, endY, segments, tension, secondaryColor, secondaryStartX, secondaryStartY, secondaryEndX, secondaryEndY]);

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

      // Simulate & draw primary rope
      if (ropeRef.current) {
        simulateRope(ropeRef.current.points, ropeRef.current.constraints, gravity);
        drawYarn(ctx, ropeRef.current.points, color, thickness);
      }

      // Simulate & draw secondary rope
      if (rope2Ref.current && secondaryColor) {
        simulateRope(rope2Ref.current.points, rope2Ref.current.constraints, gravity);
        drawYarn(ctx, rope2Ref.current.points, secondaryColor, thickness);
      }

      // Draw left needle
      drawNeedle(ctx, startX, startY, Math.PI * 0.15, 50, "left");

      // Draw right needle (if secondary)
      if (secondaryStartX != null) {
        drawNeedle(ctx, secondaryStartX, secondaryStartY ?? startY, Math.PI * 0.85, 50, "right");
      } else {
        // Single right needle at right edge
        drawNeedle(ctx, width - 10, startY, Math.PI * 0.85, 50, "right");
      }

      animRef.current = requestAnimationFrame(animate);
    }

    animate();

    return () => {
      cancelAnimationFrame(animRef.current);
    };
  }, [width, height, color, thickness, gravity, startX, startY, secondaryColor, secondaryStartX, secondaryStartY]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width,
        height,
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 10,
      }}
    />
  );
}
