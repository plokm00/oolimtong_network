import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'gateways.json');

// Helper to read gateways
const readGateways = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return [];
        }
        const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading gateways:', error);
        return [];
    }
};

// Helper to write gateways
const writeGateways = (gateways: any) => {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify(gateways, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing gateways:', error);
    }
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const gateways = readGateways();

    if (id) {
        // Return full detail for specific ID
        const gateway = gateways.find((g: any) => g.id === id);
        if (!gateway) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json(gateway);
    }

    // Default: Return summary list without heavy imageUrl
    const summary = gateways.map(({ imageUrl, ...rest }: any) => rest);
    return NextResponse.json(summary);
}

export async function POST(request: Request) {
    try {
        const newGateway = await request.json();
        const gateways = readGateways();
        const updated = [newGateway, ...gateways];
        writeGateways(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to add gateway' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const { id, fields } = await request.json();
        const gateways = readGateways();
        const updated = gateways.map((g: any) => g.id === id ? { ...g, ...fields } : g);
        writeGateways(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update gateway' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const gateways = readGateways();
        const updated = gateways.filter((g: any) => g.id !== id);
        writeGateways(updated);
        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete gateway' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const { id, participationInc = 0, syncInc = 0 } = await request.json();
        const gateways = readGateways();
        let updatedGateway = null;

        const updated = gateways.map((g: any) => {
            if (g.id === id) {
                updatedGateway = {
                    ...g,
                    participation: Math.min(100, (g.participation || 0) + participationInc),
                    sync: Math.min(100, (g.sync || 0) + syncInc)
                };
                return updatedGateway;
            }
            return g;
        });

        if (!updatedGateway) {
            return NextResponse.json({ error: 'Gateway not found' }, { status: 404 });
        }

        writeGateways(updated);
        return NextResponse.json(updatedGateway);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to patch gateway' }, { status: 500 });
    }
}
