import React from "react";
import { ArtworkEntry } from "@/lib/artwork-data";

interface ArtworkArchiveGridProps {
  artworks: ArtworkEntry[];
  lastViewedId: string | null;
  viewedArtworkIds: Set<string>;
  selectedExhibition: boolean;
  onSelectArtwork: (artwork: ArtworkEntry) => void;
}

export const ArtworkArchiveGrid: React.FC<ArtworkArchiveGridProps> = ({
  artworks,
  lastViewedId,
  viewedArtworkIds,
  selectedExhibition,
  onSelectArtwork,
}) => {
  return (
    <main className="artwork-archive-grid">
      {artworks.length === 0 && selectedExhibition && (
        <p className="artwork-archive-empty">
          전시 이력은 확인되었지만, 출품작 연결은 아직 검토 중입니다.
        </p>
      )}

      {artworks.map((artwork, index) => (
        <button
          type="button"
          key={artwork.id}
          className={`artwork-archive-card artwork-arch-card ${
            lastViewedId === artwork.id ? "last-viewed" : ""
          } ${
            viewedArtworkIds.has(artwork.id) ? "viewed" : ""
          }`}
          onClick={() => onSelectArtwork(artwork)}
          style={{
            "--artwork-fade-delay": `${(index % 36) * 0.012}s`,
          } as React.CSSProperties}
        >
          <img
            src={artwork.thumbnailUrl}
            alt={artwork.images[0]?.alt || artwork.title}
            loading="lazy"
          />
          <span className="artwork-archive-card-copy">
            <span className="artwork-archive-card-meta">
              <span>{artwork.year || "연도 미상"}</span>
              {artwork.categories.map((category) => (
                <span key={category}>{category}</span>
              ))}
            </span>
            <strong>{artwork.title}</strong>
            {artwork.titleEn && <small>{artwork.titleEn}</small>}
          </span>
        </button>
      ))}
    </main>
  );
};
