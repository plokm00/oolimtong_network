import { useState, useEffect, useCallback } from 'react';

export const useGyroParallax = (isMobile: boolean) => {
    const [tilt, setTilt] = useState({ x: 0.5, y: 0.5 });
    const [needsPermission, setNeedsPermission] = useState(false);
    const [permissionGranted, setPermissionGranted] = useState(false);

    useEffect(() => {
        if (!isMobile) return;

        // Check for iOS 13+ permission requirement
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            setNeedsPermission(true);
        } else {
            setPermissionGranted(true);
        }
    }, [isMobile]);

    const requestPermission = useCallback(async () => {
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const response = await (DeviceOrientationEvent as any).requestPermission();
                if (response === 'granted') {
                    setPermissionGranted(true);
                    setNeedsPermission(false);
                }
            } catch (error) {
                console.error("Gyro permission failed", error);
            }
        }
    }, []);

    useEffect(() => {
        if (!isMobile || !permissionGranted) return;

        const handleOrientation = (e: DeviceOrientationEvent) => {
            // Gamma: Left/Right tilt (-90 to 90)
            // Beta: Front/Back tilt (-180 to 180)

            const gamma = e.gamma || 0;
            const beta = e.beta || 0;

            // Mapping:
            // X: Gamma. Center at 0. Range +/- 30 degrees maps to full screen?
            // Let's use +/- 45 degrees for smoother range.
            // -45 -> 0, +45 -> 1. 0 -> 0.5.
            let x = (gamma + 45) / 90;

            // Y: Beta. Vertical hold is usually around 45-60 degrees.
            // Let's center at 45 degrees.
            // 0 (flat) -> 45 (hold) -> 90 (upright).
            // Range +/- 45 degrees from center (45). So 0 to 90.
            let y = (beta) / 90;

            // Clamp to 0-1
            x = Math.max(0, Math.min(1, x));
            y = Math.max(0, Math.min(1, y));

            setTilt({ x, y });
        };

        window.addEventListener('deviceorientation', handleOrientation);
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [isMobile, permissionGranted]);

    return { tilt, needsPermission, permissionGranted, requestPermission };
};
