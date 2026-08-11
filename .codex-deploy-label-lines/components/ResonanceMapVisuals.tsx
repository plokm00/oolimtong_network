import { useEffect, useMemo, useRef, useState } from "react"
import { GatewayLocation } from "@/lib/gateway-data"
import { UserNode } from "@/lib/user-node-data"
import { ResonanceNode } from "./ResonanceNode"
import { UserNodeVisual } from "./UserNodeVisual"
import { MobileResonanceLabel } from "./ResonanceNodeLabel"
import { computeGatewayRestOffsetPercent, computeJitter, computeParallaxOffsetPercent } from "@/lib/map-utils"
import { layoutMobileLabels, MobileLabelAnchor } from "@/lib/mobile-label-layout"

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
    const coordinatePlaneRef = useRef<HTMLDivElement>(null);
    const [planeSize, setPlaneSize] = useState({ width: 0, height: 0 });
    const jitterMap = useMemo(
        () => locations.map((loc, i) => computeJitter(locations, i, loc)),
        [locations]
    );

    useEffect(() => {
        const plane = coordinatePlaneRef.current;
        if (!isMobile || !plane) return;

        const updatePlaneSize = () => {
            const rect = plane.getBoundingClientRect();
            setPlaneSize(previous => (
                previous.width === rect.width && previous.height === rect.height
                    ? previous
                    : { width: rect.width, height: rect.height }
            ));
        };

        updatePlaneSize();
        const resizeObserver = new ResizeObserver(updatePlaneSize);
        resizeObserver.observe(plane);

        return () => resizeObserver.disconnect();
    }, [isMobile]);

    const mobileLabelPlacements = useMemo(() => {
        if (!isMobile || planeSize.width <= 0 || planeSize.height <= 0) return [];

        const anchors: MobileLabelAnchor[] = locations.map((location, index) => {
            const jitter = jitterMap[index];
            const restOffset = computeGatewayRestOffsetPercent(index);
            const parallaxOffset = computeParallaxOffsetPercent(mousePos, location.z);

            return {
                id: `gateway-label-${location.id}`,
                name: location.name,
                color: 'yellow' as const,
                x: (location.x + jitter.x + restOffset.x + parallaxOffset.x) * planeSize.width / 100,
                y: (location.y + jitter.y + restOffset.y + parallaxOffset.y) * planeSize.height / 100,
            };
        });

        for (const node of userNodes) {
            const isOwner = currentUser?.id === node.ownerId;
            if (!node.name || (node.state === 'superposition' && !isOwner)) continue;

            const parallaxOffset = computeParallaxOffsetPercent(mousePos, node.z);
            anchors.push({
                id: `user-label-${node.id}`,
                name: node.name,
                color: node.state === 'observable' ? 'blue' : 'yellow',
                x: (node.x + parallaxOffset.x) * planeSize.width / 100,
                y: (node.y + parallaxOffset.y) * planeSize.height / 100,
            });
        }

        return layoutMobileLabels(anchors, planeSize);
    }, [currentUser?.id, isMobile, jitterMap, locations, mousePos, planeSize, userNodes]);

    const coordinatePlaneWidth = isMobile
        ? 'min(420px, 67.5vw, calc(66.6667dvh - 83.3333px))'
        : 'min(420px, 67.5vw, calc(66.6667dvh - 166.6667px))';

    return (
        <div className={`absolute inset-x-0 z-40 pointer-events-none flex items-center justify-center ${isMobile ? 'top-[95px] bottom-[30px]' : 'top-[205px] bottom-[45px]'}`}>
            <div
                ref={coordinatePlaneRef}
                data-testid="resonance-coordinate-plane"
                className="relative aspect-[2/3] pointer-events-none"
                style={{ width: coordinatePlaneWidth }}
            >
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
                    />
                ))}
                {isMobile && mobileLabelPlacements.map(placement => (
                    <MobileResonanceLabel
                        key={placement.id}
                        placement={placement}
                    />
                ))}
            </div>
        </div>
    );
};
