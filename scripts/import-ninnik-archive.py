from __future__ import annotations

import argparse
import copy
import html as html_module
import json
import re
import shutil
import sys
import time
import urllib.parse
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from lxml import etree, html
from PIL import Image, ImageOps


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_MEDIA_ROOT = Path(r"E:\CREATIVE\[웹]\홈페이지\media")
DATA_PATH = PROJECT_ROOT / "data" / "ninnik-artworks.generated.json"
PUBLIC_ROOT = PROJECT_ROOT / "public" / "artworks" / "archive"
PUBLIC_MEDIA = PUBLIC_ROOT / "media"
PUBLIC_DERIVATIVES = PUBLIC_ROOT / "derivatives"
CACHE_ROOT = Path(r"C:\tmp\ninnik-archive-cache")

CDX_URL = (
    "https://web.archive.org/cdx/search/cdx?"
    "url=ninnik.kr/*&output=json&filter=statuscode:200&filter=mimetype:text/html"
    "&collapse=urlkey&fl=timestamp,original,statuscode,mimetype&from=2018&to=2026"
)
USER_AGENT = "Mozilla/5.0 (compatible; NinnikArchiveImporter/1.0)"
NUMERIC_POST = re.compile(r"https?://(?:www\.)?ninnik\.kr(?::80)?/(\d+)/?$", re.I)
WP_SIZE_SUFFIX = re.compile(r"-\d+x\d+$")
YEAR_PATTERN = re.compile(r"(?<!\d)(19\d{2}|20\d{2})(?!\d)")
WHITESPACE = re.compile(r"\s+")
MEDIA_ALIASES = {
    "c01_f": "c01_opti1",
    "p05_f": "p05_opti",
    "701_f": "701_opti",
    "402": "402_opti",
    "312_f": "312_opti",
}
CATEGORY_OVERRIDES = {
    "1135": "자료·기록",
    "7010": "자료·기록",
    "8142": "자료·기록",
    "8747": "자료·기록",
    "9411": "자료·기록",
    "9593": "자료·기록",
}
EXCLUDED_POST_IDS = {"8747"}

ALLOWED_TAGS = {
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "h2",
    "h3",
    "h4",
    "h5",
    "ul",
    "ol",
    "li",
    "blockquote",
    "figure",
    "figcaption",
    "div",
    "span",
    "a",
    "img",
    "iframe",
}
GLOBAL_ALLOWED_ATTRIBUTES = {
    "href",
    "src",
    "alt",
    "title",
    "target",
    "rel",
    "loading",
    "allow",
    "allowfullscreen",
    "frameborder",
}


def fetch(url: str, retries: int = 6, timeout: int = 60) -> bytes:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(request, timeout=timeout) as response:
                return response.read()
        except Exception as error:  # Network recovery is intentionally bounded.
            last_error = error
            if attempt + 1 < retries:
                time.sleep(1.5 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {last_error}")


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return WHITESPACE.sub(" ", html_module.unescape(value)).strip()


def class_xpath(class_name: str) -> str:
    return (
        "contains(concat(' ', normalize-space(@class), ' '), "
        f"' {class_name} ')"
    )


def image_key(filename: str) -> str:
    path = urllib.parse.urlparse(filename).path
    basename = urllib.parse.unquote(Path(path).name)
    stem = WP_SIZE_SUFFIX.sub("", Path(basename).stem)
    return stem.casefold()


def build_media_index(media_root: Path) -> dict[str, Path]:
    candidates: dict[str, Path] = {}
    search_roots = [media_root]
    if PUBLIC_MEDIA.is_dir():
        search_roots.append(PUBLIC_MEDIA)
    for root in search_roots:
        for path in root.iterdir():
            if not path.is_file() or path.suffix.casefold() not in {".jpg", ".jpeg", ".png", ".webp"}:
                continue
            key = image_key(path.name)
            current = candidates.get(key)
            if current is None or path.stat().st_size > current.stat().st_size:
                candidates[key] = path
    return candidates


def safe_filename(path: Path) -> str:
    clean = re.sub(r"[^A-Za-z0-9._-]+", "-", path.name).strip("-")
    return clean or f"media{path.suffix.casefold()}"


def copy_media(source: Path, dry_run: bool) -> str:
    target_name = safe_filename(source)
    target = PUBLIC_MEDIA / target_name
    if not dry_run:
        PUBLIC_MEDIA.mkdir(parents=True, exist_ok=True)
        if source.resolve() != target.resolve():
            shutil.copy2(source, target)
    return f"/artworks/archive/media/{target_name}"


def resolve_local_image(
    source_url: str,
    media_index: dict[str, Path],
    dry_run: bool,
) -> tuple[str, Path] | None:
    key = image_key(source_url)
    source = media_index.get(key) or media_index.get(MEDIA_ALIASES.get(key, ""))
    if source is None:
        return None
    return copy_media(source, dry_run), source


def extract_title(document: html.HtmlElement) -> str:
    nodes = document.xpath(f"//*[self::h1 or self::h2][{class_xpath('entry-title')}]")
    if not nodes:
        title_nodes = document.xpath("//title")
        return normalize_text(title_nodes[0].text_content().split("–")[0]) if title_nodes else ""
    return normalize_text(nodes[0].text_content())


def split_title(raw_title: str) -> tuple[str, str]:
    title = normalize_text(raw_title)
    if not re.search(r"[가-힣]", title):
        return title, ""

    matches = list(re.finditer(r"(?<![A-Za-z])([A-Za-z][A-Za-z0-9'&().,:/\- ]{2,})$", title))
    if not matches:
        return title, ""
    match = matches[-1]
    korean = title[: match.start()].strip(" ·:|-")
    english = title[match.start() :].strip()
    return (korean or title), english


def guess_category(title: str, text: str) -> str:
    sample = f"{title} {text}".casefold()
    if any(word in sample for word in ["animation", "video", "영상", "애니메이션", "퍼포먼스"]):
        return "영상·퍼포먼스"
    if any(word in sample for word in ["participational", "participatory", "참여미술", "관객 참여"]):
        return "참여형 설치"
    if any(word in sample for word in ["ceramic", "clay", "도자", "도예", "점토", "혼합토"]):
        return "도예·조각"
    if any(word in sample for word in ["installation", "설치", "전시전경"]):
        return "설치·복합매체"
    if any(word in sample for word in ["canvas", "paper panel", "pastel", "oil stick", "회화", "캔버스", "파스텔"]):
        return "회화·드로잉"
    return "복합매체"


def related_word_ids(title: str, text: str) -> list[str]:
    sample = f"{title} {text}"
    matches: list[str] = []
    for keyword, word_id in [
        ("네골", "word-seed-5"),
        ("니닉", "word-seed-8"),
        ("둔가라", "word-seed-16"),
        ("슈자라", "word-seed-41"),
    ]:
        if keyword in sample:
            matches.append(word_id)
    return matches


def strip_tracking_url(url: str) -> str:
    if url.startswith("//"):
        return f"https:{url}"
    if url.startswith("/"):
        return f"http://ninnik.kr{url}"
    return url


def sanitize_content(
    content: html.HtmlElement,
    media_index: dict[str, Path],
    title: str,
    dry_run: bool,
) -> tuple[str, list[dict[str, str]], list[str]]:
    root = copy.deepcopy(content)
    image_records: list[dict[str, str]] = []
    unmatched: list[str] = []

    etree.strip_elements(root, "script", "style", "noscript", with_tail=False)

    for image in list(root.xpath(".//img")):
        source_url = strip_tracking_url(image.get("src", ""))
        resolved = resolve_local_image(source_url, media_index, dry_run)
        if resolved is None:
            unmatched.append(source_url)
            image.drop_tree()
            continue
        local_url, _ = resolved
        caption_nodes = image.xpath("ancestor::figure[1]//figcaption")
        caption = normalize_text(caption_nodes[0].text_content()) if caption_nodes else ""
        alt = normalize_text(image.get("alt")) or caption or title
        image.set("src", local_url)
        image.set("alt", alt)
        image.set("loading", "lazy")
        image_records.append({"url": local_url, "alt": alt})

    for anchor in list(root.xpath(".//a[@href]")):
        href = strip_tracking_url(anchor.get("href", ""))
        resolved = resolve_local_image(href, media_index, dry_run)
        if resolved is not None:
            anchor.set("href", resolved[0])
        elif href.startswith(("http://", "https://", "#")):
            anchor.set("href", href)
            if href.startswith(("http://", "https://")):
                anchor.set("target", "_blank")
                anchor.set("rel", "noreferrer")
        else:
            anchor.attrib.pop("href", None)

    for frame in list(root.xpath(".//iframe")):
        source = frame.get("src", "")
        if not (
            source.startswith("https://www.youtube.com/embed/")
            or source.startswith("https://www.youtube-nocookie.com/embed/")
        ):
            frame.drop_tree()
            continue
        frame.set("loading", "lazy")
        frame.set("allowfullscreen", "")

    for element in list(root.iterdescendants()):
        tag = element.tag if isinstance(element.tag, str) else ""
        if tag not in ALLOWED_TAGS:
            element.drop_tag()
            continue
        for attribute in list(element.attrib):
            if attribute not in GLOBAL_ALLOWED_ATTRIBUTES:
                element.attrib.pop(attribute, None)

    body_html = "".join(
        html.tostring(child, encoding="unicode", method="html")
        for child in root
    ).strip()
    return body_html, image_records, unmatched


def generate_derivatives(source: Path, post_id: str, dry_run: bool) -> tuple[str, str]:
    thumb_url = f"/artworks/archive/derivatives/{post_id}-thumb.webp"
    preview_url = f"/artworks/archive/derivatives/{post_id}-preview.webp"
    if dry_run:
        return thumb_url, preview_url

    PUBLIC_DERIVATIVES.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        for name, size, quality in [
            (f"{post_id}-thumb.webp", (420, 525), 72),
            (f"{post_id}-preview.webp", (960, 1200), 80),
        ]:
            fitted = ImageOps.fit(
                image,
                size,
                method=Image.Resampling.LANCZOS,
                bleed=0.02,
                centering=(0.5, 0.5),
            )
            fitted.save(PUBLIC_DERIVATIVES / name, "WEBP", quality=quality, method=6)
    return thumb_url, preview_url


def parse_post(
    timestamp: str,
    original_url: str,
    page_bytes: bytes,
    media_index: dict[str, Path],
    dry_run: bool,
) -> tuple[dict | None, list[str]]:
    document = html.fromstring(page_bytes)
    articles = document.xpath("//article")
    if not articles:
        return None, []
    article = articles[0]
    article_classes = set((article.get("class") or "").split())
    if "category-ninnikkraft" not in article_classes:
        return None, []

    match = NUMERIC_POST.fullmatch(original_url)
    if match is None:
        return None, []
    post_id = match.group(1)
    if post_id in EXCLUDED_POST_IDS:
        return None, []

    raw_title = extract_title(document)
    title, title_en = split_title(raw_title)

    content_nodes = article.xpath(f".//*[{class_xpath('entry-content')}]")
    if not content_nodes:
        return None, []
    content = content_nodes[0]
    full_text = normalize_text(content.text_content())

    body_html, body_images, unmatched = sanitize_content(
        content,
        media_index,
        title,
        dry_run,
    )

    featured_nodes = article.xpath(f".//*[{class_xpath('entry-featured')}]//img")
    featured_record: dict[str, str] | None = None
    featured_source: Path | None = None
    if featured_nodes:
        featured_url = strip_tracking_url(featured_nodes[0].get("src", ""))
        featured_resolved = resolve_local_image(featured_url, media_index, dry_run)
        if featured_resolved is not None:
            local_url, featured_source = featured_resolved
            featured_record = {
                "url": local_url,
                "alt": title,
            }
        else:
            unmatched.append(featured_url)

    images: list[dict[str, str]] = []
    seen_urls: set[str] = set()
    for image in ([featured_record] if featured_record else []) + body_images:
        if image and image["url"] not in seen_urls:
            images.append(image)
            seen_urls.add(image["url"])

    if featured_source is None and images:
        local_name = Path(urllib.parse.urlparse(images[0]["url"]).path).name
        featured_source = media_index.get(image_key(local_name))

    if featured_source is None:
        return None, unmatched

    thumbnail_url, preview_url = generate_derivatives(featured_source, post_id, dry_run)
    years = [
        int(value)
        for value in YEAR_PATTERN.findall(full_text)
        if int(value) <= 2026
    ]
    year = str(max(years)) if years else ""
    description = full_text[:420].rstrip()
    if len(full_text) > 420:
        description += "…"

    entry = {
        "id": f"artwork-{post_id}",
        "slug": f"ninnik-{post_id}",
        "title": title,
        "titleEn": title_en,
        "category": CATEGORY_OVERRIDES.get(
            post_id,
            guess_category(raw_title, full_text),
        ),
        "year": year,
        "medium": "작품 페이지 원문 참조",
        "mediumEn": "See the complete original artwork text",
        "dimensions": "",
        "description": description,
        "descriptionEn": "",
        "bodyHtml": body_html,
        "thumbnailUrl": thumbnail_url,
        "previewUrl": preview_url,
        "images": [
            {
                "id": f"{post_id}-image-{index + 1}",
                "url": image["url"],
                "alt": image["alt"],
            }
            for index, image in enumerate(images)
        ],
        "relatedWordIds": related_word_ids(raw_title, full_text),
        "sourceUrl": f"http://ninnik.kr/{post_id}/",
        "archiveUrl": (
            f"https://web.archive.org/web/{timestamp}/{original_url}"
        ),
    }
    return entry, unmatched


def collect_posts() -> list[tuple[str, str]]:
    rows = json.loads(fetch(CDX_URL).decode("utf-8"))
    posts: dict[str, tuple[str, str]] = {}
    for row in rows[1:]:
        timestamp, original_url = row[0], row[1]
        match = NUMERIC_POST.fullmatch(original_url)
        if match is None:
            continue
        post_id = match.group(1)
        current = posts.get(post_id)
        if current is None or timestamp > current[0]:
            posts[post_id] = (timestamp, original_url)
    return sorted(posts.values(), key=lambda item: int(NUMERIC_POST.fullmatch(item[1]).group(1)))


def fetch_post(capture: tuple[str, str]) -> tuple[str, str, bytes]:
    timestamp, original_url = capture
    match = NUMERIC_POST.fullmatch(original_url)
    post_id = match.group(1) if match else "unknown"
    cache_path = CACHE_ROOT / f"{post_id}-{timestamp}.html"
    if cache_path.exists():
        return timestamp, original_url, cache_path.read_bytes()
    capture_url = (
        f"https://web.archive.org/web/{timestamp}id_/{original_url}"
    )
    page_bytes = fetch(capture_url)
    CACHE_ROOT.mkdir(parents=True, exist_ok=True)
    cache_path.write_bytes(page_bytes)
    return timestamp, original_url, page_bytes


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import the public Ninnik artwork archive without modifying its source media."
    )
    parser.add_argument("--media-root", type=Path, default=DEFAULT_MEDIA_ROOT)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--workers", type=int, default=2)
    args = parser.parse_args()

    if not args.media_root.is_dir():
        raise SystemExit(f"Media directory not found: {args.media_root}")

    media_index = build_media_index(args.media_root)
    captures = collect_posts()
    print(f"Found {len(captures)} numeric public pages and {len(media_index)} local media keys.")

    fetched: list[tuple[str, str, bytes]] = []
    failures: list[str] = []
    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as executor:
        futures = {executor.submit(fetch_post, capture): capture for capture in captures}
        for future in as_completed(futures):
            capture = futures[future]
            try:
                fetched.append(future.result())
            except Exception as error:
                failures.append(f"{capture[1]}: {error}")

    entries: list[dict] = []
    unmatched_by_post: dict[str, list[str]] = {}
    for timestamp, original_url, page_bytes in sorted(
        fetched,
        key=lambda item: int(NUMERIC_POST.fullmatch(item[1]).group(1)),
    ):
        entry, unmatched = parse_post(
            timestamp,
            original_url,
            page_bytes,
            media_index,
            args.dry_run,
        )
        if entry is None:
            continue
        entries.append(entry)
        if unmatched:
            unmatched_by_post[entry["id"]] = sorted(set(filter(None, unmatched)))

    entries.sort(
        key=lambda entry: (
            int(entry["year"]) if entry["year"].isdigit() else 0,
            int(entry["id"].split("-")[-1]),
        ),
        reverse=True,
    )

    if not args.dry_run:
        DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        DATA_PATH.write_text(
            json.dumps(entries, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )

    print(f"Imported {len(entries)} NINNIKKRAFT artwork pages.")
    for entry in entries:
        print(f"{entry['id'].split('-')[-1]}\t{entry['year']}\t{entry['title']}\t{entry['titleEn']}")
    print(f"Unmatched image references: {sum(map(len, unmatched_by_post.values()))}")
    for post_id, urls in unmatched_by_post.items():
        print(f"  {post_id}: {', '.join(urls[:8])}")
    if failures:
        print("Fetch failures:", file=sys.stderr)
        for failure in failures:
            print(f"  {failure}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
