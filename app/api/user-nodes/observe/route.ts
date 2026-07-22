import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'user-nodes.json');

const readUserNodes = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return [];
        }
        const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        return [];
    }
};

const writeUserNodes = (nodes: any) => {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify(nodes, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing user nodes:', error);
    }
};

export async function POST(request: Request) {
    try {
        const { nodeId, observerId } = await request.json();
        const nodes = readUserNodes();
        
        let targetNode = nodes.find((n: any) => n.id === nodeId);
        
        if (!targetNode) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 });
        }

        // Prevent owner from observing their own node (they already are the creator)
        // Also prevent re-observing
        if (targetNode.ownerId !== observerId && !targetNode.observers?.includes(observerId)) {
            targetNode.observers = [...(targetNode.observers || []), observerId];
            
            // If it was observable, it now materializes because it was observed by another
            if (targetNode.state === 'observable') {
                targetNode.state = 'materialized';
            }
        }

        const updated = nodes.map((n: any) => n.id === targetNode.id ? targetNode : n);
        writeUserNodes(updated);
        
        return NextResponse.json(targetNode);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to observe node' }, { status: 500 });
    }
}
