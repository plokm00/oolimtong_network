import { GatewayLocation } from "@/lib/gateway-data";
import {
    GATEWAY_REST_RADIUS_PERCENT,
    GOLDEN_ANGLE,
    PARALLAX_DEPTH_MAX,
    PARALLAX_RANGE_PERCENT,
} from "@/lib/constants";

/**
 * Calculates jitter offset for nodes that share the exact same coordinates.
 * This prevents markers from perfectly overlapping.
 * 
 * @param locations Full list of locations
 * @param index Index of the current location being processed
 * @param location Current location object
 * @returns {x: number, y: number} Jittered offset values
 */
export const computeJitter = (
    locations: GatewayLocation[],
    index: number,
    location: GatewayLocation
): { x: number; y: number } => {
    // Find all locations up to the current index that share the same x,y coordinates
    const overlaps = locations.slice(0, index).filter(l => l.x === location.x && l.y === location.y).length;

    // Apply jitter based on the number of overlaps found
    const jitterX = overlaps > 0 ? Math.cos(overlaps * 1.5) * 3 : 0;
    const jitterY = overlaps > 0 ? Math.sin(overlaps * 1.5) * 3 : 0;

    return { x: jitterX, y: jitterY };
};

/**
 * Calculates a scale-independent parallax offset in coordinate-plane percent.
 * 
 * @param interactionPos current normalized interaction position {x: 0..1, y: 0..1}
 * @param depth depth factor of the node
 * @returns percentage offset for the shared coordinate plane
 */
export const computeParallaxOffsetPercent = (
    interactionPos: { x: number; y: number },
    depth: number
): { x: number; y: number } => {
    const boundedDepth = Math.min(Math.max(depth, 0), PARALLAX_DEPTH_MAX);

    return {
        x: (interactionPos.x - 0.5) * boundedDepth * PARALLAX_RANGE_PERCENT,
        y: (interactionPos.y - 0.5) * boundedDepth * PARALLAX_RANGE_PERCENT,
    };
};

export const computeGatewayRestOffsetPercent = (
    index: number
): { x: number; y: number } => ({
    x: Math.cos(index * GOLDEN_ANGLE) * GATEWAY_REST_RADIUS_PERCENT,
    y: Math.sin(index * GOLDEN_ANGLE) * GATEWAY_REST_RADIUS_PERCENT,
});
