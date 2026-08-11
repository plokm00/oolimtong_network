"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAdminPassword } from '@/lib/dictionary-data';
import './admin.css';

export default function AdminLoginPage() {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const currentPw = getAdminPassword();
        if (id === 'admin' && pw === currentPw) {
            // Small simulation of auth
            localStorage.setItem('admin_auth', 'true');
            router.push('/admin/dashboard');
        } else {
            setError('Invalid credentials. Please try again.');
        }
    };

    return (
        <div className="admin-login-container">
            <div className="login-card">
                <h1 style={{ marginBottom: '2rem', textAlign: 'center', fontWeight: '300' }}>ADMIN ACCESS</h1>
                <form onSubmit={handleLogin}>
                    <input
                        type="text"
                        className="admin-input"
                        placeholder="Admin ID"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />
                    <input
                        type="password"
                        className="admin-input"
                        placeholder="Password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                    />
                    {error && <p style={{ color: '#ff4444', marginBottom: '1rem', fontSize: '0.8rem' }}>{error}</p>}
                    <button type="submit" className="admin-btn">LOGIN</button>
                </form>
                <p style={{ marginTop: '2rem', fontSize: '0.7rem', color: '#444', textAlign: 'center' }}>
                    Restricted access. Authorized personnel only.
                </p>
            </div>
        </div>
    );
}
