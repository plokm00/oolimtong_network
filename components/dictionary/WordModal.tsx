"use client";

import { useEffect, useState } from 'react';
import { WordEntry } from '@/lib/dictionary-data';
import { X } from 'lucide-react';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/scroll-lock';
import FormattedWord from './FormattedWord';

interface WordModalProps {
    word: WordEntry | null;
    onClose: () => void;
}

export default function WordModal({ word, onClose }: WordModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (!word) {
            setIsVisible(false);
            return;
        }

        setIsVisible(true);
        lockBodyScroll();
        return unlockBodyScroll;
    }, [word]);

    if (!word) return null;

    const markMeanings: Record<string, string> = {
        '●': '차용어',
        '○': '순수어',
        '◉': '합성어',
    };
    const marks = Array.from(word.wordMarks || '');
    const markDescription = marks.length === 2
        ? `도시: ${markMeanings[marks[0]] || '미분류'}, 장인: ${markMeanings[marks[1]] || '미분류'}`
        : marks.map(mark => markMeanings[mark] || '미분류').join(', ');
    const sourceLabel = word.sourceLabel || '';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-frame" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="modal-close modal-close-outside"
                    onClick={onClose}
                    aria-label="용어 상세 닫기"
                >
                    <X size={24} />
                </button>

                <div className="modal-content">
                    <p className="word-detail-category">{word.category}</p>
                    <h1 className="word-detail-title">
                        <FormattedWord word={word.word} />
                    </h1>
                    <h2
                        className="word-detail-title-en"
                        aria-hidden={!word.wordEn}
                    >
                        {word.wordEn || '\u00A0'}
                    </h2>
                    <div className="word-detail-index">
                        <span>#{word.indexNumber}</span>
                        {marks.length > 0 ? (
                            <span
                                className="word-type-marks"
                                aria-label={markDescription}
                                title={markDescription}
                            >
                                {marks.join('')}
                            </span>
                        ) : (
                            <span className="word-type-unclassified">미분류</span>
                        )}
                    </div>

                    <p className="word-detail-description">
                        {sourceLabel && (
                            <span
                                className="word-source-label"
                                aria-label={`원문 표기: ${sourceLabel}`}
                            >
                                {sourceLabel}
                            </span>
                        )}
                        {word.description}
                    </p>

                    {((word.visualBlocks && word.visualBlocks.length > 0) || word.imagePrompt) && (
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
                    )}
                </div>
            </div>
        </div>
    );
}
