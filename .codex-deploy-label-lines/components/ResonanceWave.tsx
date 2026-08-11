import { memo } from "react"
import { motion } from "framer-motion"

interface ResonanceWaveProps {
    color?: 'yellow' | 'blue';
}

// Resonance Wave Effect Component
export const ResonanceWave = memo(({ color = 'yellow' }: ResonanceWaveProps) => {
    const c = color === 'blue'
        ? { ring1: 'border-[#3b82f6]/60', ring2: 'border-[#3b82f6]/40', arc1: 'border-[#3b82f6]/80', arc2: 'border-[#3b82f6]/40', glow: 'bg-[#3b82f6]/5' }
        : { ring1: 'border-[#CCFF00]/60', ring2: 'border-[#CCFF00]/40', arc1: 'border-[#CCFF00]/80', arc2: 'border-[#CCFF00]/40', glow: 'bg-[#CCFF00]/5' };

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Inner Pulsing Ring */}
            <motion.div
                className={`absolute w-8 h-8 rounded-full border ${c.ring1}`}
                animate={{
                    scale: [1, 2.5],
                    opacity: [0.6, 0]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut"
                }}
            />
            {/* Outer Pulsing Ring */}
            <motion.div
                className={`absolute w-8 h-8 rounded-full border ${c.ring2}`}
                animate={{
                    scale: [1, 4],
                    opacity: [0.4, 0]
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay: 0.5
                }}
            />
            {/* Swirling Vortex Arcs */}
            <motion.div
                className={`absolute w-12 h-12 rounded-full border-t-2 border-r-2 ${c.arc1}`}
                animate={{ rotate: 360 }}
                transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            <motion.div
                className={`absolute w-16 h-16 rounded-full border-b-2 border-l-2 ${c.arc2}`}
                animate={{ rotate: -360 }}
                transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
            {/* Ambient Glow */}
            <div className={`absolute w-20 h-20 ${c.glow} rounded-full blur-xl animate-pulse`} />
        </div>
    );
});
