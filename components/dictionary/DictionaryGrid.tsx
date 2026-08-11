"use client";

import React, { useMemo } from "react";
import { Play } from "lucide-react";
import { WordEntry } from "@/lib/dictionary-data";
import {
  getHangulInitial,
  getHangulInitialAnchorId,
  HANGUL_INITIALS,
  HangulInitial,
} from "@/lib/hangul-initial";
import FormattedWord from "./FormattedWord";
import DictionaryNodeNetwork from "./DictionaryNodeNetwork";

export type DictionaryBodyView = "list" | "pebbles";

interface DictionaryGridProps {
  words: WordEntry[];
  lastViewedId: string | null;
  shuffleSeed: number;
  viewMode: DictionaryBodyView;
  onSelectWord: (word: WordEntry) => void;
}

const PEBBLE_SHAPES = [
  "48% 52% 45% 55% / 55% 45% 52% 48%",
  "30% 70% 70% 30% / 30% 30% 70% 70%",
  "60% 40% 30% 70% / 60% 30% 70% 40%",
  "55% 45% 62% 38% / 42% 58% 38% 62%",
  "36% 64% 44% 56% / 61% 39% 57% 43%",
  "63% 37% 53% 47% / 35% 65% 45% 55%",
];

const PEBBLE_ROTATIONS = [-8, 5, 10, -4, 7, -11];
const PEBBLE_FIELD_SIZES = [
  [8, 8],
  [10, 9],
  [12, 10],
  [15, 12],
  [18, 14],
  [22, 17],
  [27, 21],
  [34, 26],
] as const;

const getShapeIndex = (word: WordEntry) =>
  Array.from(word.id).reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  ) % PEBBLE_SHAPES.length;

const getWordMediaUrl = (word: WordEntry) => {
  if (word.thumbnailUrl) return word.thumbnailUrl;

  const block = word.visualBlocks?.[0];
  if (!block) return "";
  if (block.type !== "video") return block.url;

  const youtubeId = block.url.includes("youtube.com/embed/")
    ? block.url.split("embed/")[1]?.split("?")[0]
    : "";
  return youtubeId
    ? `https://img.youtube.com/vi/${youtubeId}/0.jpg`
    : "";
};

const isWordVideo = (word: WordEntry) =>
  word.visualBlocks?.[0]?.type === "video";

const hashWord = (value: string, seed: number) => {
  let hash = 2166136261 ^ seed;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const seededUnit = (hash: number, salt: number) => {
  let value = hash ^ salt;
  value = Math.imul(value ^ (value >>> 16), 2246822507);
  value = Math.imul(value ^ (value >>> 13), 3266489909);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
};

const getPebbleLayout = (
  word: WordEntry,
  index: number,
  shuffleSeed: number,
) => {
  const hash = hashWord(word.id, shuffleSeed);
  const x = 3 + seededUnit(hash, 0x9e3779b9) * 94;
  const y = 4 + Math.pow(seededUnit(hash, 0x85ebca6b), 0.72) * 92;
  const sizeIndex = Math.floor(
    seededUnit(hash, 0xc2b2ae35) * PEBBLE_FIELD_SIZES.length,
  );
  const [width, height] =
    PEBBLE_FIELD_SIZES[
      Math.min(sizeIndex, PEBBLE_FIELD_SIZES.length - 1)
    ];
  return {
    x,
    y,
    width,
    height,
    mobileWidth: Math.max(7, Math.round(width * 0.76)),
    mobileHeight: Math.max(7, Math.round(height * 0.76)),
    rotation: -24 + seededUnit(hash, 0x27d4eb2f) * 48,
    hue: 72 + Math.round(seededUnit(hash, 0x165667b1) * 16),
    saturation: 72 + Math.round(seededUnit(hash, 0xd3a2646c) * 24),
    lightness: 42 + Math.round(seededUnit(hash, 0xfd7046c5) * 20),
    opacity: 0.74 + seededUnit(hash, 0xb55a4f09) * 0.26,
    zIndex: Math.round(y * 10) + (index % 9),
  };
};

const pebbleReleaseTimers = new WeakMap<HTMLButtonElement, number>();

const nudgePebbleAway = (
  event: React.PointerEvent<HTMLButtonElement>,
) => {
  if (event.pointerType !== "mouse") return;

  const pebble = event.currentTarget;
  const pendingRelease = pebbleReleaseTimers.get(pebble);
  if (pendingRelease) window.clearTimeout(pendingRelease);

  const bounds = pebble.getBoundingClientRect();
  const horizontal =
    (bounds.left + bounds.width / 2 - event.clientX) /
    Math.max(bounds.width / 2, 1);
  const vertical =
    (bounds.top + bounds.height / 2 - event.clientY) /
    Math.max(bounds.height / 2, 1);
  const x = Math.max(-1, Math.min(1, horizontal));
  const y = Math.max(-1, Math.min(1, vertical));

  pebble.style.setProperty("--pebble-nudge-x", `${(x * 6).toFixed(2)}px`);
  pebble.style.setProperty("--pebble-nudge-y", `${(y * 3.5).toFixed(2)}px`);
  pebble.style.setProperty(
    "--pebble-nudge-roll",
    `${(-x * 5 + y * 1.4).toFixed(2)}deg`,
  );
};

const releasePebble = (event: React.PointerEvent<HTMLButtonElement>) => {
  const pebble = event.currentTarget;
  const releaseTimer = window.setTimeout(() => {
    pebble.style.setProperty("--pebble-nudge-x", "0px");
    pebble.style.setProperty("--pebble-nudge-y", "0px");
    pebble.style.setProperty("--pebble-nudge-roll", "0deg");
    pebbleReleaseTimers.delete(pebble);
  }, 180);

  pebbleReleaseTimers.set(pebble, releaseTimer);
};

export const DictionaryGrid: React.FC<DictionaryGridProps> = React.memo(({
  words,
  lastViewedId,
  shuffleSeed,
  viewMode,
  onSelectWord,
}) => {
  const nodeLayouts = useMemo(
    () =>
      words.map((word, index) =>
        getPebbleLayout(word, index, shuffleSeed),
      ),
    [shuffleSeed, words],
  );
  const groupedWords = useMemo(() => {
    const groups = new Map<HangulInitial, WordEntry[]>();

    words.forEach((word) => {
      const initial = getHangulInitial(word.word);
      if (!initial) return;
      const group = groups.get(initial) || [];
      group.push(word);
      groups.set(initial, group);
    });

    return HANGUL_INITIALS.flatMap((initial) => {
      const groupWords = groups.get(initial);
      return groupWords?.length ? [{ initial, words: groupWords }] : [];
    });
  }, [words]);

  return (
    <main
      className={`dictionary-pedia-body ${
        viewMode !== "list" ? "is-pebble-view" : ""
      }`}
    >
      {viewMode === "list" ? (
        <div className="dictionary-word-list">
          {groupedWords.length > 0 ? (
            groupedWords.map(({ initial, words: initialWords }) => (
              <section
                key={initial}
                id={getHangulInitialAnchorId(initial)}
                className="dictionary-word-group"
              >
                <div className="dictionary-word-rows">
                  {initialWords.map((word, wordIndex) => {
                    const mediaUrl = getWordMediaUrl(word);
                    const shapeIndex = getShapeIndex(word);

                    return (
                      <button
                        type="button"
                        key={`${word.id}-${shuffleSeed}`}
                        className={`dictionary-word-row ${
                          lastViewedId === word.id ? "last-viewed" : ""
                        }`}
                        style={
                          {
                            "--word-shuffle-delay": `${
                              (wordIndex % 18) * 0.012
                            }s`,
                          } as React.CSSProperties
                        }
                        data-resonance-gesture="allow"
                        onClick={() => onSelectWord(word)}
                      >
                        <span className="dictionary-word-meta">
                          <span className="dictionary-word-index">
                            #{word.indexNumber}
                          </span>
                          <span>{word.category}</span>
                          {word.wordMarks && (
                            <span className="dictionary-word-marks">
                              {word.wordMarks}
                            </span>
                          )}
                        </span>

                        <span className="dictionary-word-name">
                          <FormattedWord word={word.word} />
                        </span>

                        <span className="dictionary-word-summary">
                          {word.description}
                        </span>

                        <span
                          className={`dictionary-row-pebble-slot ${
                            mediaUrl ? "has-media" : ""
                          }`}
                          aria-hidden="true"
                        >
                          {mediaUrl && (
                            <span
                              className="dictionary-row-pebble"
                              style={{
                                borderRadius: PEBBLE_SHAPES[shapeIndex],
                                transform: `rotate(${PEBBLE_ROTATIONS[shapeIndex]}deg)`,
                              }}
                            >
                              <img src={mediaUrl} alt="" />
                              {isWordVideo(word) && (
                                <Play
                                  className="dictionary-row-pebble-play"
                                  size={8}
                                />
                              )}
                            </span>
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          ) : (
            <p className="dictionary-pedia-empty">
              조건에 맞는 니닉 단어가 없습니다.
            </p>
          )}
        </div>
      ) : (
        <section
          className="dictionary-pebble-field"
          aria-label="단어 이미지를 우주 신경망처럼 모아 보는 노드 보기"
        >
          <DictionaryNodeNetwork points={nodeLayouts} />
          {words.length > 0 ? (
            words.map((word, index) => {
              const mediaUrl = getWordMediaUrl(word);
              const shapeIndex = getShapeIndex(word);
              const layout = nodeLayouts[index];

              return (
                <button
                  type="button"
                  key={`${word.id}-${shuffleSeed}`}
                  className={`dictionary-floating-pebble ${
                    mediaUrl ? "has-media" : "is-generated"
                  } ${lastViewedId === word.id ? "last-viewed" : ""}`}
                  style={
                    {
                      "--pebble-width": `${layout.width}px`,
                      "--pebble-height": `${layout.height}px`,
                      "--pebble-mobile-width": `${layout.mobileWidth}px`,
                      "--pebble-mobile-height": `${layout.mobileHeight}px`,
                      "--pebble-left": `${layout.x}%`,
                      "--pebble-top": `${layout.y}%`,
                      "--pebble-rotation": `${layout.rotation}deg`,
                      "--pebble-counter-rotation": `${-layout.rotation}deg`,
                      "--pebble-hue": layout.hue,
                      "--pebble-saturation": `${layout.saturation}%`,
                      "--pebble-lightness": `${layout.lightness}%`,
                      "--pebble-opacity": layout.opacity,
                      "--pebble-z": layout.zIndex,
                      "--pebble-delay": `${(index % 32) * 0.006}s`,
                      borderRadius: PEBBLE_SHAPES[shapeIndex],
                    } as React.CSSProperties
                  }
                  data-resonance-gesture="allow"
                  data-word={word.word}
                  onClick={() => onSelectWord(word)}
                  onPointerMove={nudgePebbleAway}
                  onPointerLeave={releasePebble}
                  aria-label={`${word.word} 상세 보기`}
                >
                  {mediaUrl && <img src={mediaUrl} alt="" />}
                  {isWordVideo(word) && (
                    <Play
                      className="dictionary-floating-pebble-play"
                      size={16}
                    />
                  )}
                </button>
              );
            })
          ) : (
            <p className="dictionary-pedia-empty">
              아직 노드로 띄울 단어가 없습니다.
            </p>
          )}
        </section>
      )}
    </main>
  );
});
