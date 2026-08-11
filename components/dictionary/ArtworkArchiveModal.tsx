"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { ArtworkEntry } from "@/lib/artwork-data";
import { lockBodyScroll, unlockBodyScroll } from "@/lib/scroll-lock";

interface ArtworkArchiveModalProps {
  artwork: ArtworkEntry | null;
  onClose: () => void;
}

const JORYONG_ILLUSTRATION_BLOCK =
  /<div>\s*(?:<div>\s*<p>\s*<a href="\/artworks\/archive\/full\/dragon_[^"]+">[\s\S]*?<\/a>\s*<\/p>\s*<\/div>\s*){5}<\/div>/;

export default function ArtworkArchiveModal({
  artwork,
  onClose,
}: ArtworkArchiveModalProps) {
  const backdropPressedRef = useRef(false);

  useEffect(() => {
    if (!artwork) return;

    lockBodyScroll();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);

    return () => {
      unlockBodyScroll();
      window.removeEventListener("keydown", handleEscape);
    };
  }, [artwork, onClose]);

  if (!artwork) return null;

  const joryongIllustrations =
    artwork.id === "artwork-9504"
      ? artwork.images.filter((image) =>
          image.fullUrl?.includes("/dragon_"),
        )
      : [];
  const joryongBodyParts =
    joryongIllustrations.length > 0
      ? artwork.bodyHtml.split(JORYONG_ILLUSTRATION_BLOCK)
      : null;
  const hasJoryongIllustrationGallery =
    joryongBodyParts?.length === 2 && joryongIllustrations.length > 0;

  return (
    <div
      className="modal-overlay"
      onPointerDown={(event) => {
        backdropPressedRef.current = event.target === event.currentTarget;
      }}
      onPointerCancel={() => {
        backdropPressedRef.current = false;
      }}
      onClick={(event) => {
        const isBackdrop = event.target === event.currentTarget;
        if (isBackdrop && backdropPressedRef.current) onClose();
        backdropPressedRef.current = false;
      }}
    >
      <div className="modal-frame artwork-modal-frame">
        <button
          type="button"
          className="modal-close modal-close-outside"
          onClick={onClose}
          aria-label="작품 상세 닫기"
        >
          <X size={22} />
        </button>

        <article
          className="modal-content artwork-archive-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`artwork-title-${artwork.id}`}
        >
          <p className="artwork-archive-modal-meta">
            <span>{artwork.year || "연도 미상"}</span>
            {artwork.categories.map((category) => (
              <span key={category}>{category}</span>
            ))}
          </p>
          <h1 id={`artwork-title-${artwork.id}`}>{artwork.title}</h1>
          {artwork.titleEn && <h2>{artwork.titleEn}</h2>}

          <img
            className="artwork-archive-modal-cover"
            src={artwork.previewUrl}
            alt={artwork.images[0]?.alt || artwork.title}
          />

          {hasJoryongIllustrationGallery ? (
            <>
              <div
                className="artwork-archive-body"
                dangerouslySetInnerHTML={{ __html: joryongBodyParts[0] }}
              />

              <section
                className="joryong-illustration-gallery"
                aria-label="조룡 복원도 일러스트레이션 원본 보기"
              >
                {joryongIllustrations.map((image, index) => (
                  <a
                    key={image.id}
                    href={image.fullUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="원본 이미지 새 창에서 열기"
                  >
                    <img
                      src={image.url}
                      alt={`조룡 복원도 일러스트레이션 ${index + 1}`}
                      loading="lazy"
                    />
                  </a>
                ))}
              </section>

              <div
                className="artwork-archive-body"
                dangerouslySetInnerHTML={{ __html: joryongBodyParts[1] }}
              />
            </>
          ) : (
            <div
              className="artwork-archive-body"
              dangerouslySetInnerHTML={{ __html: artwork.bodyHtml }}
            />
          )}
        </article>
      </div>
    </div>
  );
}
