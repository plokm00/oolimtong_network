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
export const DICTIONARY_NODES_PER_SCENE = 96;

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
const PEBBLE_FIELD_SIZES = [18, 22, 26, 30, 35, 42] as const;

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
    ? `https://img.youtube.com/vi/${youtubeId}/default.jpg`
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
) => {
  const hash = hashWord(word.id, 0);
  const jitterX = seededUnit(hash, 0x9e3779b9) - 0.5;
  const jitterY = seededUnit(hash, 0x85ebca6b) - 0.5;
  const x = 3 + ((index % 12 + 0.5 + jitterX * 0.54) / 12) * 94;
  const y = 11 + ((Math.floor(index / 12) + 0.5 + jitterY * 0.54) / 8) * 78;
  const mobileX = 6 + ((index % 8 + 0.5 + jitterX * 0.4) / 8) * 88;
  const mobileY = 12 + ((Math.floor(index / 8) + 0.5 + jitterY * 0.4) / 12) * 76;
  const sizeIndex = Math.floor(
    seededUnit(hash, 0xc2b2ae35) * PEBBLE_FIELD_SIZES.length,
  );
  const size = PEBBLE_FIELD_SIZES[Math.min(sizeIndex, PEBBLE_FIELD_SIZES.length - 1)];
  return {
    x,
    y,
    mobileX,
    mobileY,
    width: size,
    height: size,
    mobileWidth: Math.round(size * 0.78),
    mobileHeight: Math.round(size * 0.78),
    rotation: 0,
    opacity: 0.68 + seededUnit(hash, 0xb55a4f09) * 0.27,
    zIndex: index + 1,
  };
};

export const DictionaryGrid: React.FC<DictionaryGridProps> = React.memo(({
  words,
  lastViewedId,
  shuffleSeed,
  viewMode,
  onSelectWord,
}) => {
  const [failedMedia, setFailedMedia] = React.useState<Set<string>>(() => new Set());
  const markMediaUnavailable = (id: string) => {
    setFailedMedia((current) => {
      if (current.has(id)) return current;
      const next = new Set(current);
      next.add(id);
      return next;
    });
  };
  const sceneWords = useMemo(() => {
    if (viewMode !== "pebbles") return [];
    const ordered = [...words].sort((a, b) =>
      Number(Boolean(b.thumbnailUrl)) - Number(Boolean(a.thumbnailUrl)) ||
      hashWord(a.id, 0) - hashWord(b.id, 0),
    );
    const sceneCount = Math.max(1, Math.ceil(ordered.length / DICTIONARY_NODES_PER_SCENE));
    const scene = ((shuffleSeed % sceneCount) + sceneCount) % sceneCount;
    return ordered.slice(scene * DICTIONARY_NODES_PER_SCENE, (scene + 1) * DICTIONARY_NODES_PER_SCENE);
  }, [shuffleSeed, viewMode, words]);
  const nodeLayouts = useMemo(
    () => sceneWords.map((word, index) => getPebbleLayout(word, index)),
    [sceneWords],
  );
  const groupedWords = useMemo(() => {
    if (viewMode !== "list") return [];
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
  }, [viewMode, words]);

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
                    const mediaUrl = failedMedia.has(word.id) ? "" : getWordMediaUrl(word);
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
                              <img src={mediaUrl} alt="" loading="lazy" decoding="async" onError={() => markMediaUnavailable(word.id)} />
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
          aria-label="단어를 여러 장면으로 나누어 보는 노드 보기"
        >
          <DictionaryNodeNetwork points={nodeLayouts} />
          {sceneWords.length > 0 ? (
            sceneWords.map((word, index) => {
              const mediaUrl = failedMedia.has(word.id) ? "" : getWordMediaUrl(word);
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
                      "--pebble-mobile-left": `${layout.mobileX}%`,
                      "--pebble-mobile-top": `${layout.mobileY}%`,
                      "--pebble-rotation": `${layout.rotation}deg`,
                      "--pebble-counter-rotation": `${-layout.rotation}deg`,
                      "--pebble-opacity": layout.opacity,
                      "--pebble-z": layout.zIndex,
                      borderRadius: mediaUrl ? "28%" : "50%",
                    } as React.CSSProperties
                  }
                  data-resonance-gesture="allow"
                  data-word={word.word}
                  onClick={() => onSelectWord(word)}
                  aria-label={`${word.word} 상세 보기`}
                >
                  {mediaUrl && <img src={mediaUrl} alt="" loading="lazy" decoding="async" onError={() => markMediaUnavailable(word.id)} />}
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
