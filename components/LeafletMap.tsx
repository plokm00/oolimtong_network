"use client"

import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
const fixLeafletIcon = () => {
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
};

interface LeafletMapProps {
    startPos: { lat: number, lng: number, address: string };
    targetPos: { lat: number, lng: number };
    gatewayName: string;
}

export default function LeafletMap({ startPos, targetPos, gatewayName }: LeafletMapProps) {
    useEffect(() => {
        fixLeafletIcon();
    }, []);

    const center = [(startPos.lat + targetPos.lat) / 2, (startPos.lng + targetPos.lng) / 2] as [number, number];

    return (
        <MapContainer
            center={center}
            zoom={10}
            style={{ height: '100%', width: '100%', background: '#000' }}
            zoomControl={false}
            dragging={true}
            scrollWheelZoom={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <Polyline
                positions={[
                    [startPos.lat, startPos.lng],
                    [targetPos.lat, targetPos.lng]
                ]}
                color="#CCFF00"
                weight={3}
                opacity={0.8}
                dashArray="5, 10"
            />
            <Marker position={[startPos.lat, startPos.lng]}>
                <Popup>START: {startPos.address}</Popup>
            </Marker>
            <Marker position={[targetPos.lat, targetPos.lng]}>
                <Popup>TARGET: {gatewayName}</Popup>
            </Marker>
        </MapContainer>
    );
}
