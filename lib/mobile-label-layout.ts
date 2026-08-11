export interface MobileLabelAnchor {
    id: string;
    name: string;
    color: 'yellow' | 'blue';
    x: number;
    y: number;
}

export interface MobileLabelPlacement extends MobileLabelAnchor {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

const LABEL_HEIGHT_PX = 9;
const LABEL_EDGE_MARGIN_PX = 2;
const LABEL_COLLISION_MARGIN_PX = 2;
const NODE_CLEARANCE_PX = 5;
const PLACEMENT_GAPS_PX = [7, 12, 17, 22, 27];

type Direction =
    | 'left'
    | 'right'
    | 'top'
    | 'bottom'
    | 'topLeft'
    | 'topRight'
    | 'bottomLeft'
    | 'bottomRight';

interface Point {
    x: number;
    y: number;
}

interface Segment {
    start: Point;
    end: Point;
}

const estimateLabelWidth = (name: string) => {
    const glyphWidth = Array.from(name).reduce(
        (width, character) => width + (character.charCodeAt(0) > 255 ? 7.2 : 4.7),
        0
    );

    return Math.ceil(glyphWidth + 1);
};

const expandRect = (rect: Rect, amount: number): Rect => ({
    left: rect.left - amount,
    top: rect.top - amount,
    right: rect.right + amount,
    bottom: rect.bottom + amount,
});

const intersectionArea = (a: Rect, b: Rect) => {
    const width = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
    const height = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
    return width * height;
};

const closestPointOnRect = (point: Point, rect: Rect): Point => ({
    x: Math.min(Math.max(point.x, rect.left), rect.right),
    y: Math.min(Math.max(point.y, rect.top), rect.bottom),
});

const cross = (a: Point, b: Point, c: Point) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

const pointOnSegment = (point: Point, segment: Segment) =>
    point.x >= Math.min(segment.start.x, segment.end.x) &&
    point.x <= Math.max(segment.start.x, segment.end.x) &&
    point.y >= Math.min(segment.start.y, segment.end.y) &&
    point.y <= Math.max(segment.start.y, segment.end.y);

const segmentsIntersect = (first: Segment, second: Segment) => {
    const a = cross(first.start, first.end, second.start);
    const b = cross(first.start, first.end, second.end);
    const c = cross(second.start, second.end, first.start);
    const d = cross(second.start, second.end, first.end);
    const epsilon = 0.0001;

    if (((a > epsilon && b < -epsilon) || (a < -epsilon && b > epsilon)) &&
        ((c > epsilon && d < -epsilon) || (c < -epsilon && d > epsilon))) {
        return true;
    }

    return (
        (Math.abs(a) <= epsilon && pointOnSegment(second.start, first)) ||
        (Math.abs(b) <= epsilon && pointOnSegment(second.end, first)) ||
        (Math.abs(c) <= epsilon && pointOnSegment(first.start, second)) ||
        (Math.abs(d) <= epsilon && pointOnSegment(first.end, second))
    );
};

const segmentIntersectsRect = (segment: Segment, rect: Rect) => {
    const pointInside = (point: Point) =>
        point.x >= rect.left && point.x <= rect.right &&
        point.y >= rect.top && point.y <= rect.bottom;

    if (pointInside(segment.start) || pointInside(segment.end)) return true;

    const top = { start: { x: rect.left, y: rect.top }, end: { x: rect.right, y: rect.top } };
    const right = { start: { x: rect.right, y: rect.top }, end: { x: rect.right, y: rect.bottom } };
    const bottom = { start: { x: rect.right, y: rect.bottom }, end: { x: rect.left, y: rect.bottom } };
    const left = { start: { x: rect.left, y: rect.bottom }, end: { x: rect.left, y: rect.top } };
    return [top, right, bottom, left].some(edge => segmentsIntersect(segment, edge));
};

const distanceFromPointToSegment = (point: Point, segment: Segment) => {
    const dx = segment.end.x - segment.start.x;
    const dy = segment.end.y - segment.start.y;
    const lengthSquared = dx * dx + dy * dy;
    if (lengthSquared === 0) return Math.hypot(point.x - segment.start.x, point.y - segment.start.y);

    const ratio = Math.min(1, Math.max(0,
        ((point.x - segment.start.x) * dx + (point.y - segment.start.y) * dy) / lengthSquared
    ));
    const closest = { x: segment.start.x + ratio * dx, y: segment.start.y + ratio * dy };
    return Math.hypot(point.x - closest.x, point.y - closest.y);
};

const createLabelRect = (
    anchor: MobileLabelAnchor,
    width: number,
    height: number,
    direction: Direction,
    gap: number
): Rect => {
    switch (direction) {
        case 'left':
            return { left: anchor.x - gap - width, top: anchor.y - height / 2, right: anchor.x - gap, bottom: anchor.y + height / 2 };
        case 'top':
            return { left: anchor.x - width / 2, top: anchor.y - gap - height, right: anchor.x + width / 2, bottom: anchor.y - gap };
        case 'bottom':
            return { left: anchor.x - width / 2, top: anchor.y + gap, right: anchor.x + width / 2, bottom: anchor.y + gap + height };
        case 'topLeft':
            return { left: anchor.x - gap - width, top: anchor.y - gap - height, right: anchor.x - gap, bottom: anchor.y - gap };
        case 'topRight':
            return { left: anchor.x + gap, top: anchor.y - gap - height, right: anchor.x + gap + width, bottom: anchor.y - gap };
        case 'bottomLeft':
            return { left: anchor.x - gap - width, top: anchor.y + gap, right: anchor.x - gap, bottom: anchor.y + gap + height };
        case 'bottomRight':
            return { left: anchor.x + gap, top: anchor.y + gap, right: anchor.x + gap + width, bottom: anchor.y + gap + height };
        default:
            return { left: anchor.x + gap, top: anchor.y - height / 2, right: anchor.x + gap + width, bottom: anchor.y + height / 2 };
    }
};

const preferredDirections = (anchor: MobileLabelAnchor, planeWidth: number): Direction[] => {
    if (anchor.x < planeWidth * 0.25) {
        return ['right', 'topRight', 'bottomRight', 'top', 'bottom', 'left', 'topLeft', 'bottomLeft'];
    }
    if (anchor.x > planeWidth * 0.75) {
        return ['left', 'topLeft', 'bottomLeft', 'top', 'bottom', 'right', 'topRight', 'bottomRight'];
    }
    return anchor.x >= planeWidth * 0.58
        ? ['left', 'topLeft', 'bottomLeft', 'right', 'topRight', 'bottomRight', 'top', 'bottom']
        : ['right', 'topRight', 'bottomRight', 'left', 'topLeft', 'bottomLeft', 'top', 'bottom'];
};

/**
 * Greedily places compact mobile labels around their stars. Each label tries
 * nearby compass points, while avoiding labels, stars, connector lines, and
 * the coordinate-plane edge. Distance is part of the score so names remain as
 * close to their star as the available space permits.
 */
export const layoutMobileLabels = (
    anchors: MobileLabelAnchor[],
    planeSize: { width: number; height: number }
): MobileLabelPlacement[] => {
    if (planeSize.width <= 0 || planeSize.height <= 0) return [];

    const placedRects: Rect[] = [];
    const placedSegments: Segment[] = [];
    const placements = new Map<string, MobileLabelPlacement>();
    const orderedAnchors = [...anchors].sort(
        (a, b) => a.y - b.y || a.x - b.x || a.id.localeCompare(b.id)
    );

    for (const anchor of orderedAnchors) {
        const width = estimateLabelWidth(anchor.name);
        const height = LABEL_HEIGHT_PX;
        const directions = preferredDirections(anchor, planeSize.width);
        let best: { rect: Rect; segment: Segment; score: number } | null = null;

        for (const gap of PLACEMENT_GAPS_PX) {
            for (const [directionIndex, direction] of directions.entries()) {
                const rect = createLabelRect(anchor, width, height, direction, gap);
                const segment = {
                    start: { x: anchor.x, y: anchor.y },
                    end: closestPointOnRect(anchor, rect),
                };
                const overflow =
                    Math.max(0, LABEL_EDGE_MARGIN_PX - rect.left) +
                    Math.max(0, rect.right - planeSize.width + LABEL_EDGE_MARGIN_PX) +
                    Math.max(0, LABEL_EDGE_MARGIN_PX - rect.top) +
                    Math.max(0, rect.bottom - planeSize.height + LABEL_EDGE_MARGIN_PX);

                let score = overflow * 2000;

                for (const placedRect of placedRects) {
                    const overlap = intersectionArea(
                        expandRect(rect, LABEL_COLLISION_MARGIN_PX),
                        placedRect
                    );
                    if (overlap > 0) score += 10000 + overlap * 100;
                    if (segmentIntersectsRect(segment, placedRect)) score += 6000;
                }

                for (const otherAnchor of anchors) {
                    const nodeRect = {
                        left: otherAnchor.x - NODE_CLEARANCE_PX,
                        top: otherAnchor.y - NODE_CLEARANCE_PX,
                        right: otherAnchor.x + NODE_CLEARANCE_PX,
                        bottom: otherAnchor.y + NODE_CLEARANCE_PX,
                    };
                    const overlap = intersectionArea(rect, nodeRect);
                    if (overlap > 0) score += 4000 + overlap * 50;
                    if (
                        otherAnchor.id !== anchor.id &&
                        distanceFromPointToSegment(otherAnchor, segment) < NODE_CLEARANCE_PX
                    ) {
                        score += 2500;
                    }
                }

                for (const placedSegment of placedSegments) {
                    if (segmentsIntersect(segment, placedSegment)) score += 1200;
                }

                score += Math.hypot(
                    segment.end.x - segment.start.x,
                    segment.end.y - segment.start.y
                ) * 0.8;
                score += directionIndex * 0.1;

                if (!best || score < best.score) best = { rect, segment, score };
            }
        }

        if (!best) continue;

        placedRects.push(expandRect(best.rect, LABEL_COLLISION_MARGIN_PX));
        placedSegments.push(best.segment);
        placements.set(anchor.id, {
            ...anchor,
            left: best.rect.left,
            top: best.rect.top,
            width,
            height,
        });
    }

    return anchors.flatMap(anchor => {
        const placement = placements.get(anchor.id);
        return placement ? [placement] : [];
    });
};
