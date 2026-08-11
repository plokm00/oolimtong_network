import { AnimatePresence, motion } from "framer-motion"
import { MobileLabelPlacement } from "@/lib/mobile-label-layout"

interface ResonanceNodeLabelProps {
    name: string;
    color: 'yellow' | 'blue';
    isVisible: boolean;
}

export const ResonanceNodeLabel: React.FC<ResonanceNodeLabelProps> = ({
    name,
    color,
    isVisible,
}) => {
    const textClass = color === 'blue' ? 'text-[#93c5fd]' : 'text-[#CCFF00]';

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: 6, x: '-50%' }}
                    animate={{ opacity: 1, y: 0, x: '-50%' }}
                    exit={{ opacity: 0, y: 6, x: '-50%' }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="absolute bottom-full left-1/2 mb-3.5 z-[100] pointer-events-none flex flex-col items-center"
                >
                    <div className="flex items-center bg-black/80 border border-white/10 backdrop-blur-sm rounded shadow-[0_4px_12px_rgba(0,0,0,0.5)] px-2.5 py-1">
                        <span
                            className={`font-mono uppercase whitespace-nowrap text-[9px] tracking-[0.25em] ${textClass}`}
                            style={{ textShadow: '0 0 12px rgba(255,255,255,0.4)' }}
                        >
                            {name}
                        </span>
                    </div>
                    <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-black/85 mt-[-1px]" />
                </motion.div>
            )}
        </AnimatePresence>
    );
};

interface MobileResonanceLabelProps {
    placement: MobileLabelPlacement;
}

export const MobileResonanceLabel: React.FC<MobileResonanceLabelProps> = ({ placement }) => {
    const textColorClass = placement.color === 'blue' ? 'text-[#93c5fd]' : 'text-[#CCFF00]';
    const lineColorClass = placement.color === 'blue' ? 'bg-[#93c5fd]' : 'bg-[#CCFF00]';
    const labelEdgeX = Math.min(
        Math.max(placement.x, placement.left),
        placement.left + placement.width
    );
    const labelEdgeY = Math.min(
        Math.max(placement.y, placement.top),
        placement.top + placement.height
    );
    const deltaX = labelEdgeX - placement.x;
    const deltaY = labelEdgeY - placement.y;
    const edgeDistance = Math.hypot(deltaX, deltaY);
    const unitX = edgeDistance > 0 ? deltaX / edgeDistance : 0;
    const unitY = edgeDistance > 0 ? deltaY / edgeDistance : 0;
    const lineStartX = placement.x + unitX * 4;
    const lineStartY = placement.y + unitY * 4;
    const lineEndX = labelEdgeX - unitX;
    const lineEndY = labelEdgeY - unitY;
    const lineLength = Math.max(0, Math.hypot(lineEndX - lineStartX, lineEndY - lineStartY));
    const lineAngle = Math.atan2(lineEndY - lineStartY, lineEndX - lineStartX) * 180 / Math.PI;

    return (
        <>
            <motion.div
                data-mobile-node-label-line={placement.name}
                initial={{ opacity: 0 }}
                animate={{
                    opacity: 0.48,
                    left: lineStartX,
                    top: lineStartY,
                    width: lineLength,
                    rotate: lineAngle,
                }}
                transition={{ duration: 0.08 }}
                className={`absolute z-[90] h-px pointer-events-none origin-left ${lineColorClass}`}
            />
            <motion.div
                data-mobile-node-label={placement.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, left: placement.left, top: placement.top }}
                transition={{ opacity: { duration: 0.15 }, left: { duration: 0.08 }, top: { duration: 0.08 } }}
                className={`absolute z-[100] pointer-events-none flex h-[9px] items-center font-mono text-[6.5px] leading-none tracking-[0.1em] uppercase whitespace-nowrap ${textColorClass}`}
                style={{
                    width: placement.width,
                    textShadow: '0 1px 2px #000, 0 0 5px rgba(0,0,0,0.95)',
                }}
            >
                {placement.name}
            </motion.div>
        </>
    );
};
