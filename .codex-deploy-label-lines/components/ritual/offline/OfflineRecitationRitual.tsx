import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { useAudioInput } from '@/hooks/sensors/useAudioInput';

interface RecitationRitualProps {
    onComplete: (score: number) => void;
}

const MANTRAS = [
    "From the silence, the echo rises.",
    "We walk the path of the unseen.",
    "Resonance binds us, gravity guides us.",
    "Through the gateway, we find the core.",
    "Awaken the sky, grounding the earth."
];

export const OfflineRecitationRitual: React.FC<RecitationRitualProps> = ({ onComplete }) => {
    // Manual control - Enable active so analyze loop runs when toggled
    const { volume, error, toggle, isListening, stop } = useAudioInput(true);
    const [progress, setProgress] = useState(0);
    const [currentLine, setCurrentLine] = useState(0);

    // Stricter threshold for offline - must be louder/clearer (lowered from 0.2 for usability)
    const VOLUME_THRESHOLD = 0.1;

    const [level, setLevel] = useState(1);
    const MAX_LEVELS = 30;

    // Use volumeRef for stable interval check
    const volumeRef = React.useRef(0);
    useEffect(() => {
        volumeRef.current = volume;
    }, [volume]);

    useEffect(() => {
        if (!isListening) return;

        const interval = setInterval(() => {
            if (volumeRef.current > VOLUME_THRESHOLD) {
                setProgress(prev => {
                    // Faster progress for testing 30 levels
                    const newProgress = Math.min(100, prev + 2);

                    // Advance text based on progress chunks
                    if (newProgress > (currentLine + 1) * 20 && currentLine < MANTRAS.length - 1) {
                        setCurrentLine(l => l + 1);
                    }

                    if (newProgress >= 100) {
                        if (level < MAX_LEVELS) {
                            setLevel(l => l + 1);
                            setCurrentLine(0);
                            return 0; // Reset progress
                        } else {
                            stop();
                            onComplete(100);
                        }
                    }
                    return newProgress;
                });
            }
        }, 50); // Faster tick

        return () => clearInterval(interval);
    }, [isListening, onComplete, currentLine, stop, level]);

    return (
        <div className="flex flex-col items-center gap-6 w-full h-full justify-center relative overflow-hidden">
            {/* Background Viz */}
            <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
                <motion.div
                    className="w-64 h-64 bg-blue-500 rounded-full blur-3xl"
                    animate={{ scale: 1 + volume * 3, opacity: 0.2 + volume }}
                />
            </div>

            <div className="z-10 w-full max-w-sm px-6 text-center space-y-8">
                <div className="h-24 flex items-center justify-center">
                    <motion.div
                        key={currentLine}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-white font-serif italic text-xl leading-relaxed"
                    >
                        "{MANTRAS[currentLine]}"
                    </motion.div>
                </div>

                <div className="flex justify-center">
                    <button
                        onClick={toggle}
                        className={`w-20 h-20 rounded-full flex items-center justify-center transition-all border-4 ${isListening && volume > VOLUME_THRESHOLD ? 'border-[#CCFF00] bg-white/10 shadow-[0_0_30px_#CCFF00]' : 'border-white/30 bg-black/40'}`}
                    >
                        <Mic size={32} className={isListening ? 'text-[#CCFF00]' : 'text-white/55'} />
                    </button>
                </div>

                <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-white/70 uppercase tracking-widest">
                        <span>Recitation Progress</span>
                        <span className="text-[#CCFF00] font-bold">LVL {level}/{MAX_LEVELS} • {Math.floor(progress)}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-gradient-to-r from-blue-500 to-[#CCFF00]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
