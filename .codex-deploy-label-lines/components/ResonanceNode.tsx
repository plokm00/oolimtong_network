import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GatewayLocation } from "@/lib/gateway-data"
import { ResonanceWave } from "./ResonanceWave"
import { ResonanceNodeLabel } from "./ResonanceNodeLabel"
import { computeGatewayRestOffsetPercent, computeParallaxOffsetPercent } from "@/lib/map-utils"

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
    const parallaxOffset = computeParallaxOffsetPercent(mousePos, location.z);
    const restOffset = computeGatewayRestOffsetPercent(index);

    return (
        <div
            data-resonance-node={location.name}
            className="absolute pointer-events-auto"
            style={{
                left: `${location.x + jitter.x + restOffset.x + parallaxOffset.x}%`,
                top: `${location.y + jitter.y + restOffset.y + parallaxOffset.y}%`,
                transform: 'translate(-50%, -50%)',
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
            >
                <ResonanceNodeLabel
                    name={location.name}
                    color="yellow"
                    isVisible={!isMobile && isHovered}
                />

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
