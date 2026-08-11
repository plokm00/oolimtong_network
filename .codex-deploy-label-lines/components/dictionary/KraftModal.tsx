"use client";

import { useEffect, useState } from 'react';
import { WordEntry, VisualBlock } from '@/lib/dictionary-data';
import { X } from 'lucide-react';

interface KraftModalProps {
    block: { block: VisualBlock; word: string } | null;
    onClose: () => void;
}

export default function KraftModal({ block, onClose }: KraftModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (block) {
            setIsVisible(true);
            document.body.style.overflow = 'hidden';
        } else {
            setIsVisible(false);
            document.body.style.overflow = 'auto';
        }
    }, [block]);

    if (!block) return null;

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                <button className="modal-close" onClick={onClose} style={{ top: '1rem', right: '1rem' }}>
                    <X size={24} />
                </button>

                <div style={{ width: '100%', maxHeight: '70vh', background: '#000', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>
                    {block.block.type === 'video' ? (
                        <div className="gallery-video-wrapper">
                            <iframe
                                src={block.block.url}
                                allowFullScreen
                            />
                        </div>
                    ) : (
                        <img src={block.block.url} alt="" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }} />
                    )}
                </div>

                <div style={{ padding: '0.5rem 1rem' }}>
                    <span style={{ fontSize: '0.65rem', color: '#8A2BE2', letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: '500' }}>
                        {block.word}
                    </span>
                </div>
            </div>
        </div>
    );
}
