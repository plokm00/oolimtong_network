import { GatewayLocation } from "@/lib/gateway-data";

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
 * Calculates the parallax movement transform based on mouse position and depth (z).
 * 
 * @param mousePos current normalized mouse position {x: 0..1, y: 0..1}
 * @param z depth factor of the node
 * @param intensity multiplier for the parallax effect
 * @returns CSS transform string for translate
 */
export const computeParallaxTransform = (
    mousePos: { x: number; y: number },
    z: number,
    intensity: number = 40
): string => {
    const x = mousePos.x * z * intensity;
    const y = mousePos.y * z * intensity;
    return `translate(-50%, -50%) translate(${x}px, ${y}px)`;
};
