from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from lxml import html


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SOURCE = Path(r"C:\tmp\ninnik-archive-cache\7592-20190825174151.html")
DATA_PATH = PROJECT_ROOT / "data" / "dictionary.json"
ENTRY_PREFIX = "word-artisan-"
SECTION_TITLE = "천의 장인"
GAYA = "가야"
NUMBERED_HEADING = re.compile(r"^\s*\d{4}\s*_\s*(.+)$")
RANGE_HEADING = re.compile(r"^\s*\d{4}\s*(?:[-~]\s*\d{4})?\s*_\s*")
LATIN_LETTER = re.compile(r"[A-Za-z\u00c0-\u024f]")
SOURCE_MARK = re.compile(r"[○●◉]+")
KOREAN_PARENTHETICAL = re.compile(r"\(([^)]*[가-힣][^)]*)\)")
WHITESPACE = re.compile(r"\s+")


def normalize(value: str | None) -> str:
    return WHITESPACE.sub(" ", value or "").strip()


def find_artisan_panel(document: html.HtmlElement) -> html.HtmlElement:
    for anchor in document.xpath("//article//a[@aria-controls]"):
        if SECTION_TITLE in normalize(anchor.text_content()):
            return document.get_element_by_id(anchor.get("aria-controls"))
    raise RuntimeError(f"Could not find the '{SECTION_TITLE}' section.")


def parse_heading(raw_heading: str) -> tuple[str, list[str]]:
    latin_match = LATIN_LETTER.search(raw_heading)
    title_end = latin_match.start() if latin_match else len(raw_heading)
    title = normalize(raw_heading[:title_end]).strip(" _")
    title = re.sub(r"\s*[○●◉]+.*$", "", title).strip()

    remainder = raw_heading[title_end:]
    metadata: list[str] = []
    marks = SOURCE_MARK.findall(remainder)
    if marks:
        metadata.append("".join(marks))
    for value in KOREAN_PARENTHETICAL.findall(remainder):
        cleaned = normalize(value)
        if cleaned and cleaned not in metadata:
            metadata.append(cleaned)
    return title, metadata


def parse_entries(panel: html.HtmlElement) -> list[dict[str, object]]:
    parsed: dict[str, dict[str, object]] = {}
    last_title: str | None = None

    for paragraph in panel.xpath(".//p"):
        full_text = normalize(paragraph.text_content())
        if not full_text:
            continue

        direct_text = normalize(paragraph.text)
        match = NUMBERED_HEADING.match(direct_text)
        if match:
            raw_heading = match.group(1)
            title, metadata = parse_heading(raw_heading)
            if not title:
                continue

            description = normalize(full_text[len(direct_text):])
            current = parsed.get(title)
            if current is None:
                current = {
                    "title": title,
                    "descriptions": [],
                    "metadata": [],
                }
                parsed[title] = current

            if description and description not in current["descriptions"]:
                current["descriptions"].append(description)
            for item in metadata:
                if item not in current["metadata"]:
                    current["metadata"].append(item)
            last_title = title
            continue

        # WordPress split two long descriptions into continuation paragraphs.
        # Numeric ranges denote repeated unnamed/failed works and are not
        # separate dictionary headwords.
        if last_title and not RANGE_HEADING.match(full_text):
            descriptions = parsed[last_title]["descriptions"]
            if full_text not in descriptions:
                descriptions.append(full_text)

    results: list[dict[str, object]] = []
    for item in parsed.values():
        title = str(item["title"])
        descriptions = [str(value) for value in item["descriptions"]]
        metadata = [str(value) for value in item["metadata"]]
        descriptive_metadata = [
            value for value in metadata if not SOURCE_MARK.fullmatch(value)
        ]

        description_parts = descriptions[:]
        if descriptive_metadata:
            description_parts.append(
                f"원문 표기: {' · '.join(descriptive_metadata)}"
            )
        description = " ".join(description_parts).strip()
        if not description:
            description = "천의 장인에 기록된 고유명사."

        stable_hash = hashlib.sha1(title.encode("utf-8")).hexdigest()[:12]
        results.append(
            {
                "id": f"{ENTRY_PREFIX}{stable_hash}",
                "word": title,
                "indexNumber": "PENDING",
                "category": "천개의문",
                "novels": [],
                "wordMarks": "".join(
                    value for value in metadata if SOURCE_MARK.fullmatch(value)
                ),
                "description": description,
                "imagePrompt": "",
                "visualBlocks": [],
                "isKraft": False,
                "createdAt": "2019-08-25T17:41:51+09:00",
            }
        )

    # Hangul syllables are encoded in 가나다 order. The page applies the
    # browser's Korean collation again when displaying entries.
    return sorted(results, key=lambda entry: str(entry["word"]))


def reindex(entries: list[dict[str, object]]) -> list[dict[str, object]]:
    sorted_entries = sorted(entries, key=lambda entry: str(entry.get("word", "")))
    counter = 1
    for entry in sorted_entries:
        if entry.get("isKraft"):
            entry["indexNumber"] = "KRAFT"
        else:
            entry["indexNumber"] = str(counter).zfill(4)
            counter += 1
    return sorted_entries


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Import the Thousand Artisans proper nouns into Ninniklopedia."
    )
    parser.add_argument("--source", type=Path, default=DEFAULT_SOURCE)
    args = parser.parse_args()

    if not args.source.is_file():
        raise SystemExit(f"Source archive not found: {args.source}")
    if not DATA_PATH.is_file():
        raise SystemExit(f"Dictionary data not found: {DATA_PATH}")

    document = html.fromstring(args.source.read_bytes())
    imported = parse_entries(find_artisan_panel(document))
    if not imported:
        raise SystemExit("No artisan entries were parsed.")

    existing = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    retained = [
        entry
        for entry in existing
        if not str(entry.get("id", "")).startswith(ENTRY_PREFIX)
    ]
    category_marks = {"차용어": "●", "순수어": "○", "합성어": "◉"}
    for entry in retained:
        if entry.get("category") == "기존어":
            entry["category"] = "차용어"
        if not entry.get("isKraft") and not entry.get("wordMarks"):
            mark = category_marks.get(str(entry.get("category", "")))
            if mark:
                entry["wordMarks"] = mark
    combined = reindex([*retained, *imported])
    DATA_PATH.write_text(
        json.dumps(combined, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    gaya_count = sum(1 for entry in imported if entry["word"] == GAYA)
    print(f"Imported {len(imported)} unique artisan terms.")
    print(f"Gaya entries: {gaya_count}")
    print(f"Dictionary total: {len(combined)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
