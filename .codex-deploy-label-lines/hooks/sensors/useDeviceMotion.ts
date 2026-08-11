import { useState, useEffect, useCallback } from 'react';

interface MotionData {
    acceleration: DeviceMotionEvent['acceleration']; // x, y, z
    rotationRate: DeviceMotionEvent['rotationRate']; // alpha, beta, gamma
    interval: number;
}

export const useDeviceMotion = () => {
    const [motion, setMotion] = useState<MotionData | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const requestPermission = useCallback(async () => {
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
            try {
                const state = await (DeviceMotionEvent as any).requestPermission();
                if (state === 'granted') {
                    setPermissionGranted(true);
                    return true;
                } else {
                    setError('Permission denied');
                    return false;
                }
            } catch (e: any) {
                setError(e.message);
                return false;
            }
        } else {
            // Non-iOS 13+ devices typically don't need explicit permission prompt
            setPermissionGranted(true);
            return true;
        }
    }, []);

    useEffect(() => {
        if (!permissionGranted) return;

        const handleMotion = (event: DeviceMotionEvent) => {
            setMotion({
                acceleration: event.accelerationIncludingGravity || event.acceleration,
                rotationRate: event.rotationRate,
                interval: event.interval,
            });
        };

        window.addEventListener('devicemotion', handleMotion);
        return () => window.removeEventListener('devicemotion', handleMotion);
    }, [permissionGranted]);

    return { motion, error, permissionGranted, requestPermission };
};
