'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCcw, Undo2, Sparkles } from 'lucide-react';

interface RingSettings {
    r: number; amplitude: number; freq: number; symmetry: number;
    bps: number; bw: number; color: string; lineWidth: number; shape: string;
}
interface MandalaRitualProps {
    onComplete: (score: number) => void;
    level: number;        // current stage being worked on (1-based)
    onLevelUp: () => void;
    gatewayId: string;
}

const CS = 300; // canvas size
const MAX_R = 138;

// ── Color helpers ─────────────────────────────────────
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
    const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; } else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; } else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; } else { r = c; b = x; }
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
function hsvToHex(h: number, s: number, v: number) {
    return '#' + hsvToRgb(h, s, v).map(n => n.toString(16).padStart(2, '0')).join('');
}

// ── Tiny labeled slider ───────────────────────────────
function Ctrl({ label, value, min, max, onChange }: {
    label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
    return (
        <div className="flex items-center gap-1.5 h-4 group">
            <span className="text-[9px] text-white/60 uppercase w-11 shrink-0 text-left font-medium tracking-tight whitespace-nowrap">{label}</span>
            <div className="flex-1 flex items-center px-1">
                <input type="range" min={min} max={max} value={value}
                    onChange={e => onChange(+e.target.value)}
                    className="w-full h-[2px] cursor-pointer accent-[#CCFF00] appearance-none bg-white/10 hover:bg-white/15 transition-colors rounded-full" 
                    style={{
                        // Custom styling for range thumb using a style block is handled globally if possible, 
                        // but here we can at least set basic properties.
                    }}
                />
            </div>
            <span className="text-[9px] text-[#CCFF00]/60 font-mono w-4 text-right shrink-0">{value}</span>
        </div>
    );
}


// Global style for tiny range thumb
const GlobalSliderStyle = () => (
    <style dangerouslySetInnerHTML={{ __html: `
        input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            height: 8px;
            width: 8px;
            border-radius: 50%;
            background: #CCFF00;
            box-shadow: 0 0 5px rgba(204, 255, 0, 0.4);
            cursor: pointer;
            margin-top: -3.25px; /* Centers thumb on track */
            border: none;
        }
        input[type=range]::-moz-range-thumb {
            height: 8px;
            width: 8px;
            border-radius: 50%;
            background: #CCFF00;
            cursor: pointer;
            border: none;
        }
        input[type=range]:focus {
            outline: none;
        }
    `}} />
);

export const MandalaRitual: React.FC<MandalaRitualProps> = ({ onComplete, level, onLevelUp, gatewayId }) => {
    const TOTAL_STAGES = 6;
    const [viewingStage, setViewingStage] = useState(level);
    const [navWarnOpen, setNavWarnOpen] = useState(false);
    const [pendingStage, setPendingStage] = useState<number | null>(null);

    // ── Canvas refs ──────────────────────────────────
    const canvasRef   = useRef<HTMLCanvasElement>(null);
    const sbCanvasRef = useRef<HTMLCanvasElement>(null);
    const sbDragging  = useRef(false);

    // ── Ring data (ref = no-render-delay; state = for UI count) ──
    const ringsRef = useRef<RingSettings[]>([]);
    const [ringCount, setRingCount] = useState(0); // only for progress bar + level check

    // ── Controls (all as refs so draw is always in sync) ─
    const ctrlRef = useRef({
        pickerH: 30, pickerS: 0.9, pickerV: 0.92,
        amplitude: 6, freq: 8, symmetry: 8,
        bps: 1, bw: 25, lineWidth: 2, shape: 'none',
        cymM: 3, cymN: 2, cymIntensity: 0.3,
        cymPreviewOn: false,
    });
    // Mirror to state for React re-render (controls UI)
    const [ctrl, setCtrl] = useState({ ...ctrlRef.current });
    const setC = useCallback((patch: Partial<typeof ctrlRef.current>) => {
        ctrlRef.current = { ...ctrlRef.current, ...patch };
        setCtrl({ ...ctrlRef.current });
    }, []);

    const curColor = hsvToHex(ctrl.pickerH, ctrl.pickerS, ctrl.pickerV);

    // ── Recent colors ────────────────────────────────
    const [recentColors, setRecentColors] = useState<string[]>([]);

    // ── Card modal ───────────────────────────────────
    const [cardOpen, setCardOpen]       = useState(false);
    const [cardStyle, setCardStyle]     = useState<'tarot'|'temple'|'robe'>('tarot');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [galleryOpen, setGalleryOpen] = useState(false);
    const cardCanvasRef  = useRef<HTMLCanvasElement>(null);
    const galleryRefs    = useRef<(HTMLCanvasElement | null)[]>(Array(6).fill(null));

    // ── Draft / completed snapshot helpers ───────────
    const draftKey  = (s: number) => `ninnik_mandala_draft_${gatewayId}_s${s}`;
    const doneKey   = (s: number) => `ninnik_mandala_done_${gatewayId}_s${s}`;

    const saveDraft = () => {
        localStorage.setItem(draftKey(viewingStage), JSON.stringify(ringsRef.current));
    };
    const clearDraft = (s: number) => { localStorage.removeItem(draftKey(s)); };
    const saveCompleted = (s: number) => {
        localStorage.setItem(doneKey(s), JSON.stringify(ringsRef.current));
    };
    const hasDraft = (s: number) => !!localStorage.getItem(draftKey(s));
    const loadStage = useCallback((s: number) => {
        const completed = localStorage.getItem(doneKey(s));
        const draft     = localStorage.getItem(draftKey(s));
        // For current active stage: prefer draft (work in progress) over completed snapshot
        // For past completed stages: prefer completed snapshot
        const raw = s < level
            ? (completed ?? draft)
            : (draft ?? completed);
        if (raw) {
            try {
                const rings = JSON.parse(raw) as RingSettings[];
                ringsRef.current = rings;
                setRingCount(rings.length);
            } catch { ringsRef.current = []; setRingCount(0); }
        } else {
            ringsRef.current = []; setRingCount(0);
        }
        redraw();
    }, [gatewayId, level]); // eslint-disable-line react-hooks/exhaustive-deps

    // Navigate to another stage with unsaved-work guard
    const navigateTo = (target: number) => {
        if (viewingStage === level && ringCount > 0 && !hasDraft(level)) {
            setPendingStage(target);
            setNavWarnOpen(true);
        } else {
            doNavigate(target);
        }
    };
    const doNavigate = (target: number) => {
        setViewingStage(target);
        loadStage(target);
    };

    // ================================================================
    // DRAWING — fully synchronous, reads from refs
    // ================================================================

    const drawDeco = (ctx: CanvasRenderingContext2D, x: number, y: number,
        angle: number, shape: string, color: string, lw: number, size: number) => {
        const cos = Math.cos(angle), sin = Math.sin(angle);
        const pc = Math.cos(angle + Math.PI / 2), ps = Math.sin(angle + Math.PI / 2);
        ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = color;
        ctx.lineWidth = lw; ctx.shadowBlur = 8; ctx.shadowColor = color;
        if (shape === 'rabbit') {
            ctx.beginPath(); ctx.arc(x + cos * size * 0.9, y + sin * size * 0.9, size * 0.75, 0, Math.PI * 2); ctx.fill();
            ctx.globalAlpha *= 0.65;
            ctx.beginPath(); ctx.arc(x + cos * size * 0.4 + pc * size * 0.7, y + sin * size * 0.4 + ps * size * 0.7, size * 0.48, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(x + cos * size * 0.4 - pc * size * 0.7, y + sin * size * 0.4 - ps * size * 0.7, size * 0.48, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'fox') {
            ctx.beginPath(); ctx.moveTo(x + cos * size * 2.2, y + sin * size * 2.2);
            ctx.lineTo(x + pc * size * 0.9, y + ps * size * 0.9); ctx.lineTo(x - pc * size * 0.9, y - ps * size * 0.9);
            ctx.closePath(); ctx.fill();
            ctx.globalAlpha *= 0.4; ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.moveTo(x + cos * size * 1.7, y + sin * size * 1.7);
            ctx.lineTo(x + pc * size * 0.4, y + ps * size * 0.4); ctx.lineTo(x - pc * size * 0.4, y - ps * size * 0.4);
            ctx.closePath(); ctx.fill();
        } else if (shape === 'ram') {
            ctx.lineWidth = lw * 1.2;
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.bezierCurveTo(x + cos * size * 2.2 + pc * size * 1.5, y + sin * size * 2.2 + ps * size * 1.5,
                x + cos * size * 2.8 + pc * size * 0.2, y + sin * size * 2.8 + ps * size * 0.2,
                x + cos * size * 1.8 - pc * size * 0.6, y + sin * size * 1.8 - ps * size * 0.6); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(x, y);
            ctx.bezierCurveTo(x + cos * size * 2.2 - pc * size * 1.5, y + sin * size * 2.2 - ps * size * 1.5,
                x + cos * size * 2.8 - pc * size * 0.2, y + sin * size * 2.8 - ps * size * 0.2,
                x + cos * size * 1.8 + pc * size * 0.6, y + sin * size * 1.8 + ps * size * 0.6); ctx.stroke();
            ctx.beginPath(); ctx.arc(x + cos * size * 0.5, y + sin * size * 0.5, size * 0.3, 0, Math.PI * 2); ctx.fill();
        } else if (shape === 'rooster') {
            [{ ox: 0, oy: 1 }, { ox: -0.55, oy: 0.7 }, { ox: 0.55, oy: 0.7 }].forEach((p, i) => {
                ctx.beginPath();
                ctx.arc(x + cos * size * p.oy * 1.1 + pc * size * p.ox, y + sin * size * p.oy * 1.1 + ps * size * p.ox,
                    i === 0 ? size * 0.65 : size * 0.5, 0, Math.PI * 2); ctx.fill();
            });
        }
        ctx.restore();
    };

    const drawRingOnCtx = (ctx: CanvasRenderingContext2D, cx: number, cy: number, ring: RingSettings, alpha = 1) => {
        const { r, amplitude, freq, symmetry, bps, bw, color, lineWidth, shape } = ring;
        const { cymM, cymN, cymIntensity, cymPreviewOn } = ctrlRef.current;
        const segA = (Math.PI * 2) / symmetry;

        const getDistortedPos = (radius: number, angle: number) => {
            let finalR = radius;
            if (cymPreviewOn && cymIntensity > 0) {
                const normR = radius / MAX_R;
                const v1 = Math.sin(cymM * Math.PI * normR) * Math.cos(cymN * angle);
                const v2 = Math.sin(cymN * Math.PI * normR) * Math.cos(cymM * angle);
                const v = (v1 + v2 * 0.6) / 1.6;
                finalR += v * cymIntensity * 40; // max 40px distortion
            }
            return {
                x: cx + Math.cos(angle) * finalR,
                y: cy + Math.sin(angle) * finalR
            };
        };

        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.fillStyle = color;
        ctx.lineWidth = lineWidth; ctx.lineCap = 'round';
        ctx.shadowBlur = lineWidth * 4; ctx.shadowColor = color;

        for (let sym = 0; sym < symmetry; sym++) {
            const rot = sym * segA;
            const breaks: { start: number; end: number }[] = [];
            if (bps > 0 && bw > 0) {
                const bwA = (bw / 100) * segA / (bps + 1) * 0.8;
                for (let b = 0; b < bps; b++) {
                    const center = rot + segA * (b + 1) / (bps + 1);
                    breaks.push({ start: center - bwA / 2, end: center + bwA / 2 });
                }
            }
            const STEP = 0.008; let drawing = false; ctx.beginPath();
            for (let t = rot; t <= rot + segA + STEP; t += STEP) {
                const inB = breaks.some(b => t >= b.start && t < b.end);
                const wR = Math.min(r + Math.sin(t * freq) * amplitude, MAX_R);
                const pos = getDistortedPos(wR, t);
                if (inB) { if (drawing) { ctx.stroke(); ctx.beginPath(); drawing = false; } }
                else { if (!drawing) { ctx.moveTo(pos.x, pos.y); drawing = true; } else ctx.lineTo(pos.x, pos.y); }
            }
            if (drawing) ctx.stroke();
            if (shape !== 'none') {
                for (const b of breaks) {
                    const midA = (b.start + b.end) / 2;
                    const midR = Math.min(r + Math.sin(midA * freq) * amplitude, MAX_R);
                    const pos = getDistortedPos(midR, midA);
                    drawDeco(ctx, pos.x, pos.y, midA, shape, color, lineWidth, lineWidth * 2.5 + 3);
                }
            }
        }
        ctx.restore();
    };

    const applyCymatics = (_canvas: HTMLCanvasElement) => {
        // No-op: distortion is now applied directly during SVG/Canvas line drawing
    };

    // Master draw — reads directly from ringsRef, no state dep
    const redraw = useCallback((previewRing?: RingSettings) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, CS, CS);
        const cx = CS / 2, cy = CS / 2;

        // Circular clip
        ctx.save();
        ctx.beginPath(); ctx.arc(cx, cy, CS / 2 - 1, 0, Math.PI * 2); ctx.clip();

        // Guide rings & cross
        ctx.strokeStyle = 'rgba(204,255,0,0.07)'; ctx.lineWidth = 0.5;
        [30, 60, 90, 120].forEach(r => { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); });
        ctx.strokeStyle = 'rgba(204,255,0,0.04)';
        ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, CS); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(CS, cy); ctx.stroke();

        ringsRef.current.forEach(ring => drawRingOnCtx(ctx, cx, cy, ring, 1));
        if (previewRing) drawRingOnCtx(ctx, cx, cy, previewRing, 0.3);
        ctx.restore();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Canvas mouse events ──────────────────────────
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (CS / rect.width);
        const my = (e.clientY - rect.top)  * (CS / rect.height);
        const r  = Math.hypot(mx - CS / 2, my - CS / 2);
        if (r < 10 || r > MAX_R) { redraw(); return; }
        const c = ctrlRef.current;
        redraw({ r, amplitude: c.amplitude, freq: c.freq, symmetry: c.symmetry,
            bps: c.bps, bw: c.bw, color: hsvToHex(c.pickerH, c.pickerS, c.pickerV),
            lineWidth: c.lineWidth, shape: c.shape });
    };

    const handleMouseLeave = () => { redraw(); };

    const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current; if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) * (CS / rect.width);
        const my = (e.clientY - rect.top)  * (CS / rect.height);
        const r  = Math.hypot(mx - CS / 2, my - CS / 2);
        if (r < 10 || r > MAX_R) return;
        const c = ctrlRef.current;
        const color = hsvToHex(c.pickerH, c.pickerS, c.pickerV);
        const newRing: RingSettings = { r, amplitude: c.amplitude, freq: c.freq,
            symmetry: c.symmetry, bps: c.bps, bw: c.bw, color, lineWidth: c.lineWidth, shape: c.shape };
        ringsRef.current = [...ringsRef.current, newRing];
        setRingCount(ringsRef.current.length);
        setRecentColors(prev => prev.includes(color) ? prev : [color, ...prev].slice(0, 24));
        redraw();
    };

    const handleUndo = () => {
        ringsRef.current = ringsRef.current.slice(0, -1);
        setRingCount(ringsRef.current.length);
        redraw();
    };
    const handleClear = () => {
        ringsRef.current = []; setRingCount(0); redraw();
    };

    // ── SB canvas ────────────────────────────────────
    const drawSBCanvas = useCallback(() => {
        const cv = sbCanvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d')!;
        const W = cv.width, H = cv.height;
        const { pickerH, pickerS, pickerV } = ctrlRef.current;
        const [hr, hg, hb] = hsvToRgb(pickerH, 1, 1);
        const gS = ctx.createLinearGradient(0, 0, W, 0);
        gS.addColorStop(0, '#fff'); gS.addColorStop(1, `rgb(${hr},${hg},${hb})`);
        ctx.fillStyle = gS; ctx.fillRect(0, 0, W, H);
        const gV = ctx.createLinearGradient(0, 0, 0, H);
        gV.addColorStop(0, 'rgba(0,0,0,0)'); gV.addColorStop(1, 'rgba(0,0,0,1)');
        ctx.fillStyle = gV; ctx.fillRect(0, 0, W, H);
        const dotX = pickerS * W, dotY = (1 - pickerV) * H;
        ctx.beginPath(); ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
        ctx.strokeStyle = pickerV > 0.45 ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)';
        ctx.lineWidth = 2; ctx.stroke();
        ctx.beginPath(); ctx.arc(dotX, dotY, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = hsvToHex(pickerH, pickerS, pickerV); ctx.fill();
    }, []);

    useEffect(() => { drawSBCanvas(); }, [ctrl.pickerH, ctrl.pickerS, ctrl.pickerV, drawSBCanvas]);
    useEffect(() => { redraw(); }, [ctrl.cymPreviewOn, ctrl.cymM, ctrl.cymN, ctrl.cymIntensity, redraw]);
    useEffect(() => {
        setViewingStage(level);
        loadStage(level);
    }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

    const pickSB = (e: React.MouseEvent | React.TouchEvent) => {
        const cv = sbCanvasRef.current; if (!cv) return;
        const rect = cv.getBoundingClientRect();
        const cx = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const cy2 = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setC({ pickerS: Math.max(0, Math.min(1, (cx - rect.left) / rect.width)),
               pickerV: Math.max(0, Math.min(1, 1 - (cy2 - rect.top) / rect.height)) });
    };

    // ── Card rendering ───────────────────────────────
    const stampMandala = (ctx2: CanvasRenderingContext2D, x: number, y: number, size: number) => {
        const tmp = document.createElement('canvas'); tmp.width = CS; tmp.height = CS;
        const tc = tmp.getContext('2d')!;
        ringsRef.current.forEach(ring => drawRingOnCtx(tc, CS / 2, CS / 2, ring, 1));
        ctx2.drawImage(tmp, x, y, size, size);
    };

    const renderCard = useCallback(() => {
        const cv = cardCanvasRef.current; if (!cv) return;
        const ctx = cv.getContext('2d')!;
        const W = cv.width, H = cv.height;
        ctx.clearRect(0, 0, W, H);

        if (cardStyle === 'tarot') {
            const bg = ctx.createLinearGradient(0, 0, 0, H);
            bg.addColorStop(0, '#0f0600'); bg.addColorStop(1, '#070300');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
            // Stars
            for (let i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(255,255,200,${Math.random() * 0.3 + 0.05})`;
                ctx.beginPath(); ctx.arc(Math.random() * W, Math.random() * H, Math.random() + 0.3, 0, Math.PI * 2); ctx.fill();
            }
            // Border
            ctx.strokeStyle = '#CCFF00'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.roundRect(6, 6, W - 12, H - 12, 8); ctx.stroke();
            ctx.strokeStyle = 'rgba(204,255,0,0.25)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.roundRect(11, 11, W - 22, H - 22, 6); ctx.stroke();
            // Title
            ctx.fillStyle = '#CCFF00'; ctx.font = 'bold 11px serif'; ctx.textAlign = 'center';
            ctx.shadowBlur = 6; ctx.shadowColor = '#CCFF00';
            ctx.fillText('니 닉 카 드', W / 2, 30); ctx.shadowBlur = 0;
            // Divider
            ctx.strokeStyle = 'rgba(204,255,0,0.3)'; ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(24, 38); ctx.lineTo(W - 24, 38); ctx.stroke();
            // Mandala
            stampMandala(ctx, 16, 46, W - 32);
            const mb = 46 + W - 32 + 6;
            ctx.beginPath(); ctx.moveTo(24, mb); ctx.lineTo(W - 24, mb); ctx.stroke();
            ctx.fillStyle = 'rgba(204,255,0,0.5)'; ctx.font = '8px serif';
            ctx.fillText('나만의 니닉 공명', W / 2, mb + 14);
            ctx.fillStyle = '#CCFF00'; ctx.font = 'bold 8px serif';
            ctx.fillText('PERSONAL RESONANCE', W / 2, mb + 26);
            ctx.fillStyle = 'rgba(204,255,0,0.3)'; ctx.font = '7px monospace';
            ctx.fillText(`#NNK-${String(level).padStart(4, '0')}`, W / 2, H - 12);

        } else if (cardStyle === 'temple') {
            const bg = ctx.createLinearGradient(0, 0, W, H);
            bg.addColorStop(0, '#1a1410'); bg.addColorStop(0.5, '#120f0a'); bg.addColorStop(1, '#0a0806');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
            // Stone texture
            for (let i = 0; i < 200; i++) {
                ctx.fillStyle = `rgba(${180 + Math.random() * 40},${140 + Math.random() * 30},${80 + Math.random() * 20},${Math.random() * 0.04})`;
                ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, Math.random() * 2 + 1);
            }
            // Arch
            ctx.fillStyle = '#1e1508';
            ctx.beginPath(); ctx.ellipse(W / 2, 55, W / 2 - 24, 36, 0, Math.PI, 0, true); ctx.fill();
            ctx.strokeStyle = 'rgba(204,255,0,0.3)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.ellipse(W / 2, 55, W / 2 - 24, 36, 0, Math.PI, 0, true); ctx.stroke();
            // Title
            ctx.fillStyle = 'rgba(204,255,0,0.4)'; ctx.font = 'bold 9px serif'; ctx.textAlign = 'center';
            ctx.fillText('니 닉 성 소', W / 2, 18);
            // Glowing mandala
            ctx.save(); ctx.shadowBlur = 28; ctx.shadowColor = 'rgba(204,255,0,0.6)';
            stampMandala(ctx, 24, 54, W - 48);
            ctx.restore();
            ctx.strokeStyle = 'rgba(204,255,0,0.15)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.arc(W / 2, 54 + (W - 48) / 2, (W - 48) / 2 + 4, 0, Math.PI * 2); ctx.stroke();
            const bot = 54 + (W - 48) + 10;
            ctx.fillStyle = 'rgba(204,255,0,0.3)'; ctx.font = '7px monospace';
            ctx.fillText('第 一 公 鳴 者', W / 2, bot + 8);
            ctx.fillStyle = 'rgba(204,255,0,0.5)'; ctx.font = '8px serif';
            ctx.fillText('성소의 수호자', W / 2, bot + 22);

        } else {
            // Robe
            const bg = ctx.createRadialGradient(W / 2, H * 0.3, 0, W / 2, H * 0.3, W);
            bg.addColorStop(0, '#0e0a04'); bg.addColorStop(1, '#060402');
            ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = 'rgba(204,255,0,0.4)'; ctx.font = '9px serif'; ctx.textAlign = 'center';
            ctx.fillText('니닉 카드', W / 2, 22);
            // Robe body
            ctx.fillStyle = '#1a1208';
            ctx.beginPath(); ctx.moveTo(W / 2, 34);
            ctx.bezierCurveTo(W / 2 - 28, 44, W / 2 - 52, 78, W / 2 - 56, H - 20);
            ctx.lineTo(W / 2 + 56, H - 20);
            ctx.bezierCurveTo(W / 2 + 52, 78, W / 2 + 28, 44, W / 2, 34); ctx.fill();
            ctx.strokeStyle = 'rgba(204,255,0,0.2)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(W / 2, 34);
            ctx.bezierCurveTo(W / 2 - 28, 44, W / 2 - 52, 78, W / 2 - 56, H - 20); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(W / 2, 34);
            ctx.bezierCurveTo(W / 2 + 28, 44, W / 2 + 52, 78, W / 2 + 56, H - 20); ctx.stroke();
            // Hood
            ctx.fillStyle = '#221a0a';
            ctx.beginPath(); ctx.arc(W / 2, 40, 24, Math.PI, 0, true); ctx.fill();
            ctx.fillStyle = '#0a0703';
            ctx.beginPath(); ctx.arc(W / 2, 36, 15, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = 'rgba(204,255,0,0.3)'; ctx.lineWidth = 0.8;
            ctx.beginPath(); ctx.arc(W / 2, 36, 15, 0, Math.PI * 2); ctx.stroke();
            // Mandala on chest
            const ms = 80, mx = (W - ms) / 2, my = 76;
            ctx.save(); ctx.shadowBlur = 18; ctx.shadowColor = 'rgba(204,255,0,0.5)';
            stampMandala(ctx, mx, my, ms);
            ctx.restore();
            ctx.fillStyle = 'rgba(204,255,0,0.5)'; ctx.font = '8px serif'; ctx.textAlign = 'center';
            ctx.fillText('공명의 수호자', W / 2, H - 14);
        }
    }, [cardStyle, level]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => { if (cardOpen) renderCard(); }, [cardOpen, cardStyle, renderCard]);

    // ── Gallery render ────────────────────────────────
    useEffect(() => {
        if (!galleryOpen) return;
        // small delay so the canvases are mounted
        const t = setTimeout(() => {
            for (let s = 1; s <= TOTAL_STAGES; s++) {
                const cv = galleryRefs.current[s - 1];
                if (!cv) continue;
                const raw = localStorage.getItem(doneKey(s)) ?? localStorage.getItem(draftKey(s));
                if (!raw) { const ctx2 = cv.getContext('2d'); ctx2?.clearRect(0, 0, CS, CS); continue; }
                try {
                    const rings = JSON.parse(raw) as RingSettings[];
                    const ctx2 = cv.getContext('2d')!;
                    ctx2.clearRect(0, 0, CS, CS);
                    const cx2 = CS / 2, cy2 = CS / 2;
                    ctx2.save();
                    ctx2.beginPath(); ctx2.arc(cx2, cy2, CS / 2 - 1, 0, Math.PI * 2); ctx2.clip();
                    rings.forEach(ring => drawRingOnCtx(ctx2, cx2, cy2, ring, 1));
                    ctx2.restore();
                } catch { /* ignore */ }
            }
        }, 60);
        return () => clearTimeout(t);
    }, [galleryOpen, gatewayId]); // eslint-disable-line react-hooks/exhaustive-deps



    const SHAPES  = [['none','none'],['rabbit','🐇 rabbit'],['fox','🦊 fox'],['ram','🐑 ram'],['rooster','🐓 rooster']];

    // ================================================================
    return (
        <>
        {/* ── Mandala UI ─────────────────────────────────── */}
        <div className="flex flex-col w-full h-full">
            <GlobalSliderStyle />

        {/* ── Fixed top: canvas + stage dots + buttons ── */}
            <div className="flex-none flex flex-col items-center gap-3 px-1 pt-1 pb-2">

                {/* ── Canvas — centered ── */}
                <div className="relative flex-none">
                    <div className="relative rounded-full bg-[#060200] overflow-hidden cursor-crosshair"
                        style={{ width: 256, height: 256, transform: 'translateY(-3px)' }}>
                        <AnimatePresence>
                            {ringCount === 0 && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <span className="text-[9px] tracking-[0.3em] text-white/50 uppercase text-center leading-relaxed">click to<br />add ring</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <canvas ref={canvasRef} width={CS} height={CS}
                            onClick={handleClick}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            className="w-full h-full" />
                    </div>
                </div>

                {/* ── Single toolbar row: [⊞] [Undo] [지우기] [임시저장] [카드완성] ── */}
                <div className="flex items-center w-full gap-1">

                    {/* gallery */}
                    <button onClick={() => setGalleryOpen(true)}
                        title="resonance gallery"
                        className="flex-none flex items-center justify-center w-8 h-[24px] rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white/85 transition-colors">
                        ⊞
                    </button>

                    <div className="flex-1" />

                    {/* undo */}
                    <button onClick={handleUndo}
                        className="flex-none flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white/85 text-[9px] transition-colors h-[24px]">
                        <Undo2 size={10} /> undo
                    </button>

                    {/* clear */}
                    <button onClick={handleClear}
                        className="flex-none flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg bg-white/5 border border-white/10 text-red-400/65 hover:text-red-400 text-[9px] transition-colors h-[24px]">
                        <RefreshCcw size={10} /> clear
                    </button>

                    {/* save draft */}
                    <button onClick={() => { if (ringCount > 0) saveDraft(); }}
                        className={`flex-none flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg border text-[9px] transition-colors h-[24px]
                            ${ringCount > 0 ? 'bg-white/5 border-white/10 text-white/65 hover:text-white/85' : 'bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed'}`}>
                        💾 save draft
                    </button>

                    {/* complete card */}
                    <button onClick={() => ringCount > 0 && setCardOpen(true)}
                        className={`flex-none flex items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg border text-[9px] transition-colors h-[24px]
                            ${ringCount > 0 ? 'bg-lime-900/50 border-[#CCFF00]/40 text-[#CCFF00] hover:text-white' : 'bg-white/5 border-white/10 text-white/35 cursor-not-allowed'}`}>
                        <Sparkles size={10} /> complete card
                    </button>

                </div>

            </div>{/* end fixed top */}

            {/* ── Scrollable controls ── */}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            <div className="flex flex-col items-center gap-2.5 w-full px-1 pb-0.5">

                {/* ── Color Picker ── */}
                <section className="w-full bg-white/[0.04] rounded-xl border border-white/10 p-3">
                    {/* SB gradient canvas */}
                    <canvas ref={sbCanvasRef} width={240} height={96}
                        className="w-full rounded-lg cursor-crosshair border border-white/10 mb-2"
                        onMouseDown={e => { sbDragging.current = true; pickSB(e); }}
                        onMouseMove={e => { if (sbDragging.current) pickSB(e); }}
                        onMouseUp={() => { sbDragging.current = false; }}
                        onMouseLeave={() => { sbDragging.current = false; }}
                        onTouchStart={e => { e.stopPropagation(); pickSB(e); }}
                        onTouchMove={e => { e.stopPropagation(); pickSB(e); }} />
                    {/* Hue */}
                    <div className="relative h-3 rounded-full mb-3"
                        style={{ background: 'linear-gradient(90deg,#f00 0%,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00 100%)' }}>
                        <input type="range" min={0} max={359} value={ctrl.pickerH}
                            onChange={e => setC({ pickerH: +e.target.value })}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                            style={{ left: `calc(${(ctrl.pickerH / 359) * 100}% - 8px)`, background: hsvToHex(ctrl.pickerH, 1, 1) }} />
                    </div>
                    {/* Current color preview */}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full border border-white/20 shrink-0"
                            style={{ background: curColor, boxShadow: `0 0 8px ${curColor}80` }} />
                        <span className="text-[9px] text-white/55 font-mono">{curColor}</span>
                    </div>
                    {/* All used colors palette */}
                    {recentColors.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-white/5">
                            {recentColors.map((c, i) => (
                                <button key={i} title={c} onClick={() => {
                                    const r2 = parseInt(c.slice(1,3),16)/255, g2 = parseInt(c.slice(3,5),16)/255, b2 = parseInt(c.slice(5,7),16)/255;
                                    const mx = Math.max(r2,g2,b2), mn = Math.min(r2,g2,b2), dv = mx-mn;
                                    let h = 0;
                                    if (dv) { if(mx===r2)h=((g2-b2)/dv)%6; else if(mx===g2)h=(b2-r2)/dv+2; else h=(r2-g2)/dv+4; h=Math.round(h*60); if(h<0)h+=360; }
                                    setC({ pickerH: h, pickerS: mx ? dv/mx : 0, pickerV: mx });
                                }} className="w-4 h-4 rounded-full border border-white/20 hover:scale-110 transition-transform shrink-0"
                                style={{ background: c, boxShadow: curColor === c ? `0 0 6px ${c}` : 'none',
                                    outline: curColor === c ? `1.5px solid ${c}` : 'none', outlineOffset: '1px' }} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Wave ── */}
                <section className="w-full bg-white/[0.04] rounded-xl border border-white/10 p-3">
                    <div className="flex flex-col gap-2">
                        <Ctrl label="amplitude" value={ctrl.amplitude} min={0} max={22} onChange={v => setC({ amplitude: v })} />
                        <Ctrl label="frequency" value={ctrl.freq}      min={2} max={20} onChange={v => setC({ freq: v })} />
                    </div>
                </section>

                {/* ── Break ── */}
                <section className="w-full bg-white/[0.04] rounded-xl border border-white/10 p-3">
                    <div className="flex flex-col gap-2">
                        <Ctrl label="breaks"      value={ctrl.bps} min={0} max={3}  onChange={v => setC({ bps: v })} />
                        <Ctrl label="break width" value={ctrl.bw}  min={0} max={70} onChange={v => setC({ bw: v })} />
                    </div>
                </section>

                {/* ── Symmetry + Line ── */}
                <section className="w-full bg-white/[0.04] rounded-xl border border-white/10 p-3">
                    <div className="flex flex-col gap-2">
                        <Ctrl label="symmetry"   value={ctrl.symmetry}  min={2} max={16} onChange={v => setC({ symmetry: v })} />
                        <Ctrl label="line width" value={ctrl.lineWidth} min={1} max={6}  onChange={v => setC({ lineWidth: v })} />
                    </div>
                </section>

                {/* ── Shape ── */}
                <section className="w-full bg-white/[0.04] rounded-xl border border-white/10 p-3">
                    <div className="flex flex-wrap gap-1.5">
                        {SHAPES.map(([id, label]) => (
                            <button key={id} onClick={() => setC({ shape: id })}
                                className={`px-2.5 py-1 rounded-lg text-[10px] border transition-all ${ctrl.shape === id ? 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/50' : 'bg-transparent text-white/60 border-white/15 hover:border-white/40'}`}>
                                {label}
                            </button>
                        ))}
                    </div>
                </section>

                {/* ── Cymatics ── */}
                <section className="w-full bg-white/[0.04] rounded-xl border border-white/10 p-3">
                    <div className="flex flex-col gap-2">
                        <Ctrl label="distortion" value={Math.round(ctrl.cymIntensity * 100)} min={0} max={100} onChange={v => setC({ cymIntensity: v / 100 })} />
                        <Ctrl label="node m"     value={ctrl.cymM} min={1} max={9} onChange={v => setC({ cymM: v })} />
                        <Ctrl label="node n"     value={ctrl.cymN} min={1} max={9} onChange={v => setC({ cymN: v })} />
                    </div>
                    <button onClick={() => setC({ cymPreviewOn: !ctrl.cymPreviewOn })}
                        className={`mt-2 w-full py-1.5 rounded-lg text-[9px] border uppercase tracking-widest transition-all ${ctrl.cymPreviewOn ? 'bg-[#CCFF00]/15 text-[#CCFF00] border-[#CCFF00]/40' : 'bg-transparent text-white/55 border-white/15 hover:border-white/35'}`}>
                        👁 apply kinetic distortion {ctrl.cymPreviewOn ? 'ON' : 'OFF'}
                    </button>
                </section>

            </div>
            </div>{/* end scrollable outer */}

        </div>{/* end flex col */}

        {/* ── Gallery Overlay ────────────────────────────── */}
        <AnimatePresence>
            {galleryOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm overflow-hidden">
                    {/* Gallery header */}
                    <div className="flex-none flex items-center justify-between px-4 py-3 border-b border-white/10">
                        <span className="text-[10px] text-[#CCFF00]/70 tracking-widest uppercase font-bold">resonance gallery</span>
                        <button onClick={() => setGalleryOpen(false)}
                            className="text-white/60 hover:text-white text-[14px] transition-colors">✕</button>
                    </div>
                    {/* Gallery grid */}
                    <div className="flex-1 overflow-y-auto p-3" style={{ scrollbarWidth: 'none' }}>
                        <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: TOTAL_STAGES }, (_, i) => i + 1).map(s => {
                                const hasDone     = !!localStorage.getItem(doneKey(s));
                                const hasDraft    = !!localStorage.getItem(draftKey(s));
                                const hasSaved    = hasDone || hasDraft;
                                const isCurrent   = s === viewingStage;
                                return (
                                    <div key={s} className={`flex flex-col items-center gap-1.5 p-2 rounded-xl border transition-all
                                        ${hasDone   ? 'border-[#CCFF00]/20 bg-white/[0.03]' :
                                          isCurrent ? 'border-white/20 bg-white/[0.05]' :
                                                      'border-white/5 bg-transparent'}`}>
                                        <div className="relative rounded-full overflow-hidden bg-[#060200] cursor-pointer"
                                            onClick={() => { setGalleryOpen(false); doNavigate(s); }}
                                            style={{ width: 110, height: 110 }}>
                                            <canvas
                                                ref={el => { galleryRefs.current[s - 1] = el; }}
                                                width={CS} height={CS}
                                                className="w-full h-full"
                                                style={{ opacity: hasSaved ? 1 : 0.3 }} />
                                            {!hasSaved && (
                                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <span className="text-white/50 text-[9px] tracking-widest">
                                                        empty
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className={`text-[9px] font-mono tracking-wider
                                                ${hasDone ? 'text-[#CCFF00]/75' : 'text-white/55'}`}>
                                                Stage {s}
                                            </span>
                                            {hasDone  && <span className="text-[#CCFF00]/70 text-[9px]">✓</span>}
                                            {hasDraft && !hasDone && <span className="text-white/55 text-[9px]">draft</span>}
                                        </div>
                                        <button onClick={() => { setGalleryOpen(false); doNavigate(s); }}
                                            className="text-[9px] text-white/60 hover:text-white/85 transition-colors">
                                            {hasDone ? 'redraw' : 'draw →'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ── Nav Warning Popup ──────────────────────────── */}
        <AnimatePresence>
            {navWarnOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/85 backdrop-blur-sm px-6 text-center">
                    <p className="text-white/80 text-[11px] leading-relaxed">
                        save draft before leaving
                    </p>
                    <p className="text-white/65 text-[10px] leading-relaxed">
                        unsaved changes will be lost.
                    </p>
                    <div className="flex gap-2 mt-1">
                        <button onClick={() => { setNavWarnOpen(false); setPendingStage(null); }}
                            className="px-4 py-2 rounded-lg border border-white/25 text-white/65 hover:text-white/85 text-[10px] transition-colors">
                            cancel
                        </button>
                        <button onClick={() => {
                            saveDraft();
                            setNavWarnOpen(false);
                            if (pendingStage !== null) { doNavigate(pendingStage); setPendingStage(null); }
                        }}
                            className="px-4 py-2 rounded-lg bg-white/10 border border-white/25 text-white/80 hover:text-white text-[10px] transition-colors">
                            save draft & leave
                        </button>
                        <button onClick={() => {
                            setNavWarnOpen(false);
                            if (pendingStage !== null) { doNavigate(pendingStage); setPendingStage(null); }
                        }}
                            className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400/70 hover:text-red-400 text-[10px] transition-colors">
                            leave without saving
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* ── Card Modal ─────────────────────────────────── */}
        <AnimatePresence>
            {cardOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80 backdrop-blur-sm"
                    onClick={e => { if (e.target === e.currentTarget) setCardOpen(false); }}>
                    {/* Style buttons */}
                    <div className="flex gap-2">
                        {(['tarot','temple','robe'] as const).map((s, i) => (
                            <button key={s} onClick={() => setCardStyle(s)}
                                className={`px-3 py-1.5 rounded-lg text-[9px] border transition-all ${cardStyle === s ? 'bg-[#CCFF00]/20 text-[#CCFF00] border-[#CCFF00]/50' : 'bg-white/5 text-white/40 border-white/10'}`}>
                                {['🃏 tarot card','🏛 temple mural','👘 robe pattern'][i]}
                            </button>
                        ))}
                    </div>
                    <canvas ref={cardCanvasRef} width={200} height={330}
                        className="rounded-xl shadow-[0_0_60px_rgba(204,255,0,0.3)]" />
                    <div className="flex gap-2">
                        <button onClick={() => { setCardOpen(false); setConfirmOpen(false); }}
                            className="px-6 py-2 rounded-lg border border-white/25 text-white/65 hover:text-white/85 text-[10px] transition-colors">
                            close
                        </button>
                        {ringCount > 0 && (
                            <button onClick={() => setConfirmOpen(true)}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-lime-900 to-lime-700 border border-[#CCFF00]/50 text-[#CCFF00] hover:text-white text-[10px] font-bold tracking-widest transition-colors shadow-[0_0_16px_rgba(204,255,0,0.3)]">
                                ✦ finalize resonance
                            </button>
                        )}
                    </div>

                    {/* ── 최종 확인 오버레이 ── */}
                    <AnimatePresence>
                        {confirmOpen && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 bg-black/90 rounded-xl px-6 text-center">
                                <p className="text-[#CCFF00] text-[11px] font-bold tracking-wider leading-relaxed">
                                    once confirmed,<br />this cannot be edited.
                                </p>
                                <p className="text-white/65 text-[10px] leading-relaxed">
                                    this card will be used<br />during mainstream progress.
                                </p>
                                <div className="flex gap-2 mt-1">
                                    <button onClick={() => setConfirmOpen(false)}
                                        className="px-5 py-2 rounded-lg border border-white/25 text-white/65 hover:text-white/85 text-[10px] transition-colors">
                                        cancel
                                    </button>
                                    <button onClick={() => {
                                        setConfirmOpen(false);
                                        setCardOpen(false);
                                        saveCompleted(viewingStage);
                                        clearDraft(viewingStage);
                                        // Update parent level only if this is a fresh completion of the current highest level
                                        if (viewingStage === level && level <= TOTAL_STAGES) { onLevelUp(); }
                                        setGalleryOpen(true);
                                    }}
                                        className="px-5 py-2 rounded-lg bg-[#CCFF00] text-black text-[10px] font-bold tracking-widest transition-colors hover:bg-[#ddff33]">
                                        confirm
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
};
