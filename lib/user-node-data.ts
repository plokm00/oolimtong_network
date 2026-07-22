export type QuantumState = 'superposition' | 'observable' | 'materialized';

export interface UserNode {
    id: string; // Unique Node ID
    ownerId: string; // ID of the user who created it
    name?: string; // Star name given by owner
    x: number; // SVG Coordinate X
    y: number; // SVG Coordinate Y
    z: number; // Depth map layer 
    state: QuantumState; // 'superposition' | 'observable' | 'materialized'
    photoUrl?: string; // Uploaded photo
    description?: string; // Text description
    observers: string[]; // IDs of users who have clicked (observed) it
    createdAt: string;
}

const API_URL = '/api/user-nodes';

export const getUserNodes = async (): Promise<UserNode[]> => {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch user nodes');
        return await response.json();
    } catch (e) {
        console.error("Failed to get user nodes", e);
        return [];
    }
};

export const addUserNode = async (node: Omit<UserNode, 'id' | 'createdAt' | 'observers'>): Promise<UserNode[]> => {
    const newNode: UserNode = {
        ...node,
        id: `unode-${Date.now()}`,
        observers: [],
        createdAt: new Date().toISOString()
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newNode)
        });
        if (!response.ok) throw new Error('Failed to add user node');
        return await response.json();
    } catch (e) {
        console.error("Failed to add user node", e);
        return [];
    }
};

export const updateUserNode = async (id: string, fields: Partial<UserNode>): Promise<UserNode[]> => {
    try {
        const response = await fetch(API_URL, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, fields })
        });
        if (!response.ok) throw new Error('Failed to update user node');
        return await response.json();
    } catch (e) {
        console.error("Failed to update user node", e);
        return [];
    }
};

export const observeUserNode = async (nodeId: string, observerId: string): Promise<UserNode | null> => {
    try {
        // Increment observer count or append observerId
        const response = await fetch(`${API_URL}/observe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nodeId, observerId })
        });
        if (!response.ok) throw new Error('Failed to observe user node');
        return await response.json();
    } catch (e) {
        console.error("Failed to observe user node", e);
        return null;
    }
};

export const deleteUserNode = async (id: string): Promise<UserNode[]> => {
    try {
        const response = await fetch(`${API_URL}?id=${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete user node');
        return await response.json();
    } catch (e) {
        console.error("Failed to delete user node", e);
        return [];
    }
};
