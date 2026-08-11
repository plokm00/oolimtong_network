from __future__ import annotations

import argparse
import io
import json
import re
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from lxml import html
from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "ninnik-artworks.generated.json"
OUTPUT_DIR = ROOT / "public" / "artworks" / "archive" / "full"
DEFAULT_CACHE_DIR = Path(r"C:\tmp\ninnik-archive-cache")
USER_AGENT = "Mozilla/5.0 (compatible; NinnikFullImageImporter/1.0)"
WP_SIZE_SUFFIX = re.compile(r"-\d+x\d+$")
SUPPORTED_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


def class_xpath(class_name: str) -> str:
    return (
        "contains(concat(' ', normalize-space(@class), ' '), "
        f"' {class_name} ')"
    )


def absolute_url(value: str) -> str:
    value = value.strip()
    if value.startswith("//"):
        return f"http:{value}"
    if value.startswith("/"):
        return f"http://ninnik.kr{value}"
    return value


def original_image_url(value: str) -> str:
    parsed = urllib.parse.urlparse(absolute_url(value))
    basename = urllib.parse.unquote(Path(parsed.path).name)
    path = Path(basename)
    stem = WP_SIZE_SUFFIX.sub("", path.stem)
    original_name = f"{stem}{path.suffix}"
    original_path = str(Path(parsed.path).with_name(original_name)).replace("\\", "/")
    return urllib.parse.urlunparse(parsed._replace(path=original_path, query="", fragment=""))


def image_key(value: str) -> str:
    parsed = urllib.parse.urlparse(value)
    basename = urllib.parse.unquote(Path(parsed.path).name)
    return WP_SIZE_SUFFIX.sub("", Path(basename).stem).casefold()


def safe_filename(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    basename = urllib.parse.unquote(Path(parsed.path).name)
    clean = re.sub(r"[^A-Za-z0-9._-]+", "-", basename).strip("-")
    return clean or "artwork-image.jpg"


def cached_page(cache_dir: Path, post_id: str) -> Path | None:
    matches = sorted(cache_dir.glob(f"{post_id}-*.html"), reverse=True)
    return matches[0] if matches else None


def page_image_sources(page_path: Path) -> tuple[str | None, list[str]]:
    document = html.fromstring(page_path.read_bytes())
    articles = document.xpath("//article")
    if not articles:
        return None, []
    article = articles[0]

    featured_nodes = article.xpath(f".//*[{class_xpath('entry-thumb')}]//img")
    featured = (
        original_image_url(featured_nodes[0].get("src", ""))
        if featured_nodes
        else None
    )

    content_nodes = article.xpath(f".//*[{class_xpath('entry-content')}]")
    body_sources: list[str] = []
    if content_nodes:
        for image in content_nodes[0].xpath(".//img[@src]"):
            source = original_image_url(image.get("src", ""))
            if source and source not in body_sources:
                body_sources.append(source)
    return featured, body_sources


def fetch_bytes(url: str, timeout: int = 45) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read()


def verified_image_bytes(url: str, archive_url: str) -> tuple[bytes, str]:
    attempts = [url]
    archive_match = re.search(r"/web/(\d+)/(https?://.+)$", archive_url)
    if archive_match:
        timestamp = archive_match.group(1)
        attempts.append(f"https://web.archive.org/web/{timestamp}id_/{url}")

    last_error: Exception | None = None
    for candidate in attempts:
        try:
            payload = fetch_bytes(candidate)
            with Image.open(io.BytesIO(payload)) as image:
                image.verify()
            return payload, candidate
        except Exception as error:
            last_error = error
            time.sleep(0.25)
    raise RuntimeError(f"{url}: {last_error}")


def download_one(url: str, archive_url: str, dry_run: bool) -> tuple[str, str, int, int]:
    target_name = safe_filename(url)
    target = OUTPUT_DIR / target_name
    public_url = f"/artworks/archive/full/{target_name}"

    if target.exists():
        with Image.open(target) as image:
            return url, public_url, image.width, image.height

    if dry_run:
        return url, public_url, 0, 0

    payload, _ = verified_image_bytes(url, archive_url)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    target.write_bytes(payload)
    with Image.open(target) as image:
        return url, public_url, image.width, image.height


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Download full-resolution Ninnik artwork images and keep local thumbnails."
    )
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR)
    parser.add_argument("--workers", type=int, default=6)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    artworks = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    source_by_artwork: dict[str, tuple[str | None, list[str]]] = {}
    download_jobs: dict[str, str] = {}

    for artwork in artworks:
        post_id = artwork["id"].split("-")[-1]
        page_path = cached_page(args.cache_dir, post_id)
        if page_path is None:
            continue
        featured, body_sources = page_image_sources(page_path)
        source_by_artwork[artwork["id"]] = (featured, body_sources)
        for source in ([featured] if featured else []) + body_sources:
            download_jobs.setdefault(source, artwork["archiveUrl"])

    downloaded: dict[str, tuple[str, int, int]] = {}
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {
            executor.submit(download_one, url, archive_url, args.dry_run): url
            for url, archive_url in download_jobs.items()
        }
        for future in as_completed(futures):
            url = futures[future]
            try:
                _, public_url, width, height = future.result()
                downloaded[url] = (public_url, width, height)
            except Exception as error:
                failures.append(str(error))

    updated_artworks = 0
    updated_images = 0
    for artwork in artworks:
        sources = source_by_artwork.get(artwork["id"])
        if sources is None:
            continue
        featured, body_sources = sources
        full_by_key = {
            image_key(source): downloaded[source][0]
            for source in ([featured] if featured else []) + body_sources
            if source in downloaded
        }

        preview_source = featured if featured in downloaded else None
        if preview_source is None:
            preview_source = next(
                (source for source in body_sources if source in downloaded),
                None,
            )
        if preview_source is not None:
            artwork["previewUrl"] = downloaded[preview_source][0]

        replacements: dict[str, str] = {}
        for image in artwork.get("images", []):
            full_url = full_by_key.get(image_key(image["url"]))
            if full_url is None:
                continue
            image["fullUrl"] = full_url
            replacements[image["url"]] = full_url
            updated_images += 1

        body_html = artwork.get("bodyHtml", "")
        for small_url, full_url in replacements.items():
            body_html = body_html.replace(small_url, full_url)
        artwork["bodyHtml"] = body_html
        if replacements or preview_source:
            updated_artworks += 1

    if not args.dry_run:
        DATA_PATH.write_text(
            json.dumps(artworks, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(f"Full image candidates: {len(download_jobs)}")
    print(f"Downloaded or reused: {len(downloaded)}")
    print(f"Updated artworks: {updated_artworks}")
    print(f"Updated image records: {updated_images}")
    if failures:
        print(f"Unavailable originals: {len(failures)}")
        for failure in failures[:20]:
            print(f"  {failure}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
