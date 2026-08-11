import React, { useState } from 'react';
import { WordEntry } from '@/lib/dictionary-data';
import { Pagination } from './Pagination';

interface KraftManagerProps {
    entries: WordEntry[];
    refreshEntries: () => Promise<void>;
}

export const KraftManager: React.FC<KraftManagerProps> = ({ entries, refreshEntries }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 30;

    // Aggregate and Deduplicate by URL
    const assetMap: { [url: string]: { url: string; type: string; words: { id: string, word: string }[]; blocks: { entryId: string, blockId: string, kraftCategory: string }[] } } = {};

    entries.filter(e => e.isKraft).forEach(entry => {
        (entry.visualBlocks || []).forEach(block => {
            if (!assetMap[block.url]) {
                assetMap[block.url] = {
                    url: block.url,
                    type: block.type,
                    words: [],
                    blocks: []
                };
            }
            if (!assetMap[block.url].words.find(w => w.id === entry.id)) {
                assetMap[block.url].words.push({ id: entry.id, word: entry.word });
            }
            assetMap[block.url].blocks.push({ entryId: entry.id, blockId: block.id, kraftCategory: block.kraftCategory || '' });
        });
    });

    const allAssets = Object.values(assetMap);
    const totalPages = Math.ceil(allAssets.length / ITEMS_PER_PAGE);
    const currentAssets = allAssets.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="kraft-manager-view">
            <div className="admin-header-small" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                <h2 style={{ fontWeight: '300', margin: 0 }}>NINNIKKRAFT ({allAssets.length})</h2>
                <button
                    onClick={refreshEntries}
                    className="admin-btn"
                    style={{ width: 'auto', padding: '0.5rem 1rem', background: '#222' }}
                >
                    Refresh Data
                </button>
            </div>

            <div className="kraft-list">
                {currentAssets.map(asset => (
                    <div key={asset.url} className="kraft-item">
                        <div className="kraft-thumbnail">
                            {asset.type === 'video' ? (
                                <iframe src={asset.url} allowFullScreen title="Video preview" />
                            ) : (
                                <img src={asset.url} alt="" />
                            )}
                        </div>

                        <div className="kraft-info">
                            <div className="kraft-words">
                                {asset.words.map(w => (
                                    <span key={w.id} className="kraft-tag">{w.word}</span>
                                ))}
                            </div>
                            <div className="kraft-meta">
                                <div className="kraft-type">{asset.type}</div>
                                <div className="kraft-usage-count">Used in {asset.words.length} entries</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
            />
        </div>
    );
};
