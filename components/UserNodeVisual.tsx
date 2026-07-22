import { memo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { UserNode } from "@/lib/user-node-data"
import { ResonanceWave } from "./ResonanceWave"
import { PARALLAX_MULTIPLIER } from "@/lib/constants"

interface UserNodeVisualProps {
    node: UserNode;
    currentUser?: { id: string } | null;
    isMobile: boolean;
    mousePos: { x: number; y: number };
    index: number;
    isSelected?: boolean;
    onSelect: (node: UserNode) => void;
    onHover?: (name: string | null, color?: 'yellow' | 'blue') => void;
}

export const UserNodeVisual = memo(({
    node,
    currentUser,
    isMobile,
    mousePos,
    index,
    isSelected = false,
    onSelect,
    onHover
}: UserNodeVisualProps) => {
    const [isHovered, setIsHovered] = useState(false);

    const isOwner = currentUser?.id === node.ownerId;

    if (node.state === 'superposition' && !isOwner) return null;

    const hoverName = node.name || null;

    // ─── MATERIALIZED ───
    if (node.state === 'materialized') {
        const participation = Math.min(node.observers.length * 20, 100);
        return (
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: `translate(-50%, -50%) translate(${(mousePos.x - 0.5) * node.z * PARALLAX_MULTIPLIER}px, ${(mousePos.y - 0.5) * node.z * PARALLAX_MULTIPLIER}px)`,
                    zIndex: isHovered ? 50 : 10
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2, delay: index * 0.12, ease: [0.23, 1, 0.32, 1] }}
                    className="cursor-pointer group relative flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); onSelect(node); }}
                    onMouseEnter={() => {
                        setIsHovered(true);
                        onHover?.(hoverName, 'yellow');
                    }}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        onHover?.(null);
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    {/* Tooltip */}
                    <AnimatePresence>
                        {isHovered && hoverName && (
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
                                        {hoverName}
                                    </span>
                                </div>
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/85 mt-[-1px]" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isSelected && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute">
                                <ResonanceWave />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.div
                        className={`${isMobile ? 'w-2.5 h-2.5' : 'w-[0.7rem] h-[0.7rem]'} bg-white relative z-10`}
                        style={{
                            borderRadius: '48% 52% 45% 55% / 55% 45% 52% 48%',
                            boxShadow: `0 0 ${15 * (0.3 + (participation / 100) * 0.7)}px #fff, 0 0 ${25 * (0.3 + (participation / 100) * 0.7)}px #CCFF00`,
                            filter: `brightness(${0.5 + (participation / 100) * 0.5})`
                        }}
                        animate={{
                            scaleY: [1, 1.15, 1], scaleX: [1, 0.9, 1.1, 1], opacity: [0.95, 1, 0.95],
                            borderRadius: ['48% 52% 45% 55% / 55% 45% 52% 48%', '30% 70% 70% 30% / 30% 30% 70% 70%', '60% 40% 30% 70% / 60% 30% 70% 40%', '48% 52% 45% 55% / 55% 45% 52% 48%']
                        }}
                        transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div
                        className="absolute w-8 h-8 bg-[#CCFF00]/30 rounded-full blur-md group-hover:bg-[#CCFF00]/50 transition-colors pointer-events-none"
                        style={{ opacity: 0.3 + (participation / 100) * 0.7, transform: `scale(${0.8 + (participation / 100) * 0.2})` }}
                    />
                </motion.div>
            </div>
        );
    }

    // ─── OBSERVABLE: Squircle, blue ───
    if (node.state === 'observable') {
        return (
            <div
                className="absolute pointer-events-auto"
                style={{
                    left: `${node.x}%`,
                    top: `${node.y}%`,
                    transform: `translate(-50%, -50%) translate(${(mousePos.x - 0.5) * node.z * PARALLAX_MULTIPLIER}px, ${(mousePos.y - 0.5) * node.z * PARALLAX_MULTIPLIER}px)`,
                    zIndex: isHovered ? 50 : 10
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.3 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 2, delay: index * 0.12, ease: [0.23, 1, 0.32, 1] }}
                    className="cursor-pointer group relative flex items-center justify-center"
                    onClick={(e) => { e.stopPropagation(); onSelect(node); }}
                    onMouseEnter={() => {
                        setIsHovered(true);
                        onHover?.(hoverName, 'blue');
                    }}
                    onMouseLeave={() => {
                        setIsHovered(false);
                        onHover?.(null);
                    }}
                    onTouchStart={(e) => e.stopPropagation()}
                >
                    {/* Tooltip */}
                    <AnimatePresence>
                        {isHovered && hoverName && (
                            <motion.div
                                initial={{ opacity: 0, y: 6, x: "-50%" }}
                                animate={{ opacity: 1, y: 0, x: "-50%" }}
                                exit={{ opacity: 0, y: 6, x: "-50%" }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                className="absolute bottom-full left-1/2 mb-3.5 z-[100] pointer-events-none flex flex-col items-center"
                            >
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-black/85 border border-white/10 backdrop-blur-sm rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                                    <span className="w-[5px] h-[5px] rounded-full bg-[#93c5fd] shadow-[0_0_6px_rgba(59,130,246,0.8)] shrink-0" />
                                    <span
                                        className="font-mono text-[9px] tracking-[0.25em] uppercase text-white/95 whitespace-nowrap"
                                        style={{ textShadow: '0 0 12px rgba(255,255,255,0.4)' }}
                                    >
                                        {hoverName}
                                    </span>
                                </div>
                                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/85 mt-[-1px]" />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <AnimatePresence>
                        {isSelected && (
                            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="absolute">
                                <ResonanceWave color="blue" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <motion.div
                        className={`${isMobile ? 'w-2.5 h-2.5' : 'w-[0.7rem] h-[0.7rem]'} relative z-10`}
                        style={{
                            borderRadius: '48% 52% 45% 55% / 55% 45% 52% 48%',
                            backgroundColor: '#bfdbfe',
                            boxShadow: `0 0 15px #fff, 0 0 25px #3b82f6`,
                            filter: 'brightness(0.9)'
                        }}
                        animate={{
                            scaleY: [1, 1.15, 1], scaleX: [1, 0.9, 1.1, 1], opacity: [0.85, 1, 0.85],
                            borderRadius: ['48% 52% 45% 55% / 55% 45% 52% 48%', '30% 70% 70% 30% / 30% 30% 70% 70%', '60% 40% 30% 70% / 60% 30% 70% 40%', '48% 52% 45% 55% / 55% 45% 52% 48%']
                        }}
                        transition={{ duration: 4 + Math.random() * 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div
                        className="absolute w-8 h-8 bg-[#3b82f6]/30 rounded-full blur-md group-hover:bg-[#3b82f6]/50 transition-colors pointer-events-none"
                        style={{ opacity: 0.6 }}
                    />
                </motion.div>
            </div>
        );
    }

    // ─── SUPERPOSITION: Dim pulsing dot (owner only) ───
    return (
        <div
            className="absolute pointer-events-auto"
            style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                transform: `translate(-50%, -50%) translate(${(mousePos.x - 0.5) * node.z * PARALLAX_MULTIPLIER}px, ${(mousePos.y - 0.5) * node.z * PARALLAX_MULTIPLIER}px)`
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 0.5, scale: 1 }}
                transition={{ duration: 2.5, delay: index * 0.1, ease: "easeOut" }}
                className="cursor-pointer group relative flex items-center justify-center"
                onClick={(e) => { e.stopPropagation(); onSelect(node); }}
                onTouchStart={(e) => e.stopPropagation()}
            >
                <motion.div
                    className={`${isMobile ? 'w-2 h-2' : 'w-[0.5rem] h-[0.5rem]'} relative z-10 rounded-full`}
                    style={{ backgroundColor: '#93c5fd', boxShadow: `0 0 10px #1e3a8a, 0 0 20px #1e3a8a`, filter: 'brightness(0.6) blur(2px)' }}
                    animate={{ opacity: [0.15, 1, 0.15], scale: [0.8, 1.4, 0.8] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: ["easeOut", "easeIn"] }}
                />
                <div className="absolute w-12 h-12 rounded-full blur-xl pointer-events-none" style={{ backgroundColor: '#1e3a8a', opacity: 0.15 }} />
            </motion.div>
        </div>
    );
});
