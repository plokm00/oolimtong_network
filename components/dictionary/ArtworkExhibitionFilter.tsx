"use client";

import { ChevronDown } from "lucide-react";
import { EXHIBITIONS } from "@/lib/artwork-data";

interface ArtworkExhibitionFilterProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

const EXHIBITION_TYPES = [
  "개인전",
  "단체전·기획전",
  "공공예술·협력프로젝트",
] as const;

export default function ArtworkExhibitionFilter({
  selectedId,
  onSelect,
}: ArtworkExhibitionFilterProps) {
  const selected =
    EXHIBITIONS.find((exhibition) => exhibition.id === selectedId) || null;

  const closeMenu = (element: HTMLElement) => {
    element.closest("details")?.removeAttribute("open");
  };

  return (
    <details className="dictionary-exhibition-filter">
      <summary>
        <span>
          {selected ? `${selected.year} ${selected.title}` : "전시·프로젝트별 보기"}
        </span>
        <ChevronDown size={13} aria-hidden="true" />
      </summary>

      <div className="dictionary-exhibition-menu">
        <button
          type="button"
          className={selectedId === "전체" ? "active" : ""}
          onClick={(event) => {
            onSelect("전체");
            closeMenu(event.currentTarget);
          }}
        >
          모든 전시
        </button>

        {EXHIBITION_TYPES.map((type) => {
          const exhibitions = EXHIBITIONS.filter(
            (exhibition) => exhibition.type === type,
          );

          return (
            <section key={type}>
              <p>
                {type}
                <span>{exhibitions.length}</span>
              </p>
              {exhibitions.map((exhibition) => (
                <button
                  type="button"
                  key={exhibition.id}
                  className={selectedId === exhibition.id ? "active" : ""}
                  onClick={(event) => {
                    onSelect(exhibition.id);
                    closeMenu(event.currentTarget);
                  }}
                >
                  <span>{exhibition.year}</span>
                  <strong>{exhibition.title}</strong>
                  <small>
                    {exhibition.period
                      ? `${exhibition.period} · ${exhibition.venue}`
                      : exhibition.venue}
                  </small>
                </button>
              ))}
            </section>
          );
        })}
      </div>
    </details>
  );
}
