"use client";

import { useEffect, useState } from 'react';
import { WordEntry } from '@/lib/dictionary-data';
import { X } from 'lucide-react';

interface WordModalProps {
    word: WordEntry | null;
    onClose: () => void;
}

export default function WordModal({ word, onClose }: WordModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (word) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            document.body.style.overflow = 'auto';
        }
    }, [word]);

    if (!word) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={24} />
                </button>

                <span className="word-detail-category">{word.category}</span>
                <h1 className="word-detail-title">
                    {word.word}
                    <span style={{ fontSize: '0.8rem', color: '#333', marginLeft: '0.8rem', verticalAlign: 'middle' }}>#{word.indexNumber}</span>
                </h1>

                <p className="word-detail-description">
                    {word.description}
                </p>

                <div className="word-detail-gallery">
                    {word.visualBlocks && word.visualBlocks.length > 0 ? (
                        word.visualBlocks.map((block) => (
                            <div key={block.id} className="gallery-item">
                                {block.type === 'video' ? (
                                    <div className="gallery-video-wrapper">
                                        <iframe
                                            src={block.url}
                                            allowFullScreen
                                        />
                                    </div>
                                ) : (
                                    <img src={block.url} alt="" className="gallery-img" />
                                )}
                                {block.type === 'gemini' && <div className="gemini-tag">GEMINI GEN</div>}
                            </div>
                        ))
                    ) : (
                        <div className="word-image-placeholder">
                            <div>
                                <p style={{ marginBottom: '1rem' }}>AI Generated Visualisation</p>
                                <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>"{word.imagePrompt}"</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
