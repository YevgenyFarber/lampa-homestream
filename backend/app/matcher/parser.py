from __future__ import annotations

from dataclasses import dataclass
from pathlib import PurePosixPath
import re

from guessit import guessit

_SXXEXX_START = re.compile(r"^[Ss]\d{1,2}[Ee]\d{1,2}")


@dataclass
class ParsedMedia:
    title: str | None = None
    year: int | None = None
    season: int | None = None
    episode: int | None = None
    media_type: str = "movie"  # "movie" or "episode"
    confidence_hint: float = 0.5
    folder_title: str | None = None


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
    folder_title = None

    if folder_path:
        folder_info = _parse_folder_context(folder_path)
        folder_title = folder_info.title

        if _SXXEXX_START.match(filename) and folder_info.title:
            title = folder_info.title
            confidence += 0.2

        if folder_info.title and not title:
            title = folder_info.title
        if folder_info.year and not year:
            year = folder_info.year
        if folder_info.season is not None and season is None:
            season = folder_info.season
        if folder_info.title:
            confidence += 0.1

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
        folder_title=folder_title,
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

        folder_guess = guessit(part, {"type": "episode"})
        fg_title = str(folder_guess.get("title", "")) or None
        fg_year = folder_guess.get("year")
        fg_season = folder_guess.get("season")

        if fg_year and fg_title:
            result.year = fg_year
            result.title = fg_title
        elif fg_title and not result.title and len(part) > 2 and not part.startswith("."):
            result.title = fg_title

        if fg_season is not None and result.season is None:
            result.season = fg_season

    return result
