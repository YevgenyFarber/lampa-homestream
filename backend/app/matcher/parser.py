from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath
import re

from guessit import guessit


@dataclass
class ParsedMedia:
    title: str | None = None
    year: int | None = None
    season: int | None = None
    episode: int | None = None
    media_type: str = "movie"  # "movie" or "episode"
    confidence_hint: float = 0.5


def parse_filename(filename: str, folder_path: str = "", share_type: str = "") -> ParsedMedia:
    """
    Parse a media filename into structured data using guessit,
    enriched with folder-name context.
    """
    result = guessit(filename)

    title = str(result.get("title", "")) or None
    year = result.get("year")
    season = result.get("season")
    episode = result.get("episode")
    media_type = result.get("type", "movie")
    if isinstance(episode, list):
        episode = episode[0] if episode else None

    confidence = 0.5

    # Enrich from folder context
    if folder_path:
        folder_info = _parse_folder_context(folder_path)
        if folder_info.title and not title:
            title = folder_info.title
        if folder_info.year and not year:
            year = folder_info.year
        if folder_info.season is not None and season is None:
            season = folder_info.season
        if folder_info.title:
            confidence += 0.1

    # Override media type from share config if guessit is uncertain
    if share_type == "tv" and media_type == "movie" and season is not None:
        media_type = "episode"
    elif share_type == "movies" and media_type == "episode" and season is None:
        media_type = "movie"

    if media_type == "episode" and season is None:
        season = 1

    if title and year:
        confidence = max(confidence, 0.7)
    elif title:
        confidence = max(confidence, 0.5)

    return ParsedMedia(
        title=title,
        year=year,
        season=season,
        episode=episode,
        media_type=media_type,
        confidence_hint=confidence,
    )


def _parse_folder_context(folder_path: str) -> ParsedMedia:
    """Extract title, year, and season from folder structure."""
    parts = PurePosixPath(folder_path).parts
    result = ParsedMedia()

    for part in parts:
        season_match = re.match(r"^[Ss](?:eason\s*)?(\d+)$", part.strip())
        if season_match:
            result.season = int(season_match.group(1))
            continue

        year_match = re.search(r"\((\d{4})\)|\[(\d{4})\]|\.(\d{4})\.", part)
        if year_match:
            result.year = int(next(g for g in year_match.groups() if g))
            name = part[:year_match.start()].strip().rstrip("(").rstrip("[").rstrip(".").strip()
            if name:
                result.title = name

        elif not result.title and len(part) > 2 and not part.startswith("."):
            result.title = part

    return result
