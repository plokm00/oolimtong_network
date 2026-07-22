import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'user-nodes.json');
const readNodes = () => { try { return fs.existsSync(DATA_PATH) ? JSON.parse(fs.readFileSync(DATA_PATH, 'utf8')) : []; } catch { return []; } };
const writeNodes = (nodes: unknown) => { fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true }); fs.writeFileSync(DATA_PATH, JSON.stringify(nodes, null, 2), 'utf8'); };

export async function POST(request: Request) {
  try {
    const { nodeId, observerId } = await request.json();
    const nodes = readNodes();
    const target = nodes.find((node: any) => node.id === nodeId);
    if (!target) return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    if (target.ownerId !== observerId && !target.observers?.includes(observerId)) {
      target.observers = [...(target.observers || []), observerId];
      if (target.state === 'observable') target.state = 'materialized';
    }
    writeNodes(nodes);
    return NextResponse.json(target);
  } catch { return NextResponse.json({ error: 'Failed to observe node' }, { status: 500 }); }
}
