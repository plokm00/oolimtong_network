import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'user-nodes.json');
const readNodes = () => { try { return fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) : []; } catch { return []; } };
const writeNodes = (nodes: unknown) => { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(nodes, null, 2), 'utf8'); };

export async function GET(request: Request) { const id = new URL(request.url).searchParams.get('id'); const nodes = readNodes(); if (id) { const node = nodes.find((item: any) => item.id === id); return node ? NextResponse.json(node) : NextResponse.json({ error: 'Not found' }, { status: 404 }); } return NextResponse.json(nodes); }
export async function POST(request: Request) { try { const node = await request.json(); const nodes = [node, ...readNodes()]; writeNodes(nodes); return NextResponse.json(nodes); } catch { return NextResponse.json({ error: 'Failed to add user node' }, { status: 500 }); } }
export async function PUT(request: Request) { try { const { id, fields } = await request.json(); const nodes = readNodes().map((node: any) => node.id === id ? { ...node, ...fields } : node); writeNodes(nodes); return NextResponse.json(nodes); } catch { return NextResponse.json({ error: 'Failed to update user node' }, { status: 500 }); } }
export async function DELETE(request: Request) { try { const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 }); const nodes = readNodes().filter((node: any) => node.id !== id); writeNodes(nodes); return NextResponse.json(nodes); } catch { return NextResponse.json({ error: 'Failed to delete user node' }, { status: 500 }); } }
