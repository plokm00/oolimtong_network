import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GatewayLocation } from "@/lib/gateway-data"
import { ResonanceMapVisuals } from "./ResonanceMapVisuals"
import { StarfieldCanvas } from "./StarfieldCanvas"
import { ResonanceHeader } from "./ResonanceHeader"
import { ResonanceFooter } from "./ResonanceFooter"

// Types




import { UserNode } from "@/lib/user-node-data"

interface ResonanceMapProps {
    locations: GatewayLocation[];
    userNodes?: UserNode[];
    currentUser?: { id: string; nickname?: string; ninnikTitle?: string } | null;
    selectedLocation: GatewayLocation | null;
    onSelectLocation: (loc: GatewayLocation | null) => void;
    selectedUserNode: UserNode | null;
    onSelectUserNode: (node: UserNode | null) => void;
    isMobile: boolean;
}

export const ResonanceMap: React.FC<ResonanceMapProps> = ({
    locations,
    userNodes = [],
    currentUser,
    selectedLocation,
    onSelectLocation,
    selectedUserNode,
    onSelectUserNode,
    isMobile
}) => {
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [isMouseActive, setIsMouseActive] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null)
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent synthesized mouse events from mobile touch from triggering movement
        if (isMobile || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        setMousePos({ x, y })
        setIsMouseActive(true)

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800)
    }, [isMobile])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!containerRef.current || !e.touches[0]) return

        const rect = containerRef.current.getBoundingClientRect()
        const touch = e.touches[0]
        const x = (touch.clientX - rect.left) / rect.width
        const y = (touch.clientY - rect.top) / rect.height
        setMousePos({ x, y })
        setIsMouseActive(true)

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsMouseActive(false)
    }, [])

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchStart={(e) => {
                // Determine if this is a tap or the start of a move.
                // For now, let's just make it active without updating position immediately if we want to avoid "snap" on tap.
                // But touchMove will handle the actual dragging.
                setIsMouseActive(true)
            }}
            onTouchEnd={() => setIsMouseActive(false)}
            style={{
                background: 'radial-gradient(circle at center, #000d0e 0%, #000000 100%)'
            }}
            className="fixed inset-0 h-[100dvh] flex flex-col items-center justify-center p-4 text-white overflow-hidden overscroll-none touch-none select-none transition-colors duration-1000"
        >
            {/* Backdrop Overlay - Separate from modal content to ensure independent animation */}
            <AnimatePresence>
                {(selectedLocation || selectedUserNode) && (
                    <motion.div
                        key="modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-30 bg-black/40 pointer-events-auto"
                        onClick={() => {
                            onSelectLocation(null);
                            onSelectUserNode(null);
                        }}
                    />
                )}
            </AnimatePresence>

            {/* High-Density Starfield Background */}
            <StarfieldCanvas mousePos={mousePos} isMouseActive={isMouseActive} />

            {/* Title Section */}
            <ResonanceHeader
                isMobile={isMobile}
                isMouseActive={isMouseActive}
                selectedLocation={selectedLocation}
            />

            <ResonanceMapVisuals
                locations={locations}
                userNodes={userNodes}
                currentUser={currentUser}
                selectedLocation={selectedLocation}
                onSelectLocation={onSelectLocation}
                selectedUserNode={selectedUserNode}
                onSelectUserNode={onSelectUserNode}
                isMobile={isMobile}
                mousePos={mousePos}
            />

            {/* Status Footer */}
            <ResonanceFooter isMobile={isMobile} />
        </div>
    );
};
