import React from 'react';
import { TrashedItem, restoreFromTrash, permanentlyDeleteFromTrash, SERVER_SAVE_FAILED } from '@/lib/dictionary-data';
import { Trash2, RotateCcw } from 'lucide-react';

interface TrashManagerProps {
    trashedItems: TrashedItem[];
    refreshEntries: () => Promise<void>;
    setStatus: (status: string) => void;
}

import { Pagination } from './Pagination';
import { useState } from 'react';

export const TrashManager: React.FC<TrashManagerProps> = ({ trashedItems, refreshEntries, setStatus }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 30;

    const totalPages = Math.ceil(trashedItems.length / ITEMS_PER_PAGE);
    const currentTrashedItems = trashedItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const reportFailure = (error: any, fallback: string) => {
        console.error(error);
        const message: string = error?.message ?? '';
        setStatus(message.startsWith(SERVER_SAVE_FAILED)
            ? `Error: the server rejected the change (${message.split(':')[1]}). Nothing changed.`
            : fallback);
    };

    const handleRestore = async (item: TrashedItem) => {
        try {
            await restoreFromTrash(item.trashId);
            await refreshEntries();
            setStatus('Item restored successfully.');
        } catch (error: any) {
            reportFailure(error, 'Error: failed to restore the item.');
        }
        setTimeout(() => setStatus(''), 3000);
    };

    const handlePermanentDelete = async (item: TrashedItem) => {
        if (confirm('Are you sure you want to permanently delete this item? This cannot be undone.')) {
            try {
                await permanentlyDeleteFromTrash(item.trashId);
                await refreshEntries();
                setStatus('Item permanently deleted.');
            } catch (error: any) {
                reportFailure(error, 'Error: failed to delete the item.');
            }
            setTimeout(() => setStatus(''), 3000);
        }
    };

    return (
        <div className="trash-manager-view">
            <h2 style={{ fontWeight: '300', marginBottom: '1.5rem', fontSize: '1rem', color: '#aaa' }}>
                RECYCLE BIN ({trashedItems.length})
            </h2>

            {trashedItems.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', color: '#444', border: '1px dashed #333' }}>
                    <Trash2 size={32} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>Trash is empty.</p>
                </div>
            ) : (
                <>
                    <div style={{ background: '#111', borderTop: '1px solid #222' }}>
                        {currentTrashedItems.map(item => (
                            <div key={item.trashId} className="dictionary-list-item" style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '1rem',
                                borderBottom: '1px solid #222'
                            }}>
                                <div>
                                    <span style={{
                                        display: 'inline-block',
                                        padding: '2px 6px',
                                        fontSize: '0.6rem',
                                        background: item.type === 'word' ? '#2c3e50' : '#c0392b',
                                        color: '#fff',
                                        marginRight: '10px',
                                        borderRadius: '3px'
                                    }}>
                                        {item.type.toUpperCase()}
                                    </span>
                                    <span style={{ fontWeight: '500', color: '#ccc' }}>
                                        {item.originalWord || 'Unknown Item'}
                                    </span>
                                    <span style={{ marginLeft: '1rem', fontSize: '0.75rem', color: '#555' }}>
                                        Deleted: {new Date(item.trashedAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button
                                        onClick={() => handleRestore(item)}
                                        title="Restore"
                                        style={{ background: 'transparent', border: 'none', color: '#27ae60', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                                    >
                                        <RotateCcw size={16} /> Restore
                                    </button>
                                    <button
                                        onClick={() => handlePermanentDelete(item)}
                                        title="Delete Permanently"
                                        style={{ background: 'transparent', border: 'none', color: '#c0392b', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </>
            )}
        </div>
    );
};
