import { useState, useEffect, useRef, useCallback } from 'react';

export interface Point {
    x: number;
    y: number;
    t: number;
}

interface ResonanceGestureConfig {
    /** Callback when a significant gesture (shake, pinch-out, long swipe) is detected */
    onTrigger: () => void;
    /** Callback to draw a visual trace (for swipes/drags) */
    onTrace?: (p1: Point, p2: Point) => void;
    /** Sensitivity thresholds */
    thresholds?: {
        shake?: number;
        pinch?: number;
        mouseSwipe?: number;
        touchSwipe?: number;
        traceMinDistance?: number;
    };
}

const shouldIgnoreGestureTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;

    if (target.closest('[data-resonance-gesture="allow"]')) {
        return false;
    }

    return Boolean(
        target.closest(
            '.modal-overlay, input, textarea, select, button, a, iframe, [contenteditable="true"], [data-resonance-gesture="ignore"]'
        )
    );
};

export const useResonanceGesture = ({
    onTrigger,
    onTrace,
    thresholds = {}
}: ResonanceGestureConfig) => {
    // Default thresholds
    const SHAKE_THRESHOLD = thresholds.shake || 12;
    const PINCH_THRESHOLD = thresholds.pinch || 80;
    const MOUSE_SWIPE_THRESHOLD = thresholds.mouseSwipe || 300;
    const TOUCH_SWIPE_THRESHOLD = thresholds.touchSwipe || 110;
    const TRACE_MIN_DISTANCE = thresholds.traceMinDistance || 10;

    const pointsRef = useRef<Point[]>([]);
    const [needsPermission, setNeedsPermission] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);
    const suppressClickUntilRef = useRef(0);

    // -------------------------------------------------------------------------
    // 1. Shake Detection (DeviceMotion)
    // -------------------------------------------------------------------------
    useEffect(() => {
        // Check if permission is needed (iOS 13+)
        if (typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            setPermissionGranted(true);
        }
    }, []);

    const requestShakePermission = async () => {
        if (typeof DeviceMotionEvent === 'undefined' || typeof (DeviceMotionEvent as any).requestPermission !== 'function') return;
        try {
            const response = await (DeviceMotionEvent as any).requestPermission();
            if (response === 'granted') {
                setPermissionGranted(true);
                setNeedsPermission(false);
            }
        } catch (e) {
            console.error("Permission request failed", e);
        }
    };

    useEffect(() => {
        let lastShake = 0;
        const handleMotion = (e: DeviceMotionEvent) => {
            const acc = e.accelerationIncludingGravity;
            if (!acc) return;

            const delta = Math.abs(acc.x || 0) + Math.abs(acc.y || 0) + Math.abs(acc.z || 0);

            if (delta > SHAKE_THRESHOLD && Date.now() - lastShake > 100) {
                lastShake = Date.now();
                onTrigger();
            }
        };

        if (permissionGranted) {
            window.addEventListener('devicemotion', handleMotion);
        }
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [permissionGranted, onTrigger, SHAKE_THRESHOLD]);

    // -------------------------------------------------------------------------
    // 2. Touch Handlers (Pinch & Swipe)
    // -------------------------------------------------------------------------
    const initialPinchDistanceRef = useRef<number | null>(null);
    const touchStartRef = useRef<Point | null>(null);

    const handleTouchStart = useCallback((e: React.TouchEvent) => {
        if (shouldIgnoreGestureTarget(e.target)) {
            pointsRef.current = [];
            touchStartRef.current = null;
            initialPinchDistanceRef.current = null;
            return;
        }

        if (e.touches.length === 1) {
            const start = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
            pointsRef.current = [start];
            touchStartRef.current = start;
        } else if (e.touches.length === 2) {
            touchStartRef.current = null;
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            initialPinchDistanceRef.current = Math.sqrt(dx * dx + dy * dy);
        }
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (e.touches.length === 1 && pointsRef.current.length > 0) {
            // Single touch: Draw trace
            const p1 = pointsRef.current[pointsRef.current.length - 1];
            const p2 = { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() };
            const dist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));

            if (dist > TRACE_MIN_DISTANCE) {
                if (onTrace) onTrace(p1, p2);
                pointsRef.current.push(p2);
            }
        } else if (e.touches.length === 2 && initialPinchDistanceRef.current !== null) {
            // Dual touch: Detect Pinch Out
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const currentDistance = Math.sqrt(dx * dx + dy * dy);
            const pinchDelta = initialPinchDistanceRef.current - currentDistance;

            if (pinchDelta > PINCH_THRESHOLD) {
                onTrigger();
                initialPinchDistanceRef.current = currentDistance; // Reset to prevent continuous triggering
            }
        }
    }, [onTrace, onTrigger, PINCH_THRESHOLD, TRACE_MIN_DISTANCE]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        const start = touchStartRef.current;
        const end = e.changedTouches[0];
        if (start && end) {
            const dx = end.clientX - start.x;
            const dy = end.clientY - start.y;
            if (
                Math.abs(dx) >= TOUCH_SWIPE_THRESHOLD &&
                Math.abs(dx) > Math.abs(dy) * 1.25
            ) {
                suppressClickUntilRef.current = Date.now() + 700;
                onTrigger();
            }
        }

        touchStartRef.current = null;
        initialPinchDistanceRef.current = null;
        pointsRef.current = [];
    }, [onTrigger, TOUCH_SWIPE_THRESHOLD]);

    // -------------------------------------------------------------------------
    // 3. Mouse Handlers (PC Swipe)
    // -------------------------------------------------------------------------
    const isMouseDownRef = useRef(false);
    const lastMousePosRef = useRef<Point | null>(null);
    const mouseSwipeDistanceRef = useRef(0);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (shouldIgnoreGestureTarget(e.target)) {
            isMouseDownRef.current = false;
            lastMousePosRef.current = null;
            mouseSwipeDistanceRef.current = 0;
            return;
        }

        isMouseDownRef.current = true;
        lastMousePosRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
        mouseSwipeDistanceRef.current = 0;
    }, []);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!isMouseDownRef.current || !lastMousePosRef.current) return;

        const currentPos = { x: e.clientX, y: e.clientY, t: Date.now() };
        const dx = currentPos.x - lastMousePosRef.current.x;
        const dy = currentPos.y - lastMousePosRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        mouseSwipeDistanceRef.current += dist;

        if (dist > TRACE_MIN_DISTANCE) {
            if (onTrace) onTrace(lastMousePosRef.current, currentPos);
            lastMousePosRef.current = currentPos;
        }
    }, [onTrace, TRACE_MIN_DISTANCE]);

    const handleMouseUp = useCallback(() => {
        if (mouseSwipeDistanceRef.current > MOUSE_SWIPE_THRESHOLD) {
            suppressClickUntilRef.current = Date.now() + 350;
            onTrigger();
        }
        isMouseDownRef.current = false;
        lastMousePosRef.current = null;
        mouseSwipeDistanceRef.current = 0;
    }, [onTrigger, MOUSE_SWIPE_THRESHOLD]);

    const handleClickCapture = useCallback((e: React.MouseEvent) => {
        if (Date.now() > suppressClickUntilRef.current) return;

        e.preventDefault();
        e.stopPropagation();
        suppressClickUntilRef.current = 0;
    }, []);

    return {
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onMouseLeave: handleMouseUp,
            onClickCapture: handleClickCapture
        },
        permission: {
            needed: needsPermission,
            granted: permissionGranted,
            request: requestShakePermission
        }
    };
};
