"use client";

import { useEffect, useRef } from "react";

export interface DictionaryNodePoint {
  x: number;
  y: number;
  mobileX: number;
  mobileY: number;
  opacity: number;
}

interface DictionaryNodeNetworkProps {
  points: DictionaryNodePoint[];
}

const buildEdges = (points: DictionaryNodePoint[], mobile: boolean) => {
  const edges: Array<[number, number]> = [];
  const columns = mobile ? 8 : 12;
  const rows = mobile ? 12 : 8;
  const buckets = new Map<string, number[]>();

  points.forEach((point, index) => {
    const x = mobile ? point.mobileX : point.x;
    const y = mobile ? point.mobileY : point.y;
    const cellX = Math.floor((x / 100) * columns);
    const cellY = Math.floor((y / 100) * rows);
    let closest = -1;
    let distance = Number.POSITIVE_INFINITY;

    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        buckets.get(`${cellX + offsetX}:${cellY + offsetY}`)?.forEach((candidateIndex) => {
          const candidate = points[candidateIndex];
          const deltaX = (mobile ? candidate.mobileX : candidate.x) - x;
          const deltaY = (mobile ? candidate.mobileY : candidate.y) - y;
          const nextDistance = deltaX * deltaX + deltaY * deltaY;
          if (nextDistance < distance) {
            closest = candidateIndex;
            distance = nextDistance;
          }
        });
      }
    }

    if (closest >= 0 && distance < (mobile ? 360 : 240)) edges.push([closest, index]);
    const key = `${cellX}:${cellY}`;
    const bucket = buckets.get(key) || [];
    bucket.push(index);
    buckets.set(key, bucket);
  });

  return edges;
};

export default function DictionaryNodeNetwork({ points }: DictionaryNodeNetworkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const field = canvas?.parentElement;
    const context = canvas?.getContext("2d");
    if (!canvas || !field || !context) return;

    const render = () => {
      const bounds = field.getBoundingClientRect();
      const width = Math.max(1, bounds.width);
      const height = Math.max(1, bounds.height);
      const mobile = width <= 680;
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * pixelRatio);
      canvas.height = Math.round(height * pixelRatio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      context.clearRect(0, 0, width, height);

      const coordinate = (point: DictionaryNodePoint) => ({
        x: ((mobile ? point.mobileX : point.x) / 100) * width,
        y: ((mobile ? point.mobileY : point.y) / 100) * height,
      });

      context.lineWidth = 0.7;
      context.strokeStyle = "rgba(220, 232, 243, 0.09)";
      buildEdges(points, mobile).forEach(([fromIndex, toIndex]) => {
        const from = coordinate(points[fromIndex]);
        const to = coordinate(points[toIndex]);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      });

      // A still drawing replaces the animation loop that ran on every frame.
      points.forEach((point, index) => {
        if (index % 3 !== 0) return;
        const { x, y } = coordinate(point);
        context.beginPath();
        context.arc(x, y, 1, 0, Math.PI * 2);
        context.fillStyle = `rgba(231, 239, 247, ${0.12 + point.opacity * 0.13})`;
        context.fill();
      });
    };

    const resizeObserver = new ResizeObserver(render);
    resizeObserver.observe(field);
    render();
    return () => resizeObserver.disconnect();
  }, [points]);

  return <canvas ref={canvasRef} className="dictionary-node-network" aria-hidden="true" />;
}
