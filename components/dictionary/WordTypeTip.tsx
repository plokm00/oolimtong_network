"use client";

import { useEffect, useRef, useState } from "react";

export default function WordTypeTip() {
  const [expanded, setExpanded] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!expanded) return;

    const closeFromOutside = (event: PointerEvent) => {
      if (!buttonRef.current?.contains(event.target as Node)) {
        setExpanded(false);
      }
    };

    const closeFromEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setExpanded(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);

    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [expanded]);

  return (
    <div className={`word-type-tip${expanded ? " expanded" : ""}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
      >
        <span className="word-type-tip-label">TIP</span>
        <span className="word-type-tip-text">
          <span className="word-type-tip-intro">
            니닉의 언어는 김아영 가야 작가가 지어낸 것으로, 니닉의 세계와
            이야기를 이루는 고유한 말들입니다.
          </span>
          <span className="word-type-tip-legend">
            <b>○</b> 순수어 · <b>●</b> 차용어 · <b>◉</b> 합성어 ·
            ‘어느 도시의 어느 장인’ 형식의 묶음명사는 하나의 이름처럼
            취급합니다.
          </span>
        </span>
      </button>
    </div>
  );
}
