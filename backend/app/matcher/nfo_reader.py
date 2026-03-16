from __future__ import annotations

import re
import xml.etree.ElementTree as ET
from dataclasses import dataclass
from pathlib import PurePosixPath

import smbclient

from app.utils.logging import get_logger

log = get_logger(__name__)


@dataclass
class NfoIds:
    tmdb_id: int | None = None
    imdb_id: str | None = None


def read_nfo_ids(smb_base_path: str, media_file_path: str) -> NfoIds | None:
    """
    Look for a .nfo sidecar file next to the media file and extract TMDB/IMDB IDs.
    Supports Kodi-style NFO format.
    """
    media_path = PurePosixPath(media_file_path)
    nfo_candidates = [
        media_path.with_suffix(".nfo"),
        media_path.parent / "movie.nfo",
        media_path.parent / "tvshow.nfo",
    ]

    for nfo_rel in nfo_candidates:
        nfo_smb = rf"{smb_base_path}\{str(nfo_rel).replace('/', chr(92))}"
        try:
            with smbclient.open_file(nfo_smb, mode="r", encoding="utf-8") as f:
                content = f.read(16384)  # cap at 16KB
            return _parse_nfo(content)
        except FileNotFoundError:
            continue
        except Exception as e:
            log.debug("nfo_read_error", path=str(nfo_rel), error=str(e))
            continue

    return None


def _parse_nfo(content: str) -> NfoIds | None:
    ids = NfoIds()

    # Check if it's just a URL (some NFOs are just an IMDB URL)
    imdb_url = re.search(r"imdb\.com/title/(tt\d+)", content)
    if imdb_url:
        ids.imdb_id = imdb_url.group(1)

    tmdb_url = re.search(r"themoviedb\.org/(?:movie|tv)/(\d+)", content)
    if tmdb_url:
        ids.tmdb_id = int(tmdb_url.group(1))

    # Try XML parsing for Kodi-style NFOs
    try:
        root = ET.fromstring(content)

        for tag in ("tmdbid", "tmdb"):
            el = root.find(tag)
            if el is not None and el.text and el.text.strip().isdigit():
                ids.tmdb_id = int(el.text.strip())

        for uid in root.findall(".//uniqueid"):
            uid_type = uid.get("type", "").lower()
            if uid_type == "tmdb" and uid.text and uid.text.strip().isdigit():
                ids.tmdb_id = int(uid.text.strip())
            elif uid_type == "imdb" and uid.text:
                ids.imdb_id = uid.text.strip()

        if not ids.imdb_id:
            for tag in ("imdbid", "imdb", "id"):
                el = root.find(tag)
                if el is not None and el.text and el.text.strip().startswith("tt"):
                    ids.imdb_id = el.text.strip()
                    break

    except ET.ParseError:
        pass

    if ids.tmdb_id or ids.imdb_id:
        return ids
    return None
