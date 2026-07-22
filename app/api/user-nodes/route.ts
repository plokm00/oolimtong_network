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
        console.error('Error reading user nodes:', error);
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

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const nodes = readUserNodes();

    if (id) {
        const node = nodes.find((n: any) => n.id === id);
        if (!node) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(node);
    }

    // Default: Return all nodes (we can filter on client side based on viewer/owner and state)
    return NextResponse.json(nodes);
}

export async function POST(request: Request) {
    try {
        const newNode = await request.json();
        const nodes = readUserNodes();
        const updated = [newNode, ...nodes];
        writeUserNodes(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add user node' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, fields } = await request.json();
        const nodes = readUserNodes();
        const updated = nodes.map((n: any) => n.id === id ? { ...n, ...fields } : n);
        writeUserNodes(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update user node' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const nodes = readUserNodes();
        const updated = nodes.filter((n: any) => n.id !== id);
        writeUserNodes(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete user node' }, { status: 500 });
    }
}
