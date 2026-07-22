import { useRef, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GatewayLocation } from "@/lib/gateway-data"
import { UserNode } from "@/lib/user-node-data"
import { ResonanceNode } from "./ResonanceNode"
import { UserNodeVisual } from "./UserNodeVisual"
import { computeJitter } from "@/lib/map-utils"

interface ResonanceMapVisualsProps {
    locations: GatewayLocation[];
    userNodes?: UserNode[];
    currentUser?: { id: string } | null;
    selectedLocation: GatewayLocation | null;
    onSelectLocation: (loc: GatewayLocation | null) => void;
    selectedUserNode: UserNode | null;
    onSelectUserNode: (node: UserNode | null) => void;
    isMobile: boolean;
    mousePos: { x: number; y: number };
}

export const ResonanceMapVisuals: React.FC<ResonanceMapVisualsProps> = ({
    locations,
    userNodes = [],
    currentUser,
    selectedLocation,
    onSelectLocation,
    selectedUserNode,
    onSelectUserNode,
    isMobile,
    mousePos
}) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredName, setHoveredName] = useState<string | null>(null);
    const [hoveredColor, setHoveredColor] = useState<'yellow' | 'blue'>('yellow');

    const handleHover = (name: string | null, color: 'yellow' | 'blue' = 'yellow') => {
        setHoveredName(name);
        if (name) setHoveredColor(color);
    };

    const jitterMap = useMemo(
        () => locations.map((loc, i) => computeJitter(locations, i, loc)),
        [locations]
    );

    return (
        <>
            {/* Map Container */}
            <div className={`relative flex justify-center items-center w-full ${isMobile ? 'max-w-[67.5vw] translate-y-[2vh]' : 'max-w-[420px] translate-y-[4vh]'}`}>
                <div ref={mapContainerRef} className={`relative w-full ${isMobile ? 'aspect-[3/5]' : 'aspect-[2/3]'} flex-shrink-0 z-10`}>
                    <svg viewBox={isMobile ? "10 50 380 700" : "-50 -50 500 800"} className="w-full h-full filter drop-shadow-[0_0_30px_rgba(204, 255, 0, 0.15)] overflow-visible">
                        <defs>
                            <filter id="starGlow" x="-200%" y="-200%" width="500%" height="500%">
                                <feGaussianBlur stdDeviation="3" result="blur" />
                                <feMerge>
                                    <feMergeNode in="blur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <g transform={isMobile ? "translate(0, 0)" : "translate(0, -20)"}>
                            {/* Compass/Ellipse Hidden */}
                        </g>
                    </svg>
                </div>
            </div>

            <div className={`absolute inset-0 z-40 pointer-events-none flex items-center justify-center`}>
                <div className={`relative w-full ${isMobile ? 'max-w-[67.5vw] aspect-[3/5] translate-y-[2vh]' : 'max-w-[420px] aspect-[2/3] translate-y-[4vh]'} pointer-events-none`}>
                    <div className="absolute inset-0 opacity-0 pointer-events-none">
                        {/* Outline elements removed from view */}
                    </div>
                    {userNodes.map((node, i) => (
                        <UserNodeVisual
                            key={`unode-${node.id}`}
                            node={node}
                            currentUser={currentUser}
                            isMobile={isMobile}
                            mousePos={mousePos}
                            index={locations.length + i}
                            isSelected={selectedUserNode?.id === node.id}
                            onSelect={onSelectUserNode}
                            onHover={isMobile ? undefined : handleHover}
                        />
                    ))}
                    {locations.map((loc, i) => (
                        <ResonanceNode
                            key={i}
                            location={loc}
                            isSelected={selectedLocation?.name === loc.name}
                            isMobile={isMobile}
                            index={i}
                            mousePos={mousePos}
                            jitter={jitterMap[i]}
                            onSelect={onSelectLocation}
                            onHover={isMobile ? undefined : handleHover}
                        />
                    ))}
                </div>
            </div>
        </>
    );
};
