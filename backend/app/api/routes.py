from __future__ import annotations

import asyncio

from fastapi import APIRouter, Request

from app.api.models import (
    HealthResponse, StatusResponse, ShareStatus, LibraryResponse,
    EpisodesResponse, EpisodeItem, RescanResponse, ConfigValidation,
    MovieItem, ShowItem, UnmatchedItem, StatsInfo, ErrorResponse, ErrorDetail,
)
from app.library.db import Database
from app.library.library import Library
from app.scanner.scanner import Scanner
from app.matcher.matcher import Matcher
from app.matcher.tmdb_client import TmdbClient
from app.config import AppConfig
from app.utils.logging import get_logger
from app.streaming.proxy import stream_file

log = get_logger(__name__)

router = APIRouter(prefix="/api")

# These are injected at startup from main.py
_db: Database | None = None
_config: AppConfig | None = None
_scanner: Scanner | None = None
_matcher: Matcher | None = None
_tmdb: TmdbClient | None = None
_library: Library | None = None


def init_routes(db: Database, config: AppConfig, scanner: Scanner,
                matcher: Matcher, tmdb: TmdbClient, library: Library) -> None:
    global _db, _config, _scanner, _matcher, _tmdb, _library
    _db = db
    _config = config
    _scanner = scanner
    _matcher = matcher
    _tmdb = tmdb
    _library = library


@router.get("/health", response_model=HealthResponse)
async def health():
    return HealthResponse()


@router.get("/status", response_model=StatusResponse)
async def status():
    shares = []
    for share in _config.shares:
        source = _scanner.get_source(share.name) if _scanner else None
        files = await _db.get_files_by_share(share.name) if _db else []
        shares.append(ShareStatus(
            name=share.name,
            type=share.type,
            connected=source.connected if source else False,
            file_count=len(files),
        ))

    stats = await _db.get_stats() if _db else {}
    return StatusResponse(
        shares=shares,
        scan_in_progress=_scanner.is_scanning if _scanner else False,
        last_scan=stats.get("last_scan"),
        total_files=stats.get("total_files", 0),
        matched_movies=stats.get("matched_movies", 0),
        matched_episodes=stats.get("matched_episodes", 0),
        unmatched=stats.get("unmatched", 0),
    )


@router.get("/library", response_model=LibraryResponse)
async def library():
    data = await _library.get_full_library()
    return LibraryResponse(
        movies=[MovieItem(**m) for m in data["movies"]],
        shows=[ShowItem(**s) for s in data["shows"]],
        unmatched=[UnmatchedItem(**u) for u in data["unmatched"]],
        stats=StatsInfo(**data["stats"]),
    )


@router.get("/movies", response_model=list[MovieItem])
async def movies():
    data = await _library.get_movies()
    return [MovieItem(**m) for m in data]


@router.get("/shows", response_model=list[ShowItem])
async def shows():
    data = await _library.get_shows()
    return [ShowItem(**s) for s in data]


@router.get("/shows/{show_id}/seasons/{season}/episodes", response_model=EpisodesResponse)
async def episodes(show_id: int, season: int):
    eps = await _library.get_episodes(show_id, season)

    # Get show title from cache
    show_title = ""
    tmdb_cache = await _db.get_tmdb_cache(show_id, "tv") if _db else None
    if tmdb_cache:
        meta = tmdb_cache.get("metadata", {})
        show_title = meta.get("name", meta.get("title", ""))

    return EpisodesResponse(
        show_id=show_id,
        show_title=show_title,
        season=season,
        episodes=[EpisodeItem(**e) for e in eps],
    )


@router.get("/unmatched", response_model=list[UnmatchedItem])
async def unmatched():
    data = await _library.get_unmatched()
    return [UnmatchedItem(**u) for u in data]


@router.get("/stream/{item_id}")
async def stream(item_id: str, request: Request):
    return await stream_file(
        item_id, request, _db,
        {name: _scanner.get_source(name) for name in
         [s.name for s in _config.shares] if _scanner.get_source(name)},
        _config,
    )


@router.post("/rescan", response_model=RescanResponse)
async def rescan():
    if _scanner.is_scanning:
        return RescanResponse(status="already_running", message="Scan already in progress")

    async def _run_scan():
        scan_id = await _scanner.scan_all()
        if _matcher:
            matched, unmatched = await _matcher.match_all_unmatched()
            log.info("matching_complete", matched=matched, unmatched=unmatched)

    asyncio.create_task(_run_scan())
    return RescanResponse(status="started", message="Library rescan started")


@router.get("/config/validate", response_model=ConfigValidation)
async def validate_config():
    errors = []
    shares_ok = True
    tmdb_ok = False

    if not _config.shares:
        errors.append("No shares configured")
        shares_ok = False

    for share in _config.shares:
        source = _scanner.get_source(share.name) if _scanner else None
        if not source or not source.connected:
            errors.append(f"Share '{share.name}' is not connected")
            shares_ok = False

    if _tmdb:
        tmdb_ok = await _tmdb.validate_key()
        if not tmdb_ok:
            errors.append("TMDB API key is invalid or unreachable")

    return ConfigValidation(shares_ok=shares_ok, tmdb_ok=tmdb_ok, errors=errors)
