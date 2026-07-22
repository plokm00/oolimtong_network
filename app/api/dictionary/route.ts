import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'dictionary.json');

// Ensure data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export async function GET() {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return NextResponse.json([]);
        }
        const data = fs.readFileSync(DATA_PATH, 'utf-8');
        return NextResponse.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading dictionary:', error);
        return NextResponse.json({ error: 'Failed to read data' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const entries = await request.json();
        fs.writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2));
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error saving dictionary:', error);
        return NextResponse.json({ error: 'Failed to save data' }, { status: 500 });
    }
}
