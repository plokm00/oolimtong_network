import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GatewayLocation } from "@/lib/gateway-data"
import { ResonanceWave } from "./ResonanceWave"
import { GOLDEN_ANGLE, REST_RADIUS, PARALLAX_MULTIPLIER } from "@/lib/constants"

interface ResonanceNodeProps {
    location: GatewayLocation;
    isSelected: boolean;
    isMobile: boolean;
    index: number;
    mousePos: { x: number; y: number };
    jitter: { x: number; y: number };
    onSelect: (loc: GatewayLocation) => void;
    onHover?: (name: string | null, color?: 'yellow' | 'blue') => void;
}

export const ResonanceNode = memo(({
    location,
    isSelected,
    isMobile,
    index,
    mousePos,
    jitter,
    onSelect,
    onHover
}: ResonanceNodeProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const restOffsetX = Math.cos(index * GOLDEN_ANGLE) * REST_RADIUS;
    const restOffsetY = Math.sin(index * GOLDEN_ANGLE) * REST_RADIUS;

    return (
        <div
            className="absolute pointer-events-auto"
            style={{
                left: `${location.x + jitter.x}%`,
                top: `${location.y + jitter.y}%`,
                transform: `translate(-50%, -50%) translate(${(mousePos.x - 0.5) * location.z * PARALLAX_MULTIPLIER + restOffsetX}px, ${(mousePos.y - 0.5) * location.z * PARALLAX_MULTIPLIER + restOffsetY}px)`,
                zIndex: isHovered ? 50 : 10
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                    duration: 2,
                    delay: index * 0.12,
                    ease: [0.23, 1, 0.32, 1]
                }}
                className="cursor-pointer group relative flex items-center justify-center"
                onClick={(e) => {
                    e.stopPropagation();
                    onSelect(location);
                }}
                onMouseEnter={() => {
                    setIsHovered(true);
                    onHover?.(location.name, 'yellow');
                }}
                onMouseLeave={() => {
                    setIsHovered(false);
                    onHover?.(null);
                }}
                onTouchStart={(e) => e.stopPropagation()}
            >
                {/* Tooltip */}
                <AnimatePresence>
                    {isHovered && (
                        <motion.div
                            initial={{ opacity: 0, y: 6, x: "-50%" }}
                            animate={{ opacity: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0, y: 6, x: "-50%" }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className="absolute bottom-full left-1/2 mb-3.5 z-[100] pointer-events-none flex flex-col items-center"
                        >
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/85 border border-white/10 backdrop-blur-sm rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                <span className="w-[5px] h-[5px] rounded-full bg-[#CCFF00] shadow-[0_0_6px_rgba(204,255,0,0.8)] shrink-0" />
                                <span
                                    className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/95 whitespace-nowrap"
                                    style={{ textShadow: '0 0 12px rgba(255,255,255,0.4)' }}
                                >
                                    {location.name}
                                </span>
                            </div>
                            <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/85 mt-[-1px]" />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Resonance Waves */}
                <AnimatePresence>
                    {isSelected && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="absolute"
                        >
                            <ResonanceWave />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Node Visual (Squircle) */}
                <motion.div
                    className={`${isMobile ? 'w-2.5 h-2.5' : 'w-[0.7rem] h-[0.7rem]'} bg-white relative z-10`}
                    style={{
                        borderRadius: '48% 52% 45% 55% / 55% 45% 52% 48%',
                        boxShadow: `0 0 ${15 * (0.3 + (location.participation / 100) * 0.7)}px #fff, 0 0 ${25 * (0.3 + (location.participation / 100) * 0.7)}px #CCFF00`,
                        filter: `brightness(${0.5 + (location.participation / 100) * 0.5})`
                    }}
                    animate={{
                        scaleY: [1, 1.15, 1],
                        scaleX: [1, 0.9, 1.1, 1],
                        opacity: [0.95, 1, 0.95],
                        borderRadius: [
                            '48% 52% 45% 55% / 55% 45% 52% 48%',
                            '30% 70% 70% 30% / 30% 30% 70% 70%',
                            '60% 40% 30% 70% / 60% 30% 70% 40%',
                            '48% 52% 45% 55% / 55% 45% 52% 48%'
                        ]
                    }}
                    transition={{
                        duration: 4 + Math.random() * 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Ambient Glow */}
                <div
                    className="absolute w-8 h-8 bg-[#CCFF00]/30 rounded-full blur-md group-hover:bg-[#CCFF00]/50 transition-colors pointer-events-none"
                    style={{
                        opacity: 0.3 + (location.participation / 100) * 0.7,
                        transform: `scale(${0.8 + (location.participation / 100) * 0.2})`
                    }}
                />
            </motion.div>
        </div>
    );
});
