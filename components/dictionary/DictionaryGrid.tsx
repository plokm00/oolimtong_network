import React from 'react';
import { WordEntry } from '@/lib/dictionary-data';
import { Play } from 'lucide-react';

interface DictionaryGridProps {
    words: WordEntry[];
    lastViewedId: string | null;
    onSelectWord: (word: WordEntry) => void;
}

export const DictionaryGrid: React.FC<DictionaryGridProps> = ({ words, lastViewedId, onSelectWord }) => {
    return (
        <main className="word-grid">
            {words.map((word, idx) => (
                <div
                    key={word.id}
                    className={`word-card ${lastViewedId === word.id ? 'last-viewed' : ''}`}
                    style={{
                        marginTop: `${(idx % 5) * 10}px`,
                        opacity: 0,
                        animation: `fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards ${idx % 50 * 0.01}s`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '1.2rem'
                    }}
                    onClick={() => onSelectWord(word)}
                >
                    <div style={{ flex: 1 }} className="card-content">
                        <span className="word-text">{word.word}</span>
                        <span className="category-tag">{word.category}</span>
                    </div>
                    {word.visualBlocks && word.visualBlocks.length > 0 && (
                        <div className="word-thumbnail" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111', position: 'relative' }}>
                            {word.visualBlocks[0].type === 'video' ? (
                                <>
                                    <Play size={10} color="white" style={{ zIndex: 2, opacity: 0.8 }} />
                                    {/* Video Thumbnail Logic */}
                                    {word.visualBlocks[0].url.includes('youtube.com/embed/') && (
                                        <img
                                            src={`https://img.youtube.com/vi/${word.visualBlocks[0].url.split('embed/')[1].split('?')[0]}/0.jpg`}
                                            alt=""
                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5 }}
                                        />
                                    )}
                                </>
                            ) : (
                                <img
                                    src={word.visualBlocks[0].url}
                                    alt=""
                                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                />
                            )}
                        </div>
                    )}
                </div>
            ))}
        </main>
    );
};
