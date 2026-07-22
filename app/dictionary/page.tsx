"use client";

import { useState, useEffect, useMemo } from 'react';
import { getDictionaryEntries, WordEntry } from '@/lib/dictionary-data';
import './dictionary.css';
import DictionaryHeader from '@/components/dictionary/DictionaryHeader';
import { DictionaryGrid } from '@/components/dictionary/DictionaryGrid';
import { KraftGrid } from '@/components/dictionary/KraftGrid';
import WordModal from '@/components/dictionary/WordModal';
import KraftModal from '@/components/dictionary/KraftModal';
import GravityScatterOverlay from '@/components/dictionary/GravityScatterOverlay';
import { Play } from 'lucide-react';
import { StarfieldCanvas } from '@/components/StarfieldCanvas';
import { useCallback, useRef } from 'react';


export default function DictionaryPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
    const [selectedKraftBlock, setSelectedKraftBlock] = useState<{ block: any; word: string } | null>(null);
    const [entries, setEntries] = useState<WordEntry[]>([]);
    const [mounted, setMounted] = useState(false);
    const [sortMode, setSortMode] = useState<'ALPHA' | 'REVERSE' | 'RANDOM'>('ALPHA');
    const [shuffleSeed, setShuffleSeed] = useState(0); // 0=ALPHA, 1=REVERSE, 2=RANDOM1, 3=RANDOM2, 4=RANDOM3
    const [mode, setMode] = useState<'PEDIA' | 'KRAFT'>('PEDIA');
    const [lastViewedId, setLastViewedId] = useState<string | null>(null);

    // Starfield Parallax State
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [isMouseActive, setIsMouseActive] = useState(false);
    const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        setMousePos({ x, y });
        setIsMouseActive(true);

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!e.touches[0]) return;
        const touch = e.touches[0];
        const x = touch.clientX / window.innerWidth;
        const y = touch.clientY / window.innerHeight;
        setMousePos({ x, y });
        setIsMouseActive(true);

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800);
    }, []);

    const kraftAssets = useMemo(() => {
        const assetMap: { [url: string]: { url: string; type: string; kraftCategory: string; words: { id: string, word: string, entry: WordEntry }[] } } = {};

        entries.filter(e => e.isKraft).forEach(entry => {
            (entry.visualBlocks || []).forEach(block => {
                if (!assetMap[block.url]) {
                    assetMap[block.url] = {
                        url: block.url,
                        type: block.type,
                        kraftCategory: block.kraftCategory || '',
                        words: []
                    };
                }
                if (!assetMap[block.url].words.find(w => w.id === entry.id)) {
                    assetMap[block.url].words.push({ id: entry.id, word: entry.word, entry });
                }
            });
        });

        return Object.values(assetMap);
    }, [entries]);

    useEffect(() => {
        setMounted(true);
        const load = async () => {
            const data = await getDictionaryEntries();
            setEntries(data);
        };
        load();
    }, []);

    const categories = useMemo(() => {
        if (mode === 'PEDIA') {
            return ['All', "순수어", "기존어", "합성어", "청록전쟁편수록", "천개의문", "생물", "반생물", "지명", "캐릭터"];
        } else {
            return ['All', "전시작품", "울림통프로젝트", "일러스트레이션"];
        }
    }, [mode]);

    const filteredWords = useMemo(() => {
        let base = entries.filter(w => {
            const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase()) ||
                w.description.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = activeCategory === 'All' || w.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        if (sortMode === 'ALPHA') {
            return base.sort((a, b) => a.word.localeCompare(b.word, 'ko'));
        } else if (sortMode === 'REVERSE') {
            return base.sort((a, b) => b.word.localeCompare(a.word, 'ko'));
        } else {
            // Random sorting
            return [...base].sort((a, b) => {
                const hashA = (a.word.length * 13 + a.id.length * 7 + shuffleSeed * 31) % 100;
                const hashB = (b.word.length * 13 + b.id.length * 7 + shuffleSeed * 31) % 100;
                return hashA - hashB;
            });
        }
    }, [search, activeCategory, entries, sortMode, shuffleSeed]);

    if (!mounted) return null;

    return (
        <GravityScatterOverlay onWhipDetected={() => {
            // Cycle: ALPHA (0) -> REVERSE (1) -> RANDOM1 (2) -> RANDOM2 (3) -> RANDOM3 (4)
            const nextSeed = (shuffleSeed + 1) % 5;
            setShuffleSeed(nextSeed);

            if (nextSeed === 0) setSortMode('ALPHA');
            else if (nextSeed === 1) setSortMode('REVERSE');
            else setSortMode('RANDOM');
        }}>
            <div
                className="dictionary-container"
                onMouseMove={handleMouseMove}
                onTouchMove={handleTouchMove}
            >
                <DictionaryHeader
                    mode={mode}
                    setMode={setMode}
                    search={search}
                    setSearch={setSearch}
                    activeCategory={activeCategory}
                    setActiveCategory={setActiveCategory}
                    categories={categories}
                    mousePos={mousePos}
                    isMouseActive={isMouseActive}
                />

                {mode === 'PEDIA' ? (
                    <DictionaryGrid
                        words={filteredWords}
                        lastViewedId={lastViewedId}
                        onSelectWord={(word) => {
                            setSelectedWord(word);
                            setLastViewedId(word.id);
                        }}
                    />
                ) : (
                    <KraftGrid
                        assets={kraftAssets.filter(asset => {
                            const matchesSearch = asset.words.some(w => w.word.toLowerCase().includes(search.toLowerCase()));
                            const matchesCategory = activeCategory === 'All' || asset.kraftCategory === activeCategory;
                            return matchesSearch && matchesCategory;
                        })}
                        lastViewedId={lastViewedId}
                        onSelectBlock={(block, word) => {
                            setSelectedKraftBlock({ block, word });
                        }}
                        onSelectWordLink={(word) => {
                            setSelectedWord(word);
                            setLastViewedId(word.id);
                        }}
                    />
                )}

                <WordModal
                    word={selectedWord}
                    onClose={() => setSelectedWord(null)}
                />

                <KraftModal
                    block={selectedKraftBlock}
                    onClose={() => setSelectedKraftBlock(null)}
                />
            </div>
        </GravityScatterOverlay>
    );
}
