from __future__ import annotations

import json
from collections import defaultdict

from app.library.db import Database
from app.utils.logging import get_logger

log = get_logger(__name__)


class Library:
    def __init__(self, db: Database):
        self._db = db

    async def get_movies(self) -> list[dict]:
        matched = await self._db.get_matched_files()
        movies = [m for m in matched if m.get("match_media_type") == "movie"]

        result = []
        for m in movies:
            tmdb = await self._db.get_tmdb_cache(m["tmdb_id"], "movie")
            meta = tmdb["metadata"] if tmdb else {}
            result.append(_build_movie_item(m, meta, tmdb))

        result.sort(key=lambda x: x.get("title", ""))
        return result

    async def get_shows(self) -> list[dict]:
        matched = await self._db.get_matched_files()
        episodes = [m for m in matched if m.get("match_media_type") == "tv"]

        shows_map: dict[int, dict] = {}
        episodes_by_show: dict[int, list[dict]] = defaultdict(list)

        for ep in episodes:
            tmdb_id = ep["tmdb_id"]
            episodes_by_show[tmdb_id].append(ep)

            if tmdb_id not in shows_map:
                tmdb = await self._db.get_tmdb_cache(tmdb_id, "tv")
                meta = tmdb["metadata"] if tmdb else {}
                shows_map[tmdb_id] = _build_show_item(ep, meta, tmdb, [])

        for tmdb_id, show in shows_map.items():
            eps = episodes_by_show[tmdb_id]
            seasons = set()
            for e in eps:
                if e.get("parsed_season"):
                    seasons.add(e["parsed_season"])
            sorted_seasons = sorted(seasons) if seasons else [1]
            show["season_count"] = len(sorted_seasons)
            show["seasons"] = sorted_seasons
            show["episode_count"] = len(eps)

        result = list(shows_map.values())
        result.sort(key=lambda x: x.get("title", ""))
        return result

    async def get_episodes(self, show_tmdb_id: int, season: int) -> list[dict]:
        matched = await self._db.get_matched_files()
        episodes = [
            m for m in matched
            if m.get("match_media_type") == "tv"
            and m.get("tmdb_id") == show_tmdb_id
            and m.get("parsed_season") == season
        ]

        tmdb = await self._db.get_tmdb_cache(show_tmdb_id, "tv")
        show_meta = tmdb["metadata"] if tmdb else {}

        result = []
        for ep in episodes:
            result.append({
                "id": ep["id"],
                "episode_number": ep.get("parsed_episode", 0),
                "title": ep.get("parsed_title", ep.get("file_name", "")),
                "overview": "",
                "still_url": None,
                "air_date": None,
                "file_path": ep["file_path"],
                "file_size": ep["file_size"],
            })

        result.sort(key=lambda x: x.get("episode_number", 0))
        return result

    async def get_unmatched(self) -> list[dict]:
        files = await self._db.get_unmatched_files()
        return [{
            "id": f["id"],
            "file_path": f["file_path"],
            "file_name": f["file_name"],
            "file_size": f["file_size"],
        } for f in files]

    async def get_full_library(self) -> dict:
        movies = await self.get_movies()
        shows = await self.get_shows()
        unmatched = await self.get_unmatched()
        stats = await self._db.get_stats()
        return {
            "movies": movies,
            "shows": shows,
            "unmatched": unmatched,
            "stats": stats,
        }


def _build_movie_item(file_row: dict, meta: dict, tmdb_cache: dict | None) -> dict:
    return {
        "id": file_row["id"],
        "tmdb_id": file_row.get("tmdb_id"),
        "title": meta.get("title", file_row.get("parsed_title", file_row["file_name"])),
        "original_title": meta.get("original_title", ""),
        "year": meta.get("year") or file_row.get("parsed_year"),
        "overview": meta.get("overview", ""),
        "poster_url": tmdb_cache["poster_url"] if tmdb_cache else None,
        "backdrop_url": tmdb_cache["backdrop_url"] if tmdb_cache else None,
        "genres": meta.get("genres", []),
        "vote_average": meta.get("vote_average"),
        "media_type": "movie",
        "file_path": file_row["file_path"],
        "file_size": file_row["file_size"],
        "match_confidence": file_row.get("confidence", 0),
        "match_method": file_row.get("match_method", "auto"),
    }


def _build_show_item(file_row: dict, meta: dict, tmdb_cache: dict | None,
                     episodes: list[dict]) -> dict:
    return {
        "id": f"s_{file_row.get('tmdb_id', '')}",
        "tmdb_id": file_row.get("tmdb_id"),
        "title": meta.get("name", meta.get("title", file_row.get("parsed_title", ""))),
        "original_title": meta.get("original_name", ""),
        "year": meta.get("year") or file_row.get("parsed_year"),
        "overview": meta.get("overview", ""),
        "poster_url": tmdb_cache["poster_url"] if tmdb_cache else None,
        "backdrop_url": tmdb_cache["backdrop_url"] if tmdb_cache else None,
        "genres": meta.get("genres", []),
        "vote_average": meta.get("vote_average"),
        "media_type": "tv",
        "season_count": 0,
        "seasons": [],
        "episode_count": 0,
        "match_confidence": file_row.get("confidence", 0),
        "match_method": file_row.get("match_method", "auto"),
    }
