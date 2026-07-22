'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowLeft, Loader2, MapPin, AlertTriangle } from 'lucide-react';
import { calculateDistance, calculateBearing } from '@/lib/gps-utils';

// ── Props ──────────────────────────────────────────────
interface TapdoriRitualProps {
    onComplete: (score: number) => void;
    level: number;
    onLevelUp: () => void;
    gatewayId: string;
    gatewayLat: number;
    gatewayLng: number;
}

type ActiveStage = 1 | 2 | 3 | null;

// ── Constants ──────────────────────────────────────────
const TOTAL_STAGES       = 3;
const PROXIMITY_RADIUS_M = 200;   // GPS 유효 범위
const CIRCLE_TARGET_DEG  = 720;   // 2 full circles
const CIRCLE_MIN_R_M     = 4;     // 너무 가까우면 노이즈로 무시
const CIRCLE_MAX_R_M     = 80;    // 너무 멀면 탑도리 아닌 것으로 판단
const TILT_THRESHOLD_DEG = 35;    // beta < 35° → 수평으로 기울인 것
const TILT_HOLD_SEC      = 5;
const KNOCK_THRESHOLD    = 18;    // m/s² 충격 임계값
const KNOCK_TARGET       = 5;
const KNOCK_DEBOUNCE_MS  = 600;

const STAGE_META = [
    {
        id: 1 as const,
        title: 'Tapdori',
        subtitle: 'GPS circle walk',
        icon: '⭕',
        desc: 'circle the gateway\n2 full laps in one direction',
        detail: 'walk slowly around the gateway\n(5–80m radius) twice in the same direction.',
        sensorLabel: 'rotation',
        color: 'text-amber-400',
        accent: '#F59E0B',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
    },
    {
        id: 2 as const,
        title: 'Peer Inside',
        subtitle: 'tilt detection',
        icon: '👁',
        desc: 'tilt your device horizontally\nto look inside the gateway',
        detail: 'hold your phone above the gateway opening\nwith the screen facing down for 5 seconds.',
        sensorLabel: 'hold time',
        color: 'text-cyan-400',
        accent: '#22D3EE',
        bg: 'bg-cyan-500/10',
        border: 'border-cyan-500/30',
    },
    {
        id: 3 as const,
        title: 'Knock',
        subtitle: 'impact detection',
        icon: '✊',
        desc: 'tap the gateway surface\n5 times with your hand',
        detail: 'press your device against the gateway body\nor tap the gateway 5 times.\nvibration is transmitted to the device.',
        sensorLabel: 'knocks',
        color: 'text-rose-400',
        accent: '#FB7185',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
    },
];

// ── Helper ─────────────────────────────────────────────
function normDelta(d: number) {
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    return d;
}

// ── Component ──────────────────────────────────────────
export const TapdoriRitual: React.FC<TapdoriRitualProps> = ({
    onComplete, level, onLevelUp, gatewayId, gatewayLat, gatewayLng,
}) => {
    // ── Storage ──────────────────────────────────────
    const doneKey  = useCallback((s: number) => `ninnik_tapdori_done_${gatewayId}_s${s}`, [gatewayId]);
    const isDone   = useCallback((s: number) => !!localStorage.getItem(doneKey(s)), [doneKey]);
    const markDone = useCallback((s: number) => localStorage.setItem(doneKey(s), '1'), [doneKey]);

    // ── UI state ─────────────────────────────────────
    const [activeStage, setActiveStage] = useState<ActiveStage>(null);

    // ── GPS ──────────────────────────────────────────
    const [gpsReady, setGpsReady]   = useState(false);
    const [gpsError, setGpsError]   = useState<string | null>(null);
    const [distanceM, setDistanceM] = useState<number | null>(null);
    const userPosRef = useRef<{ lat: number; lng: number } | null>(null);
    const gpsWatchRef = useRef<number | null>(null);

    // ── Stage 1: circling (use refs to avoid stale closures in GPS handler) ──
    const [circleAccum, setCircleAccum] = useState(0);
    const circleDirRef   = useRef<1 | -1 | 0>(0);   // direction confirmed
    const lastBearingRef = useRef<number | null>(null);
    const circleActiveRef = useRef(false);           // mirrors activeStage === 1

    // ── Stage 2: tilt ────────────────────────────────
    const [tiltHeld, setTiltHeld] = useState(0);
    const tiltStartRef = useRef<number | null>(null);
    const [sensorErr, setSensorErr] = useState<string | null>(null);

    // ── Stage 3: knock ───────────────────────────────
    const [knockCount, setKnockCount] = useState(0);
    const lastKnockRef = useRef<number>(0);

    // ── Cleanup refs ─────────────────────────────────
    const sensorCleanupRef = useRef<(() => void) | null>(null);

    // ── handleStageComplete (stable ref so sensors can call it) ──────────
    const onCompleteRef  = useRef(onComplete);
    const onLevelUpRef   = useRef(onLevelUp);
    const isDoneRef      = useRef(isDone);
    const markDoneRef    = useRef(markDone);
    useEffect(() => { onCompleteRef.current  = onComplete;  }, [onComplete]);
    useEffect(() => { onLevelUpRef.current   = onLevelUp;   }, [onLevelUp]);
    useEffect(() => { isDoneRef.current      = isDone;      }, [isDone]);
    useEffect(() => { markDoneRef.current    = markDone;    }, [markDone]);

    const handleStageComplete = useCallback((s: number) => {
        if (isDoneRef.current(s)) return;
        markDoneRef.current(s);
        if (sensorCleanupRef.current) { sensorCleanupRef.current(); sensorCleanupRef.current = null; }
        circleActiveRef.current = false;
        setActiveStage(null);
        const totalDone = [1, 2, 3].filter(i => i === s || isDoneRef.current(i)).length;
        if (totalDone >= TOTAL_STAGES) {
            onCompleteRef.current(100);
        } else {
            onLevelUpRef.current();
        }
    }, []);

    // ── GPS watch (always-on) ─────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) {
            setGpsError('GPS not supported on this device');
            return;
        }
        gpsWatchRef.current = navigator.geolocation.watchPosition(
            ({ coords }) => {
                if (coords.accuracy > 50) return;
                const { latitude: lat, longitude: lng } = coords;
                userPosRef.current = { lat, lng };
                setGpsReady(true);
                setGpsError(null);
                const dist = calculateDistance(lat, lng, gatewayLat, gatewayLng);
                setDistanceM(dist);

                // ── Stage 1 GPS logic ──────────────────
                if (!circleActiveRef.current) return;
                if (dist < CIRCLE_MIN_R_M || dist > CIRCLE_MAX_R_M) return;

                const bearing = calculateBearing(gatewayLat, gatewayLng, lat, lng);
                if (lastBearingRef.current === null) { lastBearingRef.current = bearing; return; }

                const delta = normDelta(bearing - lastBearingRef.current);
                lastBearingRef.current = bearing;
                if (Math.abs(delta) < 2) return; // GPS noise

                // Direction detection / reversal
                if (circleDirRef.current === 0) {
                    circleDirRef.current = delta > 0 ? 1 : -1;
                } else if (Math.sign(delta) !== circleDirRef.current && Math.abs(delta) > 20) {
                    circleDirRef.current = delta > 0 ? 1 : -1;
                    setCircleAccum(p => Math.max(0, p - 90));
                    return;
                }

                if (Math.sign(delta) === circleDirRef.current) {
                    setCircleAccum(prev => {
                        const next = Math.min(CIRCLE_TARGET_DEG, prev + Math.abs(delta));
                        if (next >= CIRCLE_TARGET_DEG && prev < CIRCLE_TARGET_DEG) {
                            setTimeout(() => handleStageComplete(1), 300);
                        }
                        return next;
                    });
                }
            },
            (err) => setGpsError(err.code === 1 ? 'GPS permission required' : 'no GPS signal'),
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 2000 }
        );
        return () => {
            if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
        };
    }, [gatewayLat, gatewayLng, handleStageComplete]);

    // ── Stage 2: tilt sensor ─────────────────────────
    const startTiltSensor = useCallback(async () => {
        setSensorErr(null);
        try {
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                const p = await (DeviceOrientationEvent as any).requestPermission();
                if (p !== 'granted') { setSensorErr('tilt sensor permission required'); return; }
            }
        } catch { setSensorErr('tilt sensor unavailable'); return; }

        const handler = (e: DeviceOrientationEvent) => {
            if (e.beta === null) return;
            const isFlat = Math.abs(e.beta) < TILT_THRESHOLD_DEG;
            if (isFlat) {
                if (tiltStartRef.current === null) tiltStartRef.current = Date.now();
                const held = (Date.now() - tiltStartRef.current) / 1000;
                setTiltHeld(Math.min(held, TILT_HOLD_SEC));
                if (held >= TILT_HOLD_SEC) handleStageComplete(2);
            } else {
                tiltStartRef.current = null;
                setTiltHeld(0);
            }
        };
        window.addEventListener('deviceorientation', handler);
        sensorCleanupRef.current = () => window.removeEventListener('deviceorientation', handler);
    }, [handleStageComplete]);

    // ── Stage 3: knock sensor ─────────────────────────
    const startKnockSensor = useCallback(async () => {
        setSensorErr(null);
        try {
            if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
                const p = await (DeviceMotionEvent as any).requestPermission();
                if (p !== 'granted') { setSensorErr('motion sensor permission required'); return; }
            }
        } catch { setSensorErr('motion sensor unavailable'); return; }

        const handler = (e: DeviceMotionEvent) => {
            const acc = e.acceleration ?? e.accelerationIncludingGravity;
            if (!acc) return;
            const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
            const now = Date.now();
            if (mag >= KNOCK_THRESHOLD && now - lastKnockRef.current > KNOCK_DEBOUNCE_MS) {
                lastKnockRef.current = now;
                setKnockCount(prev => {
                    const next = Math.min(prev + 1, KNOCK_TARGET);
                    if (next >= KNOCK_TARGET) setTimeout(() => handleStageComplete(3), 400);
                    return next;
                });
            }
        };
        window.addEventListener('devicemotion', handler);
        sensorCleanupRef.current = () => window.removeEventListener('devicemotion', handler);
    }, [handleStageComplete]);

    // ── openStage ─────────────────────────────────────
    const openStage = useCallback((s: ActiveStage) => {
        if (sensorCleanupRef.current) { sensorCleanupRef.current(); sensorCleanupRef.current = null; }
        setActiveStage(s);
        if (s === null) { circleActiveRef.current = false; return; }
        setSensorErr(null);
        if (s === 1) {
            setCircleAccum(0);
            circleDirRef.current = 0;
            lastBearingRef.current = null;
            circleActiveRef.current = true;
        }
        if (s === 2) { setTiltHeld(0); tiltStartRef.current = null; startTiltSensor(); }
        if (s === 3) { setKnockCount(0); lastKnockRef.current = 0; startKnockSensor(); }
    }, [startTiltSensor, startKnockSensor]);

    // cleanup on unmount
    useEffect(() => () => {
        if (sensorCleanupRef.current) sensorCleanupRef.current();
    }, []);

    // ── Derived ───────────────────────────────────────
    const isWithinRange = distanceM !== null && distanceM <= PROXIMITY_RADIUS_M;

    // ── Overview ──────────────────────────────────────
    const renderOverview = () => (
        <div className="flex flex-col h-full">
            {/* Info notice — GPS proximity requirement */}
            <div className="px-4 pt-2.5 pb-2 flex flex-col gap-0.5">
                <p className="text-[9.5px] text-white/55 font-mono leading-relaxed">
                    this ritual must be performed within <span className="text-white/75">200m of the gateway</span> to be recorded.
                </p>
                {/* GPS status */}
                <div className="flex items-center gap-1 text-white/50">
                    <MapPin size={8} />
                    <span className="text-[9px] font-mono">
                        {!gpsReady
                            ? (gpsError ?? 'locating GPS…')
                            : isWithinRange
                            ? `position confirmed · ${Math.round(distanceM!)}m`
                            : `${Math.round(distanceM!)}m away — move closer to the gateway`}
                    </span>
                    {!gpsReady && !gpsError && <Loader2 size={7} className="animate-spin" />}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-2">
                <p className="text-[9px] text-white/55 font-mono text-center tracking-wider py-0.5 border-t border-white/5 pt-2">
                    on-site body ritual · {TOTAL_STAGES} stages
                </p>

                {STAGE_META.map((meta) => {
                    const done   = isDone(meta.id);
                    const active = meta.id === level && !done;
                    const locked = meta.id > level && !done;
                    return (
                        <button
                            key={meta.id}
                            disabled={locked || done}
                            onClick={() => { if (!locked && !done) openStage(meta.id); }}
                            className={`w-full p-3 rounded-lg border text-left transition-all flex items-center gap-3 ${
                                done   ? 'bg-green-500/10 border-green-500/30 opacity-60 cursor-default'
                                       : locked ? 'bg-white/3 border-white/5 opacity-35 cursor-default'
                                       : `${meta.bg} ${meta.border} hover:brightness-125 active:scale-[0.98] cursor-pointer`
                            }`}
                        >
                            <div className="text-2xl w-9 text-center shrink-0">{done ? '✅' : meta.icon}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`text-[11px] font-bold ${done ? 'text-green-400' : meta.color}`}>
                                        {meta.title}
                                    </span>
                                    {active && <span className="text-[8px] bg-white/15 text-white/65 px-1.5 py-0.5 rounded font-mono">현재 단계</span>}
                                    {locked && <span className="text-[8px] text-white/50 font-mono">잠김</span>}
                                </div>
                                <p className="text-[9px] text-white/65 whitespace-pre-line leading-relaxed mt-0.5">
                                    {meta.desc}
                                </p>
                            </div>
                            {done && <CheckCircle2 size={15} className="text-green-400 shrink-0" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    // ── Stage detail ──────────────────────────────────
    const renderStage = (s: 1 | 2 | 3) => {
        const meta = STAGE_META[s - 1];
        let progress = 0, label = '', detail = '';

        if (s === 1) {
            progress = circleAccum / CIRCLE_TARGET_DEG;
            label    = `${(circleAccum / 360).toFixed(1)} / 2.0 바퀴`;
            detail   = circleDirRef.current === 0 ? '걷기 시작하세요'
                     : circleDirRef.current === 1  ? '↻ 시계 방향으로 걷는 중'
                     : '↺ 반시계 방향으로 걷는 중';
        } else if (s === 2) {
            progress = tiltHeld / TILT_HOLD_SEC;
            label    = `${tiltHeld.toFixed(1)} / ${TILT_HOLD_SEC}초`;
            detail   = progress > 0 ? '잘 하고 있어요 — 유지하세요' : '기기를 수평으로 기울여주세요';
        } else {
            progress = knockCount / KNOCK_TARGET;
            label    = `${knockCount} / ${KNOCK_TARGET} 번`;
            detail   = knockCount === 0 ? '울림통을 두드려보세요' : `${KNOCK_TARGET - knockCount}번 더!`;
        }

        const C  = 2 * Math.PI * 44;
        const sd = C * Math.min(progress, 1);

        return (
            <div className="flex flex-col h-full">
                <button
                    onClick={() => openStage(null)}
                    className="flex items-center gap-1.5 px-3 py-2 text-white/55 hover:text-white/80 text-[10px] transition-colors border-b border-white/5 self-start"
                >
                    <ArrowLeft size={10} /> 목록으로
                </button>

                <div className="flex-1 flex flex-col items-center justify-center gap-5 px-5 py-4">
                    <div className="text-center">
                        <span className="text-3xl">{meta.icon}</span>
                        <h2 className={`text-sm font-bold mt-1 ${meta.color}`}>{meta.title}</h2>
                        <p className="text-[9px] text-white/60 whitespace-pre-line leading-relaxed mt-1">
                            {meta.detail}
                        </p>
                    </div>

                    {/* Circular progress ring */}
                    <div className="relative w-28 h-28">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                            <circle
                                cx="50" cy="50" r="44" fill="none"
                                stroke={meta.accent}
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeDasharray={`${sd} ${C}`}
                                className="transition-all duration-500"
                                style={{ filter: `drop-shadow(0 0 5px ${meta.accent}70)` }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className={`text-[10px] font-mono font-bold ${meta.color}`}>{label}</span>
                            <span className="text-[9px] text-white/60 mt-0.5">{meta.sensorLabel}</span>
                        </div>
                    </div>

                    <p className="text-[10px] text-white/65 font-mono">{detail}</p>

                    {/* Knock dots */}
                    {s === 3 && (
                        <div className="flex gap-2.5">
                            {Array.from({ length: KNOCK_TARGET }).map((_, i) => (
                                <motion.div
                                    key={i}
                                    animate={i < knockCount ? { scale: [1.4, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                    className={`w-3 h-3 rounded-full border transition-all ${
                                        i < knockCount ? 'bg-rose-400 border-rose-400' : 'border-white/40'
                                    }`}
                                />
                            ))}
                        </div>
                    )}

                    {/* Errors */}
                    {sensorErr && (
                        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/30 rounded px-3 py-2 text-[9px] text-rose-300">
                            <AlertTriangle size={10} className="text-rose-400 shrink-0" />
                            {sensorErr}
                        </div>
                    )}

                    {s === 1 && gpsReady && !isWithinRange && (
                        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded px-3 py-2 text-[9px] text-amber-300">
                            <AlertTriangle size={10} className="text-amber-400 shrink-0" />
                            울림통 200m 이내로 이동해야 기록됩니다
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // ── Render ────────────────────────────────────────
    return (
        <div className="w-full h-full flex flex-col overflow-hidden text-white">
            <AnimatePresence mode="wait">
                {activeStage === null ? (
                    <motion.div key="ov" initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} className="w-full h-full">
                        {renderOverview()}
                    </motion.div>
                ) : (
                    <motion.div key={`s${activeStage}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="w-full h-full">
                        {renderStage(activeStage)}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
