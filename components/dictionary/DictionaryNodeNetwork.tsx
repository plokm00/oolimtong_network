"use client";

import { useEffect, useMemo, useRef } from "react";

export interface DictionaryNodePoint {
  x: number;
  y: number;
  opacity: number;
}

interface DictionaryNodeNetworkProps {
  points: DictionaryNodePoint[];
}

interface NetworkEdge {
  from: number;
  to: number;
  phase: number;
}

interface NetworkStar {
  x: number;
  y: number;
  size: number;
  opacity: number;
  phase: number;
}

const hashNumber = (value: number) => {
  let hash = value | 0;
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
  hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
  return (hash ^ (hash >>> 16)) >>> 0;
};

const randomUnit = (value: number) => hashNumber(value) / 4294967295;

const buildEdges = (points: DictionaryNodePoint[]) => {
  const columns = 12;
  const rows = 7;
  const buckets = new Map<string, number[]>();
  const edges: NetworkEdge[] = [];

  points.forEach((point, index) => {
    const cellX = Math.min(columns - 1, Math.floor((point.x / 100) * columns));
    const cellY = Math.min(rows - 1, Math.floor((point.y / 100) * rows));
    let closestIndex = -1;
    let closestDistance = Number.POSITIVE_INFINITY;

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        const candidates = buckets.get(`${cellX + offsetX}:${cellY + offsetY}`);
        candidates?.forEach((candidateIndex) => {
          const candidate = points[candidateIndex];
          const deltaX = candidate.x - point.x;
          const deltaY = candidate.y - point.y;
          const distance = deltaX * deltaX + deltaY * deltaY;

          if (distance < closestDistance) {
            closestIndex = candidateIndex;
            closestDistance = distance;
          }
        });
      }
    }

    if (closestIndex >= 0 && closestDistance < 155) {
      edges.push({
        from: closestIndex,
        to: index,
        phase: randomUnit(index * 7919 + closestIndex * 104729),
      });
    }

    const key = `${cellX}:${cellY}`;
    const bucket = buckets.get(key) || [];
    bucket.push(index);
    buckets.set(key, bucket);
  });

  return edges;
};

export default function DictionaryNodeNetwork({
  points,
}: DictionaryNodeNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const edges = useMemo(() => buildEdges(points), [points]);
  const stars = useMemo<NetworkStar[]>(
    () =>
      Array.from({ length: 96 }, (_, index) => ({
        x: randomUnit(index * 3571 + 17),
        y: randomUnit(index * 6271 + 43),
        size: 0.35 + randomUnit(index * 811 + 101) * 1.15,
        opacity: 0.08 + randomUnit(index * 1237 + 71) * 0.32,
        phase: randomUnit(index * 1877 + 13) * Math.PI * 2,
      })),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !field || !context) return;

    let width = 1;
    let height = 1;
    let animationFrame = 0;
    let inView = true;
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const resize = () => {
      const bounds = field.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const render = (time: number) => {
      context.clearRect(0, 0, width, height);

      if (inView) {
        const pointerX = (pointerRef.current.x - 0.5) * 6;
        const pointerY = (pointerRef.current.y - 0.5) * 6;
        context.globalCompositeOperation = "lighter";

        stars.forEach((star) => {
          const shimmer = reduceMotion
            ? 0.72
            : 0.68 + Math.sin(time * 0.00055 + star.phase) * 0.24;
          context.beginPath();
          context.arc(
            star.x * width + pointerX * star.size,
            star.y * height + pointerY * star.size,
            star.size,
            0,
            Math.PI * 2,
          );
          context.fillStyle = `rgba(218, 255, 117, ${star.opacity * shimmer})`;
          context.fill();
        });

        edges.forEach((edge, edgeIndex) => {
          const from = points[edge.from];
          const to = points[edge.to];
          if (!from || !to) return;

          const fromDepth = 0.35 + from.opacity * 0.65;
          const toDepth = 0.35 + to.opacity * 0.65;
          const fromX = (from.x / 100) * width + pointerX * fromDepth;
          const fromY = (from.y / 100) * height + pointerY * fromDepth;
          const toX = (to.x / 100) * width + pointerX * toDepth;
          const toY = (to.y / 100) * height + pointerY * toDepth;
          const pulse = reduceMotion
            ? 0.58
            : 0.5 + Math.sin(time * 0.0007 + edge.phase * 9) * 0.24;

          context.beginPath();
          context.moveTo(fromX, fromY);
          context.lineTo(toX, toY);
          context.lineWidth = 0.45 + pulse * 0.35;
          context.strokeStyle = `rgba(172, 255, 46, ${0.035 + pulse * 0.06})`;
          context.stroke();

          if (edgeIndex % 6 === 0 && !reduceMotion) {
            const progress = (time * 0.000035 + edge.phase) % 1;
            const signalX = fromX + (toX - fromX) * progress;
            const signalY = fromY + (toY - fromY) * progress;
            context.beginPath();
            context.arc(signalX, signalY, 0.7, 0, Math.PI * 2);
            context.fillStyle = "rgba(220, 255, 120, 0.46)";
            context.fill();
          }
        });
      }

      context.globalCompositeOperation = "source-over";
      if (!reduceMotion) animationFrame = window.requestAnimationFrame(render);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = field.getBoundingClientRect();
      pointerRef.current = {
        x: (event.clientX - bounds.left) / Math.max(bounds.width, 1),
        y: (event.clientY - bounds.top) / Math.max(bounds.height, 1),
      };
    };

    const handlePointerLeave = () => {
      pointerRef.current = { x: 0.5, y: 0.5 };
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(field);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry?.isIntersecting ?? true;
    });
    visibilityObserver.observe(canvas);
    field.addEventListener("pointermove", handlePointerMove, { passive: true });
    field.addEventListener("pointerleave", handlePointerLeave, { passive: true });

    resize();
    if (reduceMotion) render(0);
    else animationFrame = window.requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      field.removeEventListener("pointermove", handlePointerMove);
      field.removeEventListener("pointerleave", handlePointerLeave);
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, [edges, points, stars]);

  return (
    <canvas
      ref={canvasRef}
      className="dictionary-node-network"
      aria-hidden="true"
    />
  );
}
