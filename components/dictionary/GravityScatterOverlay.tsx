"use client";

import React, { useRef, useEffect } from 'react';
import { useResonanceGesture, Point } from '@/hooks/useResonanceGesture';

interface GravityScatterOverlayProps {
    onWhipDetected: () => void;
    children: React.ReactNode;
    enabled?: boolean;
}

const GravityScatterOverlay: React.FC<GravityScatterOverlayProps> = ({ onWhipDetected, children, enabled = true }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Drawing Logic (View Layer)
    const drawWind = (p1: Point, p2: Point) => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx || !canvasRef.current) return;

        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        // 1. Slash Glow (Neon Green)
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        const gradGlow = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradGlow.addColorStop(0, 'rgba(204, 255, 0, 0)');
        gradGlow.addColorStop(0.5, 'rgba(204, 255, 0, 0.6)');
        gradGlow.addColorStop(1, 'rgba(204, 255, 0, 0)');
        ctx.strokeStyle = gradGlow;
        ctx.lineWidth = 6; // Thinner glow
        ctx.lineCap = 'butt';
        ctx.stroke();

        // 2. Sharp Blade Core (White)
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        const gradCore = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradCore.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradCore.addColorStop(0.5, 'rgba(255, 255, 255, 0.9)');
        gradCore.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = gradCore;
        ctx.lineWidth = 1.2; // Needle-thin core
        ctx.lineCap = 'butt';
        ctx.stroke();

        // Clear immediately after a very tiny linger for sharpness
        setTimeout(() => {
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
        }, 40);
    };

    const { handlers, permission } = useResonanceGesture({
        onTrigger: () => {
            if (enabled) onWhipDetected();
        },
        onTrace: enabled ? drawWind : undefined
    });

    useEffect(() => {
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div
            style={{ position: 'relative', width: '100%', height: '100%' }}
            {...(enabled ? handlers : {})}
        >
            <canvas
                ref={canvasRef}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    display: enabled ? 'block' : 'none',
                    pointerEvents: 'none',
                    zIndex: 9999,
                }}
            />
            {enabled && permission.needed && !permission.granted && (
                <div
                    onClick={permission.request}
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(204, 255, 0, 0.15)',
                        border: '1px solid #CCFF00',
                        color: '#CCFF00',
                        padding: '10px 20px',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        zIndex: 10000,
                        cursor: 'pointer',
                        backdropFilter: 'blur(5px)'
                    }}
                >
                    SHAKE ENABLE
                </div>
            )}
            {children}
        </div>
    );
};

export default GravityScatterOverlay;
