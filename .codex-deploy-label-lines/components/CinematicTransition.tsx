import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

interface CinematicTransitionProps {
    mode: 'none' | 'text' | 'game' | 'vortex'; // Aligned with entryStep
    user: { nickname: string; ninnikTitle: string } | null;
    isMobile: boolean;
    isTransitioning?: boolean; // For the 'game' blackout state
    showTransitionText?: boolean; // For the text inside blackout
    onComplete?: () => void; // Optional callback
    onDismiss?: () => void; // Click-to-dismiss the blackout
    subText?: string;
}

export const CinematicTransition = ({
    mode,
    user,
    isMobile,
    isTransitioning = false,
    showTransitionText = false,
    onComplete,
    onDismiss,
    subText
}: CinematicTransitionProps) => {
    const [isMuted, setIsMuted] = useState(true);

    const toggleMute = () => setIsMuted(prev => !prev);

    return (
        <>
            {/* 1. Login/Entry Welcome Text Sequence -> REPLACED WITH VIDEO */}
            <AnimatePresence>
                {mode === 'text' && (
                    <motion.div
                        key="entry-video"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="fixed inset-0 z-[600] flex items-center justify-center bg-black pointer-events-auto"
                    >
                        <div className="absolute inset-0 w-full h-full bg-black">
                            <video
                                className="w-full h-full object-contain"
                                src="/videos/fairy.mp4"
                                autoPlay
                                muted={isMuted}
                                playsInline
                                preload="auto"
                                onEnded={onComplete}
                                style={{ pointerEvents: 'none' }}
                            />
                        </div>

                        {/* Controls Container */}
                        <div className="absolute bottom-10 right-10 z-[700] flex gap-4 items-center">
                            {/* Mute Toggle */}
                            <button
                                onClick={toggleMute}
                                className="text-white/50 hover:text-[#CCFF00] transition-colors p-2 rounded-full border border-white/20 hover:border-[#CCFF00] bg-black/20 backdrop-blur-sm"
                                title={isMuted ? "Unmute" : "Mute"}
                            >
                                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                            </button>

                            {/* Skip Button */}
                            <button
                                onClick={onComplete}
                                className="text-white/50 hover:text-[#CCFF00] font-mono text-xs tracking-widest border border-white/20 hover:border-[#CCFF00] px-4 py-2 rounded uppercase transition-all bg-black/20 backdrop-blur-sm"
                            >
                                Skip &gt;&gt;
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. Mainstream/Game Entry Blackout Sequence */}
            <AnimatePresence>
                {isTransitioning && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 bg-black z-[10000] pointer-events-auto flex items-center justify-center cursor-pointer"
                        onClick={onDismiss}
                    >
                        <AnimatePresence>
                            {showTransitionText && (
                                <motion.div
                                    /* Fixed position so layout never shifts */
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{
                                        duration: 2.0,
                                        ease: [0.16, 1, 0.3, 1]
                                    }}
                                    className="flex flex-col items-center justify-center gap-5 px-6 text-center select-none pointer-events-none"
                                >
                                    {/* Secondary label — small & dim */}
                                    <div className={`text-white/30 font-mono ${isMobile ? 'text-[8px] tracking-[0.25em]' : 'text-[10px] tracking-[0.4em]'} uppercase`}>
                                        Entering Mainstream...
                                    </div>

                                    {/* Hero story text — fades in with a slight delay */}
                                    {subText && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.8, duration: 2.0, ease: [0.16, 1, 0.3, 1] }}
                                            className={`text-white font-sans max-w-sm ${isMobile ? 'text-[13px] leading-relaxed' : 'text-base leading-relaxed'} break-keep text-center font-medium`}
                                        >
                                            {subText}
                                        </motion.div>
                                    )}

                                    {/* Hint to dismiss */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 2.5, duration: 1.5 }}
                                        className={`text-white/20 font-mono ${isMobile ? 'text-[7px]' : 'text-[8px]'} tracking-widest uppercase mt-4`}
                                    >
                                        click anywhere to continue
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
