"use client";

import { useState, useEffect, useMemo } from 'react';
import { getDictionaryEntries, WordEntry } from '@/lib/dictionary-data';
import { ARTWORKS, EXHIBITIONS, ArtworkEntry } from '@/lib/artwork-data';
import './dictionary.css';
import DictionaryHeader from '@/components/dictionary/DictionaryHeader';
import {
    DictionaryBodyView,
    DictionaryGrid,
} from '@/components/dictionary/DictionaryGrid';
import WordModal from '@/components/dictionary/WordModal';
import { ArtworkArchiveGrid } from '@/components/dictionary/ArtworkArchiveGrid';
import ArtworkArchiveModal from '@/components/dictionary/ArtworkArchiveModal';
import ArtworkExhibitionFilter from '@/components/dictionary/ArtworkExhibitionFilter';
import DictionaryNovelFilter from '@/components/dictionary/DictionaryNovelFilter';
import WordTypeTip from '@/components/dictionary/WordTypeTip';
import DictionaryInitialIndex from '@/components/dictionary/DictionaryInitialIndex';
import GravityScatterOverlay from '@/components/dictionary/GravityScatterOverlay';
import { getHangulInitial, HangulInitial } from '@/lib/hangul-initial';
import { useCallback, useRef } from 'react';

export default function DictionaryPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('전체');
    const [selectedWord, setSelectedWord] = useState<WordEntry | null>(null);
    const [selectedArtwork, setSelectedArtwork] = useState<ArtworkEntry | null>(null);
    const modalOpenRef = useRef(false);
    const modalHistoryPushedRef = useRef(false);
    const [entries, setEntries] = useState<WordEntry[]>([]);
    const [mounted, setMounted] = useState(false);
    const [mode, setMode] = useState<'PEDIA' | 'KRAFT'>('PEDIA');
    const [pediaBodyView, setPediaBodyView] = useState<DictionaryBodyView>('list');
    const [pediaNodeShuffleSeed, setPediaNodeShuffleSeed] = useState(0);
    const [lastViewedId, setLastViewedId] = useState<string | null>(null);
    const [viewedArtworkIds, setViewedArtworkIds] = useState<Set<string>>(
        () => new Set(),
    );
    const [exhibitionId, setExhibitionId] = useState('전체');
    const [novelFilter, setNovelFilter] = useState('전체');
    const [artworkShuffleSeed, setArtworkShuffleSeed] = useState(0);
    const [artworksShuffled, setArtworksShuffled] = useState(false);

    // Starfield Parallax State
    const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
    const [isMouseActive, setIsMouseActive] = useState(false);
    const mouseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if ((e.target as Element).closest('.modal-overlay')) return;

        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        setMousePos({ x, y });
        setIsMouseActive(true);

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800);
    }, []);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if ((e.target as Element).closest('.modal-overlay')) return;
        if (!e.touches[0]) return;
        const touch = e.touches[0];
        const x = touch.clientX / window.innerWidth;
        const y = touch.clientY / window.innerHeight;
        setMousePos({ x, y });
        setIsMouseActive(true);

        if (mouseTimeoutRef.current) clearTimeout(mouseTimeoutRef.current);
        mouseTimeoutRef.current = setTimeout(() => setIsMouseActive(false), 800);
    }, []);

    useEffect(() => {
        const restoreModeFromAddress = () => {
            const view = new URLSearchParams(window.location.search).get('view');
            setMode(view === 'kraft' ? 'KRAFT' : 'PEDIA');
        };

        const handlePopState = () => {
            if (modalOpenRef.current) {
                modalOpenRef.current = false;
                modalHistoryPushedRef.current = false;
                setSelectedWord(null);
                setSelectedArtwork(null);
                return;
            }

            restoreModeFromAddress();
        };

        restoreModeFromAddress();
        setMounted(true);

        const load = async () => {
            const data = await getDictionaryEntries();
            setEntries(data);
        };
        load();

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, []);

    useEffect(() => {
        if (!mounted) return;

        const nextAddress = new URL(window.location.href);
        if (mode === 'KRAFT') {
            nextAddress.searchParams.set('view', 'kraft');
        } else {
            nextAddress.searchParams.delete('view');
        }

        window.history.replaceState(
            window.history.state,
            '',
            `${nextAddress.pathname}${nextAddress.search}${nextAddress.hash}`,
        );
    }, [mode, mounted]);

    useEffect(() => {
        setActiveCategory('전체');
        if (mode === 'PEDIA') {
            setNovelFilter('전체');
        } else {
            setExhibitionId('전체');
            setArtworksShuffled(false);
        }
    }, [mode]);

    const categories = useMemo(() => {
        if (mode === 'PEDIA') {
            return [
                '전체',
                '순수어',
                '차용어',
                '합성어',
                '생물',
                '반생물',
                '지명',
                '캐릭터',
            ];
        } else {
            return [
                '전체',
                '공공예술·협력프로젝트',
                '영상·퍼포먼스',
                '설치·융복합매체',
                '회화·드로잉',
                '도예·조각',
                '그래픽·출판',
                '자료·기록',
            ];
        }
    }, [mode]);

    const filteredWords = useMemo(() => {
        const base = entries.filter(w => {
            if (w.isKraft) return false;
            const matchesSearch = w.word.toLowerCase().includes(search.toLowerCase()) ||
                w.description.toLowerCase().includes(search.toLowerCase());
            const matchesCategory =
                activeCategory === '전체' ||
                w.category === activeCategory;
            const matchesNovel =
                novelFilter === '전체' ||
                (
                    novelFilter === '천개의 문'
                        ? w.category === '천개의문' ||
                            (w.novels || []).includes('천개의 문')
                        : (w.novels || []).includes(novelFilter)
                );
            return matchesSearch && matchesCategory && matchesNovel;
        });

        return [...base].sort((a, b) => a.word.localeCompare(b.word, 'ko'));
    }, [
        search,
        activeCategory,
        novelFilter,
        entries,
    ]);

    const availableInitials = useMemo(() => {
        const initials = new Set<HangulInitial>();

        filteredWords.forEach(word => {
            const initial = getHangulInitial(word.word);
            if (initial) initials.add(initial);
        });

        return Array.from(initials);
    }, [filteredWords]);

    const showInitialIndex =
        mode === 'PEDIA' &&
        !selectedWord;

    const selectedExhibition = useMemo(
        () => EXHIBITIONS.find(exhibition => exhibition.id === exhibitionId) || null,
        [exhibitionId]
    );

    const filteredArtworks = useMemo(() => {
        const query = search.trim().toLocaleLowerCase('ko');
        const base = ARTWORKS.filter(artwork => {
            const matchesSearch = query.length === 0 || [
                artwork.title,
                artwork.titleEn,
                artwork.year,
                artwork.medium,
                ...artwork.categories,
            ].some(value => value.toLocaleLowerCase('ko').includes(query));
            const matchesCategory =
                activeCategory === '전체' || artwork.categories.includes(activeCategory);
            const matchesExhibition =
                !selectedExhibition || selectedExhibition.artworkIds.includes(artwork.id);

            return matchesSearch && matchesCategory && matchesExhibition;
        });

        if (!artworksShuffled) {
            return [...base].sort((a, b) => {
                const yearDifference = Number(b.year || 0) - Number(a.year || 0);
                if (yearDifference !== 0) return yearDifference;
                return Number(b.id.replace(/\D/g, '')) - Number(a.id.replace(/\D/g, ''));
            });
        }

        const seededRank = (id: string) => {
            let hash = 2166136261 ^ artworkShuffleSeed;
            for (let index = 0; index < id.length; index += 1) {
                hash ^= id.charCodeAt(index);
                hash = Math.imul(hash, 16777619);
            }
            return hash >>> 0;
        };

        return [...base].sort((a, b) => seededRank(a.id) - seededRank(b.id));
    }, [
        activeCategory,
        artworkShuffleSeed,
        artworksShuffled,
        search,
        selectedExhibition,
    ]);

    const handleCategoryChange = (category: string) => {
        if (mode === 'PEDIA') {
            setActiveCategory(category);
            return;
        }

        setActiveCategory(category);
        if (category === '전체') {
            setExhibitionId('전체');
        }
        setArtworksShuffled(false);
    };

    const registerModalHistory = useCallback(() => {
        const currentState =
            window.history.state && typeof window.history.state === 'object'
                ? window.history.state
                : {};

        window.history.pushState(
            { ...currentState, dictionaryModal: true },
            '',
            window.location.href,
        );
        modalOpenRef.current = true;
        modalHistoryPushedRef.current = true;
    }, []);

    const openWordModal = useCallback((word: WordEntry) => {
        registerModalHistory();
        setSelectedWord(word);
        setLastViewedId(word.id);
    }, [registerModalHistory]);

    const openArtworkModal = useCallback((artwork: ArtworkEntry) => {
        registerModalHistory();
        setSelectedArtwork(artwork);
        setLastViewedId(artwork.id);
        setViewedArtworkIds((current) => {
            const next = new Set(current);
            next.add(artwork.id);
            return next;
        });
    }, [registerModalHistory]);

    const closeActiveModal = useCallback(() => {
        if (modalHistoryPushedRef.current) {
            modalHistoryPushedRef.current = false;
            window.history.back();
            return;
        }

        modalOpenRef.current = false;
        setSelectedWord(null);
        setSelectedArtwork(null);
    }, []);

    if (!mounted) return null;

    return (
        <GravityScatterOverlay
            enabled={
                !selectedWord &&
                !selectedArtwork &&
                (mode === 'KRAFT' ||
                    (mode === 'PEDIA' && pediaBodyView === 'pebbles'))
            }
            onWhipDetected={() => {
                if (mode === 'KRAFT') {
                    setArtworkShuffleSeed(current => current + 1);
                    setArtworksShuffled(true);
                    return;
                }

                setPediaNodeShuffleSeed(current => current + 1);
            }}
        >
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
                    setActiveCategory={handleCategoryChange}
                    categories={categories}
                    mousePos={mousePos}
                    isMouseActive={isMouseActive}
                    categoryAccessory={mode === 'PEDIA' ? <WordTypeTip /> : undefined}
                    secondaryFilter={mode === 'PEDIA' ? (
                        <DictionaryNovelFilter
                            selectedNovel={novelFilter}
                            onSelect={setNovelFilter}
                        />
                    ) : (
                        <ArtworkExhibitionFilter
                            selectedId={exhibitionId}
                            onSelect={(id) => {
                                setExhibitionId(id);
                                setActiveCategory('전체');
                                setArtworksShuffled(false);
                            }}
                        />
                    )}
                />

                {mode === 'PEDIA' ? (
                    <div
                        className={`dictionary-pedia-shell ${
                            showInitialIndex
                                ? 'has-initial-index'
                                : ''
                        }`}
                    >
                        {showInitialIndex && (
                            <DictionaryInitialIndex
                                availableInitials={availableInitials}
                                viewMode={pediaBodyView}
                                onViewModeChange={setPediaBodyView}
                            />
                        )}
                        <DictionaryGrid
                            words={filteredWords}
                            lastViewedId={lastViewedId}
                            shuffleSeed={pediaNodeShuffleSeed}
                            viewMode={pediaBodyView}
                            onSelectWord={openWordModal}
                        />
                    </div>
                ) : (
                    <ArtworkArchiveGrid
                        artworks={filteredArtworks}
                        lastViewedId={lastViewedId}
                        viewedArtworkIds={viewedArtworkIds}
                        selectedExhibition={Boolean(selectedExhibition)}
                        onSelectArtwork={openArtworkModal}
                    />
                )}

                <WordModal
                    word={selectedWord}
                    onClose={closeActiveModal}
                />

                <ArtworkArchiveModal
                    artwork={selectedArtwork}
                    onClose={closeActiveModal}
                />
            </div>
        </GravityScatterOverlay>
    );
}
