import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'gateways.json');
const readGateways = () => { try { return fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) : []; } catch { return []; } };
const writeGateways = (gateways: unknown) => { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(gateways, null, 2), 'utf8'); };

export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get('id');
  const gateways = readGateways();
  if (id) { const gateway = gateways.find((item: any) => item.id === id); return gateway ? NextResponse.json(gateway) : NextResponse.json({ error: 'Not found' }, { status: 404 }); }
  return NextResponse.json(gateways.map(({ imageUrl, ...gateway }: any) => gateway));
}
export async function POST(request: Request) { try { const gateway = await request.json(); const gateways = [gateway, ...readGateways()]; writeGateways(gateways); return NextResponse.json(gateways); } catch { return NextResponse.json({ error: 'Failed to add gateway' }, { status: 500 }); } }
export async function PUT(request: Request) { try { const { id, fields } = await request.json(); const gateways = readGateways().map((gateway: any) => gateway.id === id ? { ...gateway, ...fields } : gateway); writeGateways(gateways); return NextResponse.json(gateways); } catch { return NextResponse.json({ error: 'Failed to update gateway' }, { status: 500 }); } }
export async function DELETE(request: Request) { try { const id = new URL(request.url).searchParams.get('id'); if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 }); const gateways = readGateways().filter((gateway: any) => gateway.id !== id); writeGateways(gateways); return NextResponse.json(gateways); } catch { return NextResponse.json({ error: 'Failed to delete gateway' }, { status: 500 }); } }
export async function PATCH(request: Request) { try { const { id, participationInc = 0, syncInc = 0 } = await request.json(); let updatedGateway: any = null; const gateways = readGateways().map((gateway: any) => { if (gateway.id !== id) return gateway; updatedGateway = { ...gateway, participation: Math.min(100, (gateway.participation || 0) + participationInc), sync: Math.min(100, (gateway.sync || 0) + syncInc) }; return updatedGateway; }); if (!updatedGateway) return NextResponse.json({ error: 'Gateway not found' }, { status: 404 }); writeGateways(gateways); return NextResponse.json(updatedGateway); } catch { return NextResponse.json({ error: 'Failed to patch gateway' }, { status: 500 }); } }
