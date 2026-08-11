import { useEffect, useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GatewayLocation } from "@/lib/gateway-data"
import { ResonanceMapVisuals } from "./ResonanceMapVisuals"
import { StarfieldCanvas } from "./StarfieldCanvas"
import { ResonanceHeader } from "./ResonanceHeader"
import { ResonanceFooter } from "./ResonanceFooter"

// Types




import { UserNode } from "@/lib/user-node-data"

interface TouchGesture {
    identifier: number;
    lastClientX: number;
    lastClientY: number;
}

const clampUnit = (value: number) => Math.min(Math.max(value, 0), 1);

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
    const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null)
    const interactionPosRef = useRef(mousePos)
    const touchGestureRef = useRef<TouchGesture | null>(null)

    const updateInteractionPosition = useCallback((position: { x: number; y: number }) => {
        interactionPosRef.current = position;
        setMousePos(position);
    }, [])

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        // Prevent synthesized mouse events from mobile touch from triggering movement
        if (isMobile || !containerRef.current) return

        const rect = containerRef.current.getBoundingClientRect()
        const x = (e.clientX - rect.left) / rect.width
        const y = (e.clientY - rect.top) / rect.height
        updateInteractionPosition({ x: clampUnit(x), y: clampUnit(y) })
        setIsMouseActive(true)

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800)
    }, [isMobile, updateInteractionPosition])

    const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        if (!containerRef.current || !e.touches[0]) return

        const touch = e.touches[0]
        touchGestureRef.current = {
            identifier: touch.identifier,
            lastClientX: touch.clientX,
            lastClientY: touch.clientY,
        }

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
        setIsMouseActive(true)
    }, [])

    const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const gesture = touchGestureRef.current
        if (!containerRef.current || !gesture) return

        const rect = containerRef.current.getBoundingClientRect()
        const touch = Array.from(e.touches).find(
            candidate => candidate.identifier === gesture.identifier
        )
        if (!touch) return

        // Measure each movement from the previous touch point. This prevents
        // overshoot beyond a clamped edge from becoming a directional dead zone.
        const deltaX = (touch.clientX - gesture.lastClientX) / rect.width
        const deltaY = (touch.clientY - gesture.lastClientY) / rect.height

        gesture.lastClientX = touch.clientX
        gesture.lastClientY = touch.clientY

        updateInteractionPosition({
            x: clampUnit(interactionPosRef.current.x + deltaX),
            y: clampUnit(interactionPosRef.current.y + deltaY),
        })
        setIsMouseActive(true)
    }, [updateInteractionPosition])

    const handleTouchEnd = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
        const gesture = touchGestureRef.current
        if (!gesture) return

        const gestureStillActive = Array.from(e.touches).some(
            touch => touch.identifier === gesture.identifier
        )
        if (gestureStillActive) return

        touchGestureRef.current = null
        setIsMouseActive(false)
    }, [])

    const handleMouseLeave = useCallback(() => {
        setIsMouseActive(false)
    }, [])

    useEffect(() => () => {
        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current)
    }, [])

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchMove={handleTouchMove}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
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
