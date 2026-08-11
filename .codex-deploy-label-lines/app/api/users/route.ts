import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'users.json');

const readUsers = () => {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
  } catch (error) {
    console.error('Error reading users:', error);
    return [];
  }
};

const writeUsers = (users: unknown) => {
  try {
    fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
    fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing users:', error);
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const nickname = searchParams.get('nickname');
  const users = readUsers();
  const user = id ? users.find((item: any) => item.id === id) : nickname ? users.find((item: any) => item.nickname === nickname) : null;
  if (id || nickname) return user ? NextResponse.json(user) : NextResponse.json({ error: 'User not found' }, { status: 404 });
  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    const userData = await request.json();
    const users = readUsers();
    if (users.some((user: any) => user.id === userData.id)) return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    if (users.some((user: any) => user.nickname === userData.nickname)) return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 });
    const newUser = { ...userData, serial: users.length + 1, registeredAt: new Date().toISOString() };
    writeUsers([...users, newUser]);
    return NextResponse.json(newUser);
  } catch {
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
  }
}
