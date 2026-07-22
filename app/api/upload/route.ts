import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'user-nodes');

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: 'Invalid file type. Allowed: jpg, png, webp, gif' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'File too large. Max 5MB' }, { status: 400 });
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/user-nodes/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
