from pathlib import Path
from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
ARTWORKS_DIR = ROOT / "public" / "artworks"

SOURCES = [
    "doongara-tower-01.jpg",
    "recovery-ceremony-01.jpg",
    "palette-jupiter.jpg",
    "palette-satellite.jpg",
    "joryong-restoration.jpg",
    "ark-figureheads.jpg",
]

VARIANTS = {
    "thumb": ((420, 525), 72),
    "preview": ((960, 1200), 80),
}


def build_variant(source_path: Path, suffix: str, size: tuple[int, int], quality: int) -> None:
    with Image.open(source_path) as source:
        rgb = source.convert("RGB")
        cropped = ImageOps.fit(
            rgb,
            size,
            method=Image.Resampling.LANCZOS,
            bleed=0.025,
            centering=(0.5, 0.5),
        )
        output_path = source_path.with_name(f"{source_path.stem}-{suffix}.webp")
        cropped.save(output_path, "WEBP", quality=quality, method=6)


for filename in SOURCES:
    source_path = ARTWORKS_DIR / filename
    if not source_path.exists():
        raise FileNotFoundError(source_path)
    for suffix, (size, quality) in VARIANTS.items():
        build_variant(source_path, suffix, size, quality)

