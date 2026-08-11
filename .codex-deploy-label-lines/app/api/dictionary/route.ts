import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'dictionary.json');
export async function GET() { try { return NextResponse.json(fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) : []); } catch { return NextResponse.json({ error: 'Failed to read data' }, { status: 500 }); } }
export async function POST(request: Request) { try { const entries = await request.json(); fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(entries, null, 2)); return NextResponse.json({ success: true }); } catch { return NextResponse.json({ error: 'Failed to save data' }, { status: 500 }); } }
