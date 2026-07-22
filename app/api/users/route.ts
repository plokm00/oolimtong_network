import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'data', 'users.json');

// Helper to read users
const readUsers = () => {
    try {
        if (!fs.existsSync(DATA_PATH)) {
            return [];
        }
        const fileContent = fs.readFileSync(DATA_PATH, 'utf8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
};

// Helper to write users
const writeUsers = (users: any) => {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_PATH, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing users:', error);
    }
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const users = readUsers();

    if (id) {
        const user = users.find((u: any) => u.id === id);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(user);
    }

    const { searchParams: queryParams } = new URL(request.url);
    const nickname = queryParams.get('nickname');
    if (nickname) {
        const user = users.find((u: any) => u.nickname === nickname);
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
        return NextResponse.json(user);
    }

    return NextResponse.json(users);
}

export async function POST(request: Request) {
    try {
        const userData = await request.json(); // { id, nickname, ninnikTitle }
        const users = readUsers();

        // Simple check for duplicate ID
        const exists = users.find((u: any) => u.id === userData.id);
        if (exists) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Strict Check for Duplicate Nickname
        const nicknameTaken = users.find((u: any) => u.nickname === userData.nickname);
        if (nicknameTaken) {
            return NextResponse.json({ error: 'Nickname already taken' }, { status: 409 });
        }

        const newUser = {
            ...userData,
            serial: users.length + 1,
            registeredAt: new Date().toISOString()
        };

        const updated = [...users, newUser];
        writeUsers(updated);
        return NextResponse.json(newUser);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to register user' }, { status: 500 });
    }
}
