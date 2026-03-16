from __future__ import annotations

import asyncio
from typing import Any

import httpx

from app.config import TmdbConfig
from app.utils.logging import get_logger

log = get_logger(__name__)

TMDB_BASE = "https://api.themoviedb.org/3"
TMDB_IMG_BASE = "https://image.tmdb.org/t/p"
_rate_lock = asyncio.Lock()
_last_request_time: float = 0


class TmdbClient:
    def __init__(self, config: TmdbConfig):
        self._api_key = config.api_key
        self._language = config.language
        self._client = httpx.AsyncClient(timeout=15.0)

    async def close(self) -> None:
        await self._client.aclose()

    async def _get(self, path: str, params: dict | None = None) -> dict:
        global _last_request_time
        async with _rate_lock:
            now = asyncio.get_event_loop().time()
            elapsed = now - _last_request_time
            if elapsed < 0.5:
                await asyncio.sleep(0.5 - elapsed)
            _last_request_time = asyncio.get_event_loop().time()

        all_params = {"api_key": self._api_key, "language": self._language}
        if params:
            all_params.update(params)

        url = f"{TMDB_BASE}/{path.lstrip('/')}"
        resp = await self._client.get(url, params=all_params)
        resp.raise_for_status()
        return resp.json()

    async def search_movie(self, title: str, year: int | None = None) -> list[dict]:
        params: dict[str, Any] = {"query": title}
        if year:
            params["year"] = year
        data = await self._get("search/movie", params)
        return data.get("results", [])

    async def search_tv(self, title: str, year: int | None = None) -> list[dict]:
        params: dict[str, Any] = {"query": title}
        if year:
            params["first_air_date_year"] = year
        data = await self._get("search/tv", params)
        return data.get("results", [])

    async def get_movie(self, movie_id: int) -> dict:
        return await self._get(f"movie/{movie_id}")

    async def get_tv(self, tv_id: int) -> dict:
        return await self._get(f"tv/{tv_id}")

    async def get_tv_season(self, tv_id: int, season: int) -> dict:
        return await self._get(f"tv/{tv_id}/season/{season}")

    async def validate_key(self) -> bool:
        try:
            await self._get("configuration")
            return True
        except Exception:
            return False

    @staticmethod
    def poster_url(path: str | None, size: str = "w342") -> str | None:
        if not path:
            return None
        return f"{TMDB_IMG_BASE}/{size}{path}"

    @staticmethod
    def backdrop_url(path: str | None, size: str = "w1280") -> str | None:
        if not path:
            return None
        return f"{TMDB_IMG_BASE}/{size}{path}"
