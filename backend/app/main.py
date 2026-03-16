from __future__ import annotations

import asyncio
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import load_config, AppConfig
from app.library.db import Database
from app.library.library import Library
from app.scanner.scanner import Scanner
from app.matcher.matcher import Matcher
from app.matcher.tmdb_client import TmdbClient
from app.api.routes import router, init_routes
from app.utils.logging import setup_logging, get_logger

log = get_logger(__name__)

_config: AppConfig | None = None
_db: Database | None = None
_scanner: Scanner | None = None
_matcher: Matcher | None = None
_tmdb: TmdbClient | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _config, _db, _scanner, _matcher, _tmdb

    setup_logging()
    log.info("starting_lampa_local_media_backend", version="0.1.0")

    _config = load_config()
    log.info("config_loaded", shares=len(_config.shares),
             port=_config.server.port)

    _db = Database(_config.data_dir)
    await _db.connect()

    _tmdb = TmdbClient(_config.tmdb)

    _scanner = Scanner(_config, _db)
    connect_results = await _scanner.connect_shares()
    for name, ok in connect_results.items():
        log.info("share_status", share=name, connected=ok)

    _matcher = Matcher(_config, _db, _tmdb,
                       {s.name: _scanner.get_source(s.name) for s in _config.shares
                        if _scanner.get_source(s.name)})

    library = Library(_db)
    init_routes(_db, _config, _scanner, _matcher, _tmdb, library)

    # Initial scan on startup
    async def _initial_scan():
        scan_id = await _scanner.scan_all()
        if scan_id:
            matched, unmatched_count = await _matcher.match_all_unmatched()
            log.info("initial_scan_complete", matched=matched, unmatched=unmatched_count)

    asyncio.create_task(_initial_scan())

    yield

    # Shutdown
    if _tmdb:
        await _tmdb.close()
    if _db:
        await _db.close()
    log.info("shutdown_complete")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Lampa Local Media Backend",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router)
    return app


app = create_app()


def cli():
    import uvicorn
    config = load_config()
    uvicorn.run(
        "app.main:app",
        host=config.server.host,
        port=config.server.port,
        reload=False,
    )


if __name__ == "__main__":
    cli()
