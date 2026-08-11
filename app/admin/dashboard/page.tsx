"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { getDictionaryEntries, WordEntry, updateAdminPassword, getTrashedBlocks, moveWordToTrash, TrashedItem, SERVER_SAVE_FAILED } from '@/lib/dictionary-data';
import { getGateways, GatewayLocation } from '@/lib/gateway-data';
import '../admin.css';

// Import Modularized Managers
import { DictionaryManager } from '@/components/admin/DictionaryManager';
import { KraftManager } from '@/components/admin/KraftManager';
import { GatewayManager } from '@/components/admin/GatewayManager';
import { TrashManager } from '@/components/admin/TrashManager';

export default function AdminDashboard() {
    const router = useRouter();
    const [entries, setEntries] = useState<WordEntry[]>([]);
    const [status, setStatus] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [activeTab, setActiveTab] = useState<'DICTIONARY' | 'KRAFT' | 'GATEWAY' | 'TRASH'>('DICTIONARY');
    const [trashedItems, setTrashedItems] = useState<TrashedItem[]>([]);
    const [gateways, setGateways] = useState<GatewayLocation[]>([]);

    useEffect(() => {
        const auth = localStorage.getItem('admin_auth');
        if (!auth) {
            router.push('/admin');
        } else {
            const loadData = async () => {
                const data = await getDictionaryEntries();
                setEntries(data);
                setTrashedItems(await getTrashedBlocks());
                getGateways().then(setGateways);
            };
            loadData();
        }
    }, [router]);

    const refreshEntries = async () => {
        const data = await getDictionaryEntries();
        setEntries(data);
        setTrashedItems(await getTrashedBlocks());
        const gws = await getGateways();
        setGateways(gws);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Move this entry to Trash? You can restore it later.')) {
            try {
                await moveWordToTrash(id);
                await refreshEntries();
                setStatus('Moved to trash!');
            } catch (error: any) {
                console.error(error);
                const message: string = error?.message ?? '';
                setStatus(message.startsWith(SERVER_SAVE_FAILED)
                    ? `Error: the server rejected the change (${message.split(':')[1]}). The entry was not moved.`
                    : 'Error: failed to move the entry to trash.');
            }
            setTimeout(() => setStatus(''), 3000);
        }
    };

    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;
        updateAdminPassword(newPassword);
        setNewPassword('');
        setStatus('Password updated successfully!');
        setTimeout(() => setStatus(''), 3000);
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_auth');
        router.push('/dictionary');
    };

    return (
        <div className="admin-container">
            <div className="dashboard-container">
                <div className="admin-header">
                    <h1 style={{ fontWeight: '300', letterSpacing: '0.1em' }}>NINNIKLOPEDIA ADMIN</h1>
                    <div className="header-actions">
                        <div className="tab-group">
                            <button
                                onClick={() => setActiveTab('DICTIONARY')}
                                className={`mode-btn ${activeTab === 'DICTIONARY' ? 'active' : ''}`}
                                style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}
                            >
                                DICTIONARY
                            </button>
                            <button
                                onClick={() => setActiveTab('KRAFT')}
                                className={`mode-btn ${activeTab === 'KRAFT' ? 'active' : ''}`}
                                style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}
                            >
                                KRAFT MANAGER
                            </button>
                            <button
                                onClick={() => setActiveTab('GATEWAY')}
                                className={`mode-btn ${activeTab === 'GATEWAY' ? 'active' : ''}`}
                                style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}
                            >
                                GATEWAY
                            </button>
                            <button
                                onClick={() => setActiveTab('TRASH')}
                                className={`mode-btn ${activeTab === 'TRASH' ? 'active' : ''}`}
                                style={{ fontSize: '0.7rem', padding: '0.5rem 1rem' }}
                            >
                                TRASH ({trashedItems.length})
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setStatus('Refreshing data...');
                                refreshEntries().then(() => {
                                    setTimeout(() => setStatus('Data Refreshed'), 500);
                                    setTimeout(() => setStatus(''), 2000);
                                });
                            }}
                            className="category-btn"
                            style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#333' }}
                            title="Refresh Data"
                        >
                            <RefreshCw size={14} />
                        </button>
                        <button onClick={handleLogout} className="category-btn" style={{ padding: '0.5rem 1rem' }}>Logout</button>
                    </div>
                </div>

                {/* Status Message Notification */}
                {status && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        zIndex: 9999,
                        padding: '10px 20px',
                        background: status.includes('Error') || status.includes('failed')
                            ? 'rgba(255, 68, 68, 0.9)'
                            : 'rgba(0, 200, 83, 0.9)',
                        color: 'white',
                        borderRadius: '4px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                    }}>
                        {status}
                    </div>
                )}

                {activeTab === 'DICTIONARY' && (
                    <DictionaryManager
                        entries={entries}
                        refreshEntries={refreshEntries}
                        setStatus={setStatus}
                        handleDelete={handleDelete}
                        handlePasswordChange={handlePasswordChange}
                        newPassword={newPassword}
                        setNewPassword={setNewPassword}
                    />
                )}

                {activeTab === 'KRAFT' && (
                    <KraftManager
                        entries={entries}
                        refreshEntries={refreshEntries}
                    />
                )}

                {activeTab === 'GATEWAY' && (
                    <GatewayManager
                        gateways={gateways}
                        refreshEntries={refreshEntries}
                        setStatus={setStatus}
                    />
                )}

                {activeTab === 'TRASH' && (
                    <TrashManager
                        trashedItems={trashedItems}
                        refreshEntries={refreshEntries}
                        setStatus={setStatus}
                    />
                )}
            </div>
        </div>
    );
}
