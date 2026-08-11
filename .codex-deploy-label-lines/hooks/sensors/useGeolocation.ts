import { useState, useEffect, useCallback } from 'react';

interface Coordinates {
    latitude: number;
    longitude: number;
}

interface GeolocationState {
    coords: Coordinates | null;
    error: string | null;
    isLoaded: boolean;
}

// Haversine formula to calculate distance in meters
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) *
        Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

export const useGeolocation = (target?: Coordinates) => {
    const [state, setState] = useState<GeolocationState>({
        coords: null,
        error: null,
        isLoaded: false
    });
    const [elevation, setElevation] = useState<number | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(prev => ({ ...prev, error: "Geolocation not supported", isLoaded: true }));
            return;
        }

        const success = (position: GeolocationPosition) => {
            const { latitude, longitude, altitude } = position.coords;
            const currentCoords = { latitude, longitude };

            setState({
                coords: currentCoords,
                error: null,
                isLoaded: true
            });
            setElevation(altitude);

            if (target) {
                const dist = calculateDistance(latitude, longitude, target.latitude, target.longitude);
                setDistanceToTarget(dist);
            }
        };

        const error = (err: GeolocationPositionError) => {
            if (err.code === 3) {
                console.warn('useGeolocation: Timeout expired. The device is taking longer than expected to acquire a signal.');
            } else {
                console.error('useGeolocation error:', err.code, err.message, err);
            }
            setState(prev => ({ ...prev, error: err.message || "Unknown GPS Error", isLoaded: true }));
        };

        const options = {
            enableHighAccuracy: true,
            timeout: 20000,
            maximumAge: 10000
        };

        const id = navigator.geolocation.watchPosition(success, error, options);
        return () => navigator.geolocation.clearWatch(id);
    }, [target?.latitude, target?.longitude]);

    return { ...state, elevation, distanceToTarget };
};
