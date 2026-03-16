from __future__ import annotations

import asyncio
from difflib import SequenceMatcher

from app.config import AppConfig, ShareConfig
from app.library.db import Database
from app.matcher.parser import parse_filename, ParsedMedia
from app.matcher.tmdb_client import TmdbClient
from app.matcher.nfo_reader import read_nfo_ids
from app.scanner.smb_source import SmbSource
from app.utils.logging import get_logger

log = get_logger(__name__)


class Matcher:
    def __init__(self, config: AppConfig, db: Database, tmdb: TmdbClient,
                 sources: dict[str, SmbSource]):
        self._config = config
        self._db = db
        self._tmdb = tmdb
        self._sources = sources

    async def match_all_unmatched(self) -> tuple[int, int]:
        """Match all unmatched files. Returns (matched_count, unmatched_count)."""
        files = await self._db.get_all_files()
        matched_count = 0
        unmatched_count = 0

        share_map = {s.name: s for s in self._config.shares}

        for f in files:
            existing = await self._db.get_match(f["id"])
            if existing:
                matched_count += 1
                continue

            share_conf = share_map.get(f["share_name"])
            share_type = share_conf.type if share_conf else ""

            folder_path = "/".join(f["file_path"].split("/")[:-1])
            parsed = parse_filename(f["file_name"], folder_path, share_type)

            await self._db.upsert_file(
                file_id=f["id"],
                file_path=f["file_path"],
                file_name=f["file_name"],
                share_name=f["share_name"],
                media_type=parsed.media_type,
                file_size=f["file_size"],
                file_mtime=f["file_mtime"],
                parsed_title=parsed.title,
                parsed_year=parsed.year,
                parsed_season=parsed.season,
                parsed_episode=parsed.episode,
            )

            # Try NFO first
            nfo_match = await self._try_nfo_match(f, share_conf)
            if nfo_match:
                matched_count += 1
                continue

            # Try TMDB search
            if parsed.title:
                tmdb_match = await self._try_tmdb_match(f["id"], parsed)
                if tmdb_match:
                    matched_count += 1
                    continue

            unmatched_count += 1
            log.debug("unmatched_file", file=f["file_name"], parsed_title=parsed.title)

        return matched_count, unmatched_count

    async def _try_nfo_match(self, file_row: dict, share_conf: ShareConfig | None) -> bool:
        if not share_conf:
            return False

        source = self._sources.get(share_conf.name)
        if not source:
            return False

        try:
            from urllib.parse import urlparse
            parsed_url = urlparse(share_conf.smb_url)
            host = parsed_url.hostname or ""
            share_path = parsed_url.path.lstrip("/")
            smb_base = rf"\\{host}\{share_path}"

            nfo_ids = await asyncio.to_thread(read_nfo_ids, smb_base, file_row["file_path"])
            if not nfo_ids:
                return False

            if nfo_ids.tmdb_id:
                media_type = "tv" if share_conf.type == "tv" else "movie"
                await self._fetch_and_cache(nfo_ids.tmdb_id, media_type)
                await self._db.upsert_match(
                    file_row["id"], nfo_ids.tmdb_id, media_type, 1.0, "nfo"
                )
                log.info("nfo_match", file=file_row["file_name"], tmdb_id=nfo_ids.tmdb_id)
                return True

            if nfo_ids.imdb_id:
                tmdb_id = await self._find_by_imdb(nfo_ids.imdb_id, share_conf.type)
                if tmdb_id:
                    media_type = "tv" if share_conf.type == "tv" else "movie"
                    await self._fetch_and_cache(tmdb_id, media_type)
                    await self._db.upsert_match(
                        file_row["id"], tmdb_id, media_type, 1.0, "nfo"
                    )
                    return True

        except Exception as e:
            log.debug("nfo_match_error", error=str(e))
        return False

    async def _try_tmdb_match(self, file_id: str, parsed: ParsedMedia) -> bool:
        try:
            if parsed.media_type == "episode":
                results = await self._tmdb.search_tv(parsed.title, parsed.year)
                media_type = "tv"
            else:
                results = await self._tmdb.search_movie(parsed.title, parsed.year)
                media_type = "movie"

            if not results:
                # Try opposite type as fallback
                if media_type == "movie":
                    results = await self._tmdb.search_tv(parsed.title, parsed.year)
                    media_type = "tv"
                else:
                    results = await self._tmdb.search_movie(parsed.title, parsed.year)
                    media_type = "movie"

            if not results:
                return False

            best, confidence = _score_results(results, parsed, media_type)
            if not best or confidence < 0.5:
                return False

            tmdb_id = best["id"]
            await self._fetch_and_cache(tmdb_id, media_type)
            await self._db.upsert_match(file_id, tmdb_id, media_type, confidence, "auto")
            log.info("tmdb_match", title=parsed.title, tmdb_id=tmdb_id,
                     confidence=f"{confidence:.2f}")
            return True

        except Exception as e:
            log.error("tmdb_match_error", title=parsed.title, error=str(e))
            return False

    async def _fetch_and_cache(self, tmdb_id: int, media_type: str) -> None:
        cached = await self._db.get_tmdb_cache(tmdb_id, media_type)
        if cached:
            return

        try:
            if media_type == "tv":
                data = await self._tmdb.get_tv(tmdb_id)
                year = None
                fad = data.get("first_air_date", "")
                if fad and len(fad) >= 4:
                    year = int(fad[:4])
                meta = {
                    "name": data.get("name"),
                    "title": data.get("name"),
                    "original_name": data.get("original_name"),
                    "overview": data.get("overview", ""),
                    "genres": data.get("genres", []),
                    "vote_average": data.get("vote_average"),
                    "year": year,
                    "number_of_seasons": data.get("number_of_seasons"),
                }
            else:
                data = await self._tmdb.get_movie(tmdb_id)
                year = None
                rd = data.get("release_date", "")
                if rd and len(rd) >= 4:
                    year = int(rd[:4])
                meta = {
                    "title": data.get("title"),
                    "original_title": data.get("original_title"),
                    "overview": data.get("overview", ""),
                    "genres": data.get("genres", []),
                    "vote_average": data.get("vote_average"),
                    "year": year,
                }

            poster = TmdbClient.poster_url(data.get("poster_path"))
            backdrop = TmdbClient.backdrop_url(data.get("backdrop_path"))
            await self._db.cache_tmdb(tmdb_id, media_type, meta, poster, backdrop)

        except Exception as e:
            log.error("tmdb_cache_error", tmdb_id=tmdb_id, error=str(e))

    async def _find_by_imdb(self, imdb_id: str, share_type: str) -> int | None:
        try:
            from app.matcher.tmdb_client import TMDB_BASE
            resp = await self._tmdb._client.get(
                f"{TMDB_BASE}/find/{imdb_id}",
                params={
                    "api_key": self._tmdb._api_key,
                    "external_source": "imdb_id",
                    "language": self._tmdb._language,
                }
            )
            data = resp.json()
            if share_type == "tv" and data.get("tv_results"):
                return data["tv_results"][0]["id"]
            if data.get("movie_results"):
                return data["movie_results"][0]["id"]
            if data.get("tv_results"):
                return data["tv_results"][0]["id"]
        except Exception as e:
            log.debug("imdb_lookup_error", imdb_id=imdb_id, error=str(e))
        return None


def _score_results(results: list[dict], parsed: ParsedMedia, media_type: str) -> tuple[dict | None, float]:
    if not results or not parsed.title:
        return None, 0.0

    scored: list[tuple[dict, float]] = []
    target_title = parsed.title.lower()

    for r in results[:10]:
        score = 0.0

        if media_type == "tv":
            tmdb_title = (r.get("name") or "").lower()
            tmdb_original = (r.get("original_name") or "").lower()
            tmdb_date = r.get("first_air_date", "")
        else:
            tmdb_title = (r.get("title") or "").lower()
            tmdb_original = (r.get("original_title") or "").lower()
            tmdb_date = r.get("release_date", "")

        title_sim = SequenceMatcher(None, target_title, tmdb_title).ratio()
        orig_sim = SequenceMatcher(None, target_title, tmdb_original).ratio()
        best_sim = max(title_sim, orig_sim)

        if best_sim > 0.95:
            score += 0.55
        elif best_sim > 0.85:
            score += 0.45
        elif best_sim > 0.7:
            score += 0.30
        elif best_sim > 0.5:
            score += 0.15
        else:
            continue

        if parsed.year and tmdb_date and len(tmdb_date) >= 4:
            tmdb_year = int(tmdb_date[:4])
            if tmdb_year == parsed.year:
                score += 0.30
            elif abs(tmdb_year - parsed.year) <= 1:
                score += 0.15

        pop = r.get("popularity", 0)
        if pop > 50:
            score += 0.10
        elif pop > 10:
            score += 0.05

        score = min(score, 0.99)
        scored.append((r, score))

    if not scored:
        return None, 0.0

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[0]
