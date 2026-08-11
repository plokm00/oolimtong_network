"use client";

import { ChevronDown } from "lucide-react";
import { DICTIONARY_NOVELS } from "@/lib/dictionary-data";

interface DictionaryNovelFilterProps {
  selectedNovel: string;
  onSelect: (novel: string) => void;
}

export default function DictionaryNovelFilter({
  selectedNovel,
  onSelect,
}: DictionaryNovelFilterProps) {
  const closeMenu = (element: HTMLElement) => {
    element.closest("details")?.removeAttribute("open");
  };

  return (
    <details className="dictionary-exhibition-filter dictionary-novel-filter">
      <summary>
        <span>
          {selectedNovel === "전체"
            ? "소설별 보기"
            : `소설별 보기 · ${selectedNovel}`}
        </span>
        <ChevronDown size={13} aria-hidden="true" />
      </summary>

      <div className="dictionary-exhibition-menu">
        <button
          type="button"
          className={selectedNovel === "전체" ? "active" : ""}
          onClick={(event) => {
            onSelect("전체");
            closeMenu(event.currentTarget);
          }}
        >
          모든 소설
        </button>

        {DICTIONARY_NOVELS.map((novel) => (
          <button
            type="button"
            key={novel}
            className={selectedNovel === novel ? "active" : ""}
            onClick={(event) => {
              onSelect(novel);
              closeMenu(event.currentTarget);
            }}
          >
            {novel}
          </button>
        ))}
      </div>
    </details>
  );
}
