import React from 'react';
import { WordEntry } from '@/lib/dictionary-data';

// Define the asset type locally for now, since it's a derived type for display
export interface KraftAsset {
    url: string;
    type: string;
    kraftCategory: string;
    words: { id: string, word: string, entry: WordEntry }[];
}

interface KraftGridProps {
    assets: KraftAsset[];
    lastViewedId: string | null;
    onSelectBlock: (block: { url: string; type: string }, word: string) => void;
    onSelectWordLink: (word: WordEntry) => void;
}

export const KraftGrid: React.FC<KraftGridProps> = ({ assets, lastViewedId, onSelectBlock, onSelectWordLink }) => {
    return (
        <main className="kraft-grid">
            {assets.map((asset, idx) => (
                <div
                    key={asset.url}
                    className={`kraft-card ${asset.words.some(w => lastViewedId === w.id) ? 'last-viewed' : ''}`}
                    style={{
                        opacity: 0,
                        animation: `fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards ${idx % 50 * 0.01}s`,
                        marginTop: `${(idx % 6) * 20}px`,
                    }}
                >
                    <div className="kraft-thumbnail" onClick={() => {
                        onSelectBlock({ url: asset.url, type: asset.type }, asset.words[0]?.word || '');
                    }}>
                        {asset.type === 'video' ? (
                            <div className="kraft-video-preview">
                                <iframe
                                    src={`${asset.url}?autoplay=0&controls=0&mute=1&loop=1`}
                                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                                    tabIndex={-1}
                                />
                            </div>
                        ) : (
                            <img src={asset.url} alt="" />
                        )}
                    </div>
                    <div className="card-content" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.8rem' }}>
                        {asset.words.sort((a, b) => a.word.localeCompare(b.word, 'ko')).map(w => (
                            <button
                                key={w.id}
                                className="word-link-pill"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onSelectWordLink(w.entry);
                                }}
                            >
                                {w.word}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </main>
    );
};
