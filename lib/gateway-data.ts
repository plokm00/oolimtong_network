export interface GatewayLocation {
    id: string;
    name: string;
    x: number;      // SVG Coordinate X (0-100 or mapped)
    y: number;      // SVG Coordinate Y (0-100 or mapped)
    z: number;      // Parallax Depth (0-1)
    desc: string;
    address: string;
    lat: number;
    lng: number;
    participation: number; // 0-100
    sync: number;          // 0-100
    mainstream: number;    // 0-100
    imageUrl?: string;     // Base64 or URL
    region?: string;       // Regional category
    gatewayNumber?: string; // Manual unique number (e.g. "001")
    createdAt: string;
}

const API_URL = '/api/gateways';
import { GATEWAY_CACHE_TTL_MS } from './constants';

// Module-level list cache — avoids redundant fetches on re-mount / fast navigation
let _listCache: { data: GatewayLocation[]; ts: number } | null = null;

// Module-level detail cache — avoids re-fetching the same gateway on every click
const _detailCache = new Map<string, { data: GatewayLocation; ts: number }>();

/** Call after any mutation (add/update/delete/increment) so next read is fresh */
export const invalidateGatewayCache = () => {
    _listCache = null;
    _detailCache.clear();
};

export const getGateways = async (): Promise<GatewayLocation[]> => {
    if (_listCache && Date.now() - _listCache.ts < GATEWAY_CACHE_TTL_MS) {
        return _listCache.data;
    }
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch gateways');
        // This returns summary (without imageUrl)
        const data: GatewayLocation[] = await response.json();
        _listCache = { data, ts: Date.now() };
        return data;
    } catch (e) {
        console.error("Failed to get gateways", e);
        return _listCache?.data ?? []; // return stale data rather than empty on transient error
    }
};

export const getGatewayDetail = async (id: string): Promise<GatewayLocation | null> => {
    // Return cached detail if fresh
    const cached = _detailCache.get(id);
    if (cached && Date.now() - cached.ts < GATEWAY_CACHE_TTL_MS) {
        return cached.data;
    }
    try {
        const response = await fetch(`${API_URL}?id=${id}`);
        if (!response.ok) throw new Error('Failed to fetch gateway detail');
        const data: GatewayLocation = await response.json();
        _detailCache.set(id, { data, ts: Date.now() });
        return data;
    } catch (e) {
        console.error("Failed to get gateway detail", e);
        return cached?.data ?? null; // return stale data on error
    }
};

export const addGateway = async (gateway: Omit<GatewayLocation, 'id' | 'createdAt'>): Promise<GatewayLocation[]> => {
    const newGateway: GatewayLocation = {
        ...gateway,
        id: `gateway-${Date.now()}`,
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGateway)
        });
        if (!response.ok) throw new Error('Failed to add gateway');
        invalidateGatewayCache();
        return await response.json();
    } catch (e) {
        console.error("Failed to add gateway", e);
        return [];
    }
};

export const updateGateway = async (id: string, fields: Partial<GatewayLocation>): Promise<GatewayLocation[]> => {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, fields })
        });
        if (!response.ok) throw new Error('Failed to update gateway');
        invalidateGatewayCache();
        return await response.json();
    } catch (e) {
        console.error("Failed to update gateway", e);
        return [];
    }
};

export const deleteGateway = async (id: string): Promise<GatewayLocation[]> => {
    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete gateway');
        invalidateGatewayCache();
        return await response.json();
    } catch (e) {
        console.error("Failed to delete gateway", e);
        return [];
    }
};

export const incrementResonance = async (id: string, participationInc: number, syncInc: number): Promise<GatewayLocation | null> => {
    try {
        const response = await fetch(API_URL, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, participationInc, syncInc })
        });
        if (!response.ok) throw new Error('Failed to increment resonance');
        invalidateGatewayCache();
        return await response.json();
    } catch (e) {
        console.error("Failed to increment resonance", e);
        return null;
    }
};

