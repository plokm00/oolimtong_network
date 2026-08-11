import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { MandalaRitual } from './MandalaRitual';
import { OnlineRecitationRitual } from './OnlineRecitationRitual';
import { MandalaLogo, OnlineRecitationLogo } from '../RitualLogos';

interface OnlineRitualContainerProps {
    gatewayId: string;
    gatewayName: string;
    gatewayLat: number;
    gatewayLng: number;
    onComplete: () => void;
    onBack: () => void;
}

export const OnlineRitualContainer: React.FC<OnlineRitualContainerProps> = ({
    gatewayId,
    gatewayName,
    onComplete,
    onBack,
}) => {
    const [activeRitual, setActiveRitual]         = useState<'none' | 'mandala' | 'recitation'>('none');
    const [isMandalaDone, setIsMandalaDone]       = useState(false);
    const [isRecitationDone, setIsRecitationDone] = useState(false);
    const [mandalaLevel, setMandalaLevel]         = useState(1);
    const [recitationLevel, setRecitationLevel]   = useState(1);
    const [levelsLoaded, setLevelsLoaded]         = useState(false);

    const score = (isMandalaDone ? 50 : 0) + (isRecitationDone ? 50 : 0);

    useEffect(() => {
        const flagKey = `ninnik_participation_flags_${gatewayId}`;
        const stored  = localStorage.getItem(flagKey);
        if (stored) {
            const { mandala, recitation } = JSON.parse(stored);
            if (mandala)    setIsMandalaDone(true);
            if (recitation) setIsRecitationDone(true);
        }

        const levelKey     = `ninnik_online_levels_${gatewayId}`;
        const storedLevels = localStorage.getItem(levelKey);
        if (storedLevels) {
            const { mandala, recitation } = JSON.parse(storedLevels);
            if (mandala)    setMandalaLevel(Math.min(6, mandala));
            if (recitation) setRecitationLevel(recitation);
        }

        setLevelsLoaded(true);
    }, [gatewayId]);

    const persistFlags = (mandala: boolean, recitation: boolean) =>
        localStorage.setItem(
            `ninnik_participation_flags_${gatewayId}`,
            JSON.stringify({ mandala, recitation })
        );

    const persistLevels = (mandala: number, recitation: number) =>
        localStorage.setItem(
            `ninnik_online_levels_${gatewayId}`,
            JSON.stringify({ mandala, recitation })
        );

    const handleRitualComplete = () => {
        const newMandala    = activeRitual === 'mandala'    ? true : isMandalaDone;
        const newRecitation = activeRitual === 'recitation' ? true : isRecitationDone;
        setIsMandalaDone(newMandala);
        setIsRecitationDone(newRecitation);
        persistFlags(newMandala, newRecitation);

        const newScore = (newMandala ? 50 : 0) + (newRecitation ? 50 : 0);
        setActiveRitual('none');

        if (newScore >= 100) {
            localStorage.setItem(`ninnik_participation_${gatewayId}`, '100');
            setTimeout(() => onComplete(), 800);
        }
    };

    const handleMandalaLevelUp = () =>
        setMandalaLevel(prev => {
            const next = Math.min(6, prev + 1);
            persistLevels(next, recitationLevel);
            return next;
        });

    const handleRecitationLevelUp = () =>
        setRecitationLevel(prev => {
            const next = Math.min(30, prev + 1);
            persistLevels(mandalaLevel, next);
            return next;
        });

    const rituals = [
        {
            key: 'mandala' as const,
            label: 'Mandala Drawing',
            subLabel: isMandalaDone
                ? `Resonance Captured (Lv ${mandalaLevel}/6)`
                : `Visual resonance — Lv ${mandalaLevel}/6`,
            isDone: isMandalaDone,
            iconIdle: <MandalaLogo className="w-6 h-6" />,
            colorIdle: 'bg-purple-500/20 text-purple-400 group-hover:text-purple-200',
        },
        {
            key: 'recitation' as const,
            label: 'Voice Recitation',
            subLabel: isRecitationDone
                ? `Voice Connected (Lv ${recitationLevel}/30)`
                : `Audio resonance — Lv ${recitationLevel}/30`,
            isDone: isRecitationDone,
            iconIdle: <OnlineRecitationLogo className="w-6 h-6" />,
            colorIdle: 'bg-blue-500/20 text-blue-400 group-hover:text-blue-200',
        },
    ];

    return (
        <div className="w-full h-full flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex-none border-b border-white/10 pt-0.5 pb-2 px-3">
                <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[8px] font-light text-white/50 tracking-[0.15em] uppercase text-center leading-relaxed">
                        Practice rituals to open gateway{' '}
                        <span className="font-semibold text-white/80">{gatewayName}</span>.
                    </p>
                    <span className="text-[8px] font-bold text-[#CCFF00]/70 tracking-widest uppercase">
                        {score}% done.
                    </span>
                </div>
            </div>

            {/* Completion banner */}
            {score >= 100 && activeRitual === 'none' && (
                <div className="bg-[#CCFF00]/5 border-b border-[#CCFF00]/20 p-2 text-center">
                    <p className="text-[#CCFF00] text-[9px] font-mono tracking-wider">
                        CONTRIBUTION COMPLETE. NO ADDITIONAL RESONANCE WILL BE ACCUMULATED.
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
                            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
                        >
                            {rituals.map(r => (
                                <button
                                    key={r.key}
                                    onClick={() => setActiveRitual(r.key)}
                                    className={`w-full max-w-[260px] p-4 bg-white/5 hover:bg-white/10 border border-white/10 ${
                                        !r.isDone && 'hover:border-[#CCFF00]/50'
                                    } rounded-lg flex items-center gap-4 transition-all group`}
                                >
                                    <div className={`p-3 rounded-full ${
                                        r.isDone
                                            ? 'bg-green-500/20 text-green-400'
                                            : r.colorIdle
                                    }`}>
                                        {r.isDone ? <CheckCircle2 size={24} /> : r.iconIdle}
                                    </div>
                                    <div className="text-left">
                                        <div className="text-white font-bold text-sm uppercase tracking-wide">
                                            {r.label}
                                        </div>
                                        <div className="text-white/40 text-[10px] mt-0.5">
                                            {r.subLabel}
                                        </div>
                                    </div>
                                </button>
                            ))}

                            {score < 100 && (
                                <p className="text-white/20 text-[9px] font-mono text-center max-w-[200px] tracking-wider mt-1">
                                    complete both rituals to earn 1 contribution
                                </p>
                            )}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="game"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="absolute inset-0"
                        >
                            {activeRitual === 'mandala' && levelsLoaded && (
                                <MandalaRitual
                                    onComplete={handleRitualComplete}
                                    level={Math.min(mandalaLevel, 6)}
                                    onLevelUp={handleMandalaLevelUp}
                                    gatewayId={gatewayId}
                                />
                            )}
                            {activeRitual === 'recitation' && (
                                <OnlineRecitationRitual
                                    onComplete={handleRitualComplete}
                                    level={recitationLevel}
                                    onLevelUp={handleRecitationLevelUp}
                                />
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
