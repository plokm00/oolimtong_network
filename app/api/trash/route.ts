import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const TRASH_PATH = path.join(process.cwd(), 'data', 'trash.json');

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
    try {
        if (!fs.existsSync(TRASH_PATH)) {
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(TRASH_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading trash:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const items = await request.json();
        fs.writeFileSync(TRASH_PATH, JSON.stringify(items, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving trash:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
