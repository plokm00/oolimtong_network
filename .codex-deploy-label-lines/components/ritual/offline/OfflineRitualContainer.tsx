import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { TapdoriRitual } from '../online/TapdoriRitual';
import { NFCRitual } from '../online/NFCRitual';
import { OfflineRecitationRitual } from './OfflineRecitationRitual';
import { TapdoriLogo, NFCLogo, OfflineRecitationLogo } from '../RitualLogos';
import { GatewayLocation } from '@/lib/gateway-data';
import { calculateDistance } from '@/lib/gps-utils';

interface OfflineRitualContainerProps {
    location: GatewayLocation;
    onComplete: () => void;
    onBack: () => void;
}

type RitualKey = 'tapdori' | 'nfc' | 'recitation';
type ActiveRitual = 'none' | RitualKey;

const RITUAL_META: {
    key: RitualKey;
    label: string;
    subLabel: string;
    doneSubLabel: string;
    iconIdle: React.ReactNode;
    colorIdle: string;
}[] = [
    {
        key: 'tapdori',
        label: 'Tapdori',
        subLabel: 'on-site body ritual',
        doneSubLabel: 'on-site ritual complete',
        iconIdle: <TapdoriLogo className="w-6 h-6" />,
        colorIdle: 'bg-amber-500/20 text-amber-400 group-hover:text-amber-200',
    },
    {
        key: 'nfc',
        label: 'NFC Treasure Hunt',
        subLabel: 'find hidden fragments',
        doneSubLabel: 'all fragments collected',
        iconIdle: <NFCLogo className="w-6 h-6" />,
        colorIdle: 'bg-emerald-500/20 text-emerald-400 group-hover:text-emerald-200',
    },
    {
        key: 'recitation',
        label: 'Voice Recitation',
        subLabel: 'audio resonance',
        doneSubLabel: 'Voice Connected',
        iconIdle: <OfflineRecitationLogo className="w-6 h-6" />,
        colorIdle: 'bg-blue-500/20 text-blue-400 group-hover:text-blue-200',
    },
];

// Score: 3 games → 34 + 33 + 33 = 100
const GAME_SCORES: Record<RitualKey, number> = {
    tapdori:    34,
    nfc:        33,
    recitation: 33,
};

export const OfflineRitualContainer: React.FC<OfflineRitualContainerProps> = ({
    location,
    onComplete,
    onBack,
}) => {
    const [activeRitual, setActiveRitual] = useState<ActiveRitual>('none');

    // Mobile detection (client-side only)
    const [isMobile, setIsMobile] = useState(true); // default true to avoid flash
    useEffect(() => {
        const mobile =
            navigator.maxTouchPoints > 0 ||
            /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        setIsMobile(mobile);
    }, []);

    // Completion flags
    const [isDone, setIsDone] = useState<Record<RitualKey, boolean>>({
        tapdori: false, nfc: false, recitation: false,
    });

    // Level state (for recitation)
    const [recitationLevel, setRecitationLevel] = useState(1);

    // Tapdori level (3 stages)
    const [tapdoriLevel, setTapdoriLevel] = useState(1);

    // GPS — subtle, non-blocking
    const [gpsReady, setGpsReady]     = useState(false);
    const [gpsError, setGpsError]     = useState<string | null>(null);
    const [distanceM, setDistanceM]   = useState<number | null>(null);
    const gpsWatchRef = useRef<number | null>(null);

    const score = Object.entries(isDone)
        .filter(([, v]) => v)
        .reduce((sum, [k]) => sum + (GAME_SCORES[k as RitualKey] ?? 0), 0);

    // ── Load persisted state ─────────────────────────
    useEffect(() => {
        const flagKey = `ninnik_sync_flags_${location.id}`;
        const stored  = localStorage.getItem(flagKey);
        if (stored) {
            const { tapdori, nfc, recitation } = JSON.parse(stored);
            setIsDone({ tapdori: !!tapdori, nfc: !!nfc, recitation: !!recitation });
        }

        const levelKey = `ninnik_offline_levels_${location.id}`;
        const levels   = localStorage.getItem(levelKey);
        if (levels) {
            const { recitation, tapdori } = JSON.parse(levels);
            if (recitation) setRecitationLevel(recitation);
            if (tapdori)    setTapdoriLevel(Math.min(3, tapdori));
        }
    }, [location.id]);

    // ── GPS (non-blocking) ───────────────────────────
    useEffect(() => {
        if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
        gpsWatchRef.current = navigator.geolocation.watchPosition(
            ({ coords }) => {
                if (coords.accuracy > 80) return;
                // ✅ 올바른 GPS 좌표 사용 (location.lat/lng, not location.x/y)
                const d = calculateDistance(
                    coords.latitude, coords.longitude,
                    location.lat,   location.lng
                );
                setDistanceM(d);
                setGpsReady(true);
                setGpsError(null);
            },
            (err) => setGpsError(err.code === 1 ? 'GPS permission required' : 'no GPS signal'),
            { enableHighAccuracy: true, timeout: 30000, maximumAge: 3000 }
        );
        return () => {
            if (gpsWatchRef.current !== null) navigator.geolocation.clearWatch(gpsWatchRef.current);
        };
    }, [location.lat, location.lng]);

    const isNear = distanceM !== null && distanceM <= 200;

    // ── Persist flags ────────────────────────────────
    const persistFlags = (next: Record<RitualKey, boolean>) =>
        localStorage.setItem(`ninnik_sync_flags_${location.id}`, JSON.stringify(next));
    const persistLevels = (rec: number, tap: number) =>
        localStorage.setItem(`ninnik_offline_levels_${location.id}`, JSON.stringify({ recitation: rec, tapdori: tap }));

    // ── Complete handler ─────────────────────────────
    const handleRitualComplete = (_score?: number) => {
        const next = { ...isDone, [activeRitual]: true } as Record<RitualKey, boolean>;
        setIsDone(next);
        persistFlags(next);

        const newScore = Object.entries(next)
            .filter(([, v]) => v)
            .reduce((sum, [k]) => sum + (GAME_SCORES[k as RitualKey] ?? 0), 0);

        localStorage.setItem(`ninnik_sync_${location.id}`, String(newScore));
        setActiveRitual('none');

        if (newScore >= 100) setTimeout(() => onComplete(), 800);
    };

    // ── Level up handlers ────────────────────────────
    const handleRecitationLevelUp = () =>
        setRecitationLevel(prev => { const n = Math.min(30, prev + 1); persistLevels(n, tapdoriLevel); return n; });

    const handleTapdoriLevelUp = () =>
        setTapdoriLevel(prev => { const n = Math.min(3, prev + 1); persistLevels(recitationLevel, n); return n; });

    // ── GPS notice text ──────────────────────────────
    const gpsNotice = !gpsReady
        ? (gpsError ?? 'locating GPS…')
        : isNear
        ? `gateway ${Math.round(distanceM!)}m — ritual active`
        : `gateway ${Math.round(distanceM!)}m — must be within 200m`;

    // ── Render ───────────────────────────────────────
    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex-none border-b border-white/10 pt-0.5 pb-2 px-3">
                <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[8px] font-light text-white/50 tracking-[0.15em] uppercase text-center leading-relaxed">
                        Resonate with gateway <span className="font-semibold text-white/80">{location.name}</span>.
                    </p>
                    <span className="text-[8px] font-bold text-[#CCFF00]/70 tracking-widest uppercase">
                        {score}% done.
                    </span>
                </div>
            </div>

            {/* GPS notice — subtle, never blocking */}
            {activeRitual === 'none' && (
                <div className="flex-none px-4 pt-2 pb-1.5 flex flex-col gap-0.5">
                    <p className="text-[8.5px] text-white/30 font-mono leading-relaxed">
                        these rituals must be performed within <span className="text-white/50">200m of the gateway</span> to be recorded.
                    </p>
                    <div className="flex items-center gap-1 text-white/18">
                        <MapPin size={8} />
                        <span className="text-[7.5px] font-mono">{gpsNotice}</span>
                        {!gpsReady && !gpsError && <Loader2 size={7} className="animate-spin ml-0.5" />}
                    </div>
                </div>
            )}

            {/* Desktop notice — non-blocking, shown only on non-touch devices */}
            {!isMobile && activeRitual === 'none' && (
                <div className="mx-3 mb-1 flex items-start gap-2 bg-amber-500/8 border border-amber-500/20 rounded-lg px-3 py-2">
                    <span className="text-amber-400/70 text-[11px] mt-0.5 shrink-0">📱</span>
                    <p className="text-[8.5px] text-white/35 leading-relaxed">
                        these rituals must be performed <span className="text-white/55">on-site with a smartphone</span>.
                        GPS & NFC features only work on mobile.
                    </p>
                </div>
            )}

            {/* Completion banner */}
            {score >= 100 && activeRitual === 'none' && (
                <div className="bg-[#CCFF00]/5 border-b border-[#CCFF00]/20 px-3 py-1.5 text-center">
                    <p className="text-[#CCFF00] text-[9px] font-mono tracking-wider">
                        SYNCHRONIZATION COMPLETE.
                    </p>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 relative overflow-hidden">
                <AnimatePresence mode="wait">
                    {activeRitual === 'none' ? (
                        <motion.div
                            key="menu"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5"
                        >
                            {RITUAL_META.map(r => {
                                const done = isDone[r.key];
                                return (
                                    <button
                                        key={r.key}
                                        onClick={() => setActiveRitual(r.key)}
                                        className={`w-full max-w-[260px] p-3.5 bg-white/5 hover:bg-white/10 border border-white/10 ${
                                            !done && 'hover:border-[#CCFF00]/40'
                                        } rounded-lg flex items-center gap-3.5 transition-all group`}
                                    >
                                        <div className={`p-2.5 rounded-full ${
                                            done
                                                ? 'bg-green-500/20 text-green-400'
                                                : r.colorIdle
                                        }`}>
                                            {done ? <CheckCircle2 size={22} /> : r.iconIdle}
                                        </div>
                                        <div className="text-left">
                                            <div className="text-white font-bold text-[12px] uppercase tracking-wide">
                                                {r.label}
                                            </div>
                                            <div className="text-white/40 text-[9px] mt-0.5">
                                                {done ? r.doneSubLabel : r.subLabel}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}

                            {score < 100 && (
                                <p className="text-white/18 text-[8px] font-mono text-center max-w-[200px] tracking-wider mt-1">
                                    complete all 3 rituals to activate the gateway
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key={activeRitual}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute inset-0"
                        >
                            {activeRitual === 'tapdori' && (
                                <TapdoriRitual
                                    onComplete={handleRitualComplete}
                                    level={tapdoriLevel}
                                    onLevelUp={handleTapdoriLevelUp}
                                    gatewayId={location.id}
                                    gatewayLat={location.lat}
                                    gatewayLng={location.lng}
                                />
                            )}
                            {activeRitual === 'nfc' && (
                                <NFCRitual
                                    onComplete={handleRitualComplete}
                                    gatewayId={location.id}
                                />
                            )}
                            {activeRitual === 'recitation' && (
                                <OfflineRecitationRitual
                                    onComplete={handleRitualComplete}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
