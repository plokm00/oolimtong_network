import React from 'react';
import { StarfieldCanvas } from '../StarfieldCanvas';

interface DictionaryHeaderProps {
    mode: 'PEDIA' | 'KRAFT';
    setMode: (mode: 'PEDIA' | 'KRAFT') => void;
    search: string;
    setSearch: (value: string) => void;
    activeCategory: string;
    setActiveCategory: (category: string) => void;
    categories: string[];
    mousePos: { x: number; y: number };
    isMouseActive: boolean;
    categoryAccessory?: React.ReactNode;
    secondaryFilter?: React.ReactNode;
}

const DictionaryHeader: React.FC<DictionaryHeaderProps> = ({
    mode,
    setMode,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    categories,
    mousePos,
    isMouseActive,
    categoryAccessory,
    secondaryFilter
}) => {
    return (
        <header className="search-section select-none">
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ maskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)', WebkitMaskImage: 'linear-gradient(to bottom, black 60%, transparent 100%)' }}>
                <StarfieldCanvas mousePos={mousePos} isMouseActive={isMouseActive} />
            </div>
            <div className="dictionary-mode-switcher">
                <button
                    onClick={() => setMode('PEDIA')}
                    className={`mode-btn ${mode === 'PEDIA' ? 'active' : ''}`}
                >
                    NINNIKLOPEDIA
                </button>
                <button
                    onClick={() => setMode('KRAFT')}
                    className={`mode-btn ${mode === 'KRAFT' ? 'active' : ''}`}
                >
                    NINNIKKRAFT
                </button>
            </div>

            <input
                id="dictionary-search-input"
                type="text"
                className="search-bar"
                placeholder={
                    mode === 'PEDIA'
                        ? 'Search for Ninnikian words..'
                        : 'Explore the artworks..'
                }
                value={search}
                onChange={(event) => setSearch(event.target.value)}
            />
            <nav className="category-nav">
                {categories.map(cat => (
                    <button
                        key={cat}
                        className={`category-btn ${activeCategory === cat ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
                {categoryAccessory}
            </nav>
            {secondaryFilter && (
                <div className="dictionary-secondary-filter">
                    {secondaryFilter}
                </div>
            )}
        </header>
    );
};

export default DictionaryHeader;
