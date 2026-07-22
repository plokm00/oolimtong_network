import { useEffect, useRef } from "react"
import { STAR_COUNT, CLOUD_COUNT, STAR_PARALLAX_INTENSITY, CLOUD_PARALLAX_INTENSITY } from "@/lib/constants"

// Types
interface Star {
    x: number
    y: number
    z: number
    size: number
    opacity: number
    color: string
}

interface NebulaCloud {
    x: number
    y: number
    z: number
    size: number
    color: string
    opacity: number
}

interface StarfieldCanvasProps {
    mousePos: { x: number; y: number };
    isMouseActive: boolean;
}

// High-performance Starfield using Canvas
export const StarfieldCanvas: React.FC<StarfieldCanvasProps> = ({ mousePos, isMouseActive }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const starsRef = useRef<Star[]>([]);
    const cloudsRef = useRef<NebulaCloud[]>([]);
    // Ref-based mousePos: RAF loop reads current value without restarting
    const mousePosRef = useRef(mousePos);

    // Sync ref on every render — no RAF restart needed
    useEffect(() => {
        mousePosRef.current = mousePos;
    }, [mousePos]);

    // Generate stars & clouds once
    useEffect(() => {
        starsRef.current = Array.from({ length: STAR_COUNT }, () => {
            const angle = Math.random() * Math.PI * 2;
            const rNormalized = 0.15 + Math.pow(Math.random(), 0.3) * 0.85;
            const r = rNormalized * 80;
            const z = Math.random();
            const distance = rNormalized;

            let color = '#3b82f6';
            if (distance < 0.35) {
                color = Math.random() > 0.5 ? '#ffffff' : '#CCFF00';
            } else if (distance < 0.55) {
                color = Math.random() > 0.5 ? '#E1FF80' : '#22d3ee';
            } else if (Math.random() > 0.8) {
                color = '#ffffff';
            }

            return {
                x: 50 + (r * Math.cos(angle)),
                y: 50 + (r * Math.sin(angle)),
                z,
                size: Math.random() * 1.2 + 0.3,
                opacity: Math.random() * 0.7 + 0.1,
                color
            };
        });

        cloudsRef.current = Array.from({ length: CLOUD_COUNT }, () => {
            const angle = Math.random() * Math.PI * 2;
            const r = 20 + Math.random() * 60;
            const z = Math.random() * 0.5;
            const color = Math.random() > 0.7 ? '204, 255, 0' : '59, 130, 246';

            return {
                x: 50 + r * Math.cos(angle),
                y: 50 + r * Math.sin(angle),
                z,
                size: 150 + Math.random() * 250,
                color,
                opacity: 0.02 + Math.random() * 0.04
            };
        });
    }, []);

    // Single RAF loop — runs once, reads mousePos from ref to avoid restarts
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Resize canvas on window resize — separate from the draw loop
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        let animationFrameId: number;

        const render = () => {
            const { x: mx, y: my } = mousePosRef.current;
            const { width, height } = canvas;

            const clearGradient = ctx.createRadialGradient(
                width / 2, height / 2, 0,
                width / 2, height / 2, Math.max(width, height) * 0.8
            );
            clearGradient.addColorStop(0, '#000d0e');
            clearGradient.addColorStop(1, '#000000');
            ctx.fillStyle = clearGradient;
            ctx.fillRect(0, 0, width, height);

            // 1. Nebula Clouds (background)
            cloudsRef.current.forEach(cloud => {
                const intensity = CLOUD_PARALLAX_INTENSITY * cloud.z;
                const offsetX = (mx - 0.5) * intensity * 2;
                const offsetY = (my - 0.5) * intensity * 2;
                const screenX = (cloud.x / 100) * width + offsetX;
                const screenY = (cloud.y / 100) * height + offsetY;

                const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, cloud.size);
                gradient.addColorStop(0, `rgba(${cloud.color}, ${cloud.opacity})`);
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenX, screenY, cloud.size, 0, Math.PI * 2);
                ctx.fill();
            });

            // 2. Stars
            ctx.globalAlpha = 1;
            starsRef.current.forEach(star => {
                const intensity = STAR_PARALLAX_INTENSITY * star.z;
                const offsetX = (mx - 0.5) * intensity * 2;
                const offsetY = (my - 0.5) * intensity * 2;
                const x = (star.x / 100) * width + offsetX;
                const y = (star.y / 100) * height + offsetY;

                ctx.beginPath();
                ctx.arc(x, y, star.size, 0, Math.PI * 2);
                ctx.fillStyle = star.color;
                ctx.globalAlpha = star.opacity;
                ctx.fill();
            });

            // Reset globalAlpha so it doesn't bleed into other canvas operations
            ctx.globalAlpha = 1;

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resize);
        };
    }, []); // Empty deps — loop runs once, mousePos updates via ref

    return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" />;
};
