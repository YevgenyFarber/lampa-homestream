from __future__ import annotations

import json
from pathlib import Path

import aiosqlite

from app.utils.logging import get_logger

log = get_logger(__name__)

SCHEMA = """
CREATE TABLE IF NOT EXISTS media_files (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    share_name TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'unknown',
    file_size INTEGER NOT NULL DEFAULT 0,
    file_mtime REAL NOT NULL DEFAULT 0,
    parsed_title TEXT,
    parsed_year INTEGER,
    parsed_season INTEGER,
    parsed_episode INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS matches (
    file_id TEXT PRIMARY KEY REFERENCES media_files(id),
    tmdb_id INTEGER,
    media_type TEXT NOT NULL DEFAULT 'movie',
    confidence REAL NOT NULL DEFAULT 0,
    match_method TEXT NOT NULL DEFAULT 'auto',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tmdb_cache (
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL,
    metadata TEXT NOT NULL,
    poster_url TEXT,
    backdrop_url TEXT,
    fetched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (tmdb_id, media_type)
);

CREATE TABLE IF NOT EXISTS scan_history (
    id TEXT PRIMARY KEY,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    files_found INTEGER DEFAULT 0,
    files_matched INTEGER DEFAULT 0,
    files_unmatched INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running'
);

CREATE INDEX IF NOT EXISTS idx_media_files_share ON media_files(share_name);
CREATE INDEX IF NOT EXISTS idx_media_files_type ON media_files(media_type);
CREATE INDEX IF NOT EXISTS idx_matches_tmdb ON matches(tmdb_id, media_type);
"""


class Database:
    def __init__(self, data_dir: str = "./data"):
        self._data_dir = Path(data_dir)
        self._data_dir.mkdir(parents=True, exist_ok=True)
        self._db_path = self._data_dir / "library.db"
        self._db: aiosqlite.Connection | None = None

    async def connect(self) -> None:
        self._db = await aiosqlite.connect(str(self._db_path))
        self._db.row_factory = aiosqlite.Row
        await self._db.executescript(SCHEMA)
        await self._db.commit()
        log.info("database_connected", path=str(self._db_path))

    async def close(self) -> None:
        if self._db:
            await self._db.close()
            self._db = None

    @property
    def conn(self) -> aiosqlite.Connection:
        assert self._db is not None, "Database not connected"
        return self._db

    # --- Media Files ---

    async def upsert_file(self, file_id: str, file_path: str, file_name: str,
                          share_name: str, media_type: str, file_size: int,
                          file_mtime: float, parsed_title: str | None = None,
                          parsed_year: int | None = None,
                          parsed_season: int | None = None,
                          parsed_episode: int | None = None) -> None:
        await self.conn.execute("""
            INSERT INTO media_files (id, file_path, file_name, share_name, media_type,
                                     file_size, file_mtime, parsed_title, parsed_year,
                                     parsed_season, parsed_episode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                file_size=excluded.file_size,
                file_mtime=excluded.file_mtime,
                parsed_title=excluded.parsed_title,
                parsed_year=excluded.parsed_year,
                parsed_season=excluded.parsed_season,
                parsed_episode=excluded.parsed_episode
        """, (file_id, file_path, file_name, share_name, media_type,
              file_size, file_mtime, parsed_title, parsed_year,
              parsed_season, parsed_episode))
        await self.conn.commit()

    async def get_file(self, file_id: str) -> dict | None:
        async with self.conn.execute(
            "SELECT * FROM media_files WHERE id = ?", (file_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_all_files(self) -> list[dict]:
        async with self.conn.execute("SELECT * FROM media_files") as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def get_files_by_share(self, share_name: str) -> list[dict]:
        async with self.conn.execute(
            "SELECT * FROM media_files WHERE share_name = ?", (share_name,)
        ) as cursor:
            rows = await cursor.fetchall()
            return [dict(r) for r in rows]

    async def delete_missing_files(self, share_name: str, current_paths: set[str]) -> int:
        existing = await self.get_files_by_share(share_name)
        to_delete = [f["id"] for f in existing if f["file_path"] not in current_paths]
        for fid in to_delete:
            await self.conn.execute("DELETE FROM media_files WHERE id = ?", (fid,))
            await self.conn.execute("DELETE FROM matches WHERE file_id = ?", (fid,))
        await self.conn.commit()
        return len(to_delete)

    async def file_unchanged(self, file_id: str, file_size: int, file_mtime: float) -> bool:
        async with self.conn.execute(
            "SELECT file_size, file_mtime FROM media_files WHERE id = ?", (file_id,)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return False
            return row["file_size"] == file_size and row["file_mtime"] == file_mtime

    # --- Matches ---

    async def upsert_match(self, file_id: str, tmdb_id: int, media_type: str,
                           confidence: float, match_method: str = "auto") -> None:
        await self.conn.execute("""
            INSERT INTO matches (file_id, tmdb_id, media_type, confidence, match_method)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(file_id) DO UPDATE SET
                tmdb_id=excluded.tmdb_id,
                media_type=excluded.media_type,
                confidence=excluded.confidence,
                match_method=excluded.match_method
        """, (file_id, tmdb_id, media_type, confidence, match_method))
        await self.conn.commit()

    async def get_match(self, file_id: str) -> dict | None:
        async with self.conn.execute(
            "SELECT * FROM matches WHERE file_id = ?", (file_id,)
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_matched_files(self) -> list[dict]:
        async with self.conn.execute("""
            SELECT mf.*, m.tmdb_id, m.confidence, m.match_method,
                   m.media_type AS match_media_type
            FROM media_files mf
            JOIN matches m ON mf.id = m.file_id
        """) as cursor:
            return [dict(r) for r in await cursor.fetchall()]

    async def get_unmatched_files(self) -> list[dict]:
        async with self.conn.execute("""
            SELECT mf.* FROM media_files mf
            LEFT JOIN matches m ON mf.id = m.file_id
            WHERE m.file_id IS NULL
        """) as cursor:
            return [dict(r) for r in await cursor.fetchall()]

    # --- TMDB Cache ---

    async def cache_tmdb(self, tmdb_id: int, media_type: str, metadata: dict,
                         poster_url: str | None, backdrop_url: str | None) -> None:
        await self.conn.execute("""
            INSERT INTO tmdb_cache (tmdb_id, media_type, metadata, poster_url, backdrop_url)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(tmdb_id, media_type) DO UPDATE SET
                metadata=excluded.metadata,
                poster_url=excluded.poster_url,
                backdrop_url=excluded.backdrop_url,
                fetched_at=CURRENT_TIMESTAMP
        """, (tmdb_id, media_type, json.dumps(metadata), poster_url, backdrop_url))
        await self.conn.commit()

    async def get_tmdb_cache(self, tmdb_id: int, media_type: str) -> dict | None:
        async with self.conn.execute(
            "SELECT * FROM tmdb_cache WHERE tmdb_id = ? AND media_type = ?",
            (tmdb_id, media_type)
        ) as cursor:
            row = await cursor.fetchone()
            if not row:
                return None
            d = dict(row)
            d["metadata"] = json.loads(d["metadata"])
            return d

    # --- Scan History ---

    async def insert_scan(self, scan_id: str) -> None:
        await self.conn.execute(
            "INSERT INTO scan_history (id) VALUES (?)", (scan_id,)
        )
        await self.conn.commit()

    async def complete_scan(self, scan_id: str, files_found: int,
                            files_matched: int, files_unmatched: int) -> None:
        await self.conn.execute("""
            UPDATE scan_history
            SET completed_at=CURRENT_TIMESTAMP, status='completed',
                files_found=?, files_matched=?, files_unmatched=?
            WHERE id=?
        """, (files_found, files_matched, files_unmatched, scan_id))
        await self.conn.commit()

    async def get_last_scan(self) -> dict | None:
        async with self.conn.execute(
            "SELECT * FROM scan_history ORDER BY started_at DESC LIMIT 1"
        ) as cursor:
            row = await cursor.fetchone()
            return dict(row) if row else None

    async def get_stats(self) -> dict:
        matched = await self.get_matched_files()
        unmatched = await self.get_unmatched_files()
        last_scan = await self.get_last_scan()

        movies = sum(1 for m in matched if m.get("match_media_type") == "movie")
        episodes = sum(1 for m in matched if m.get("match_media_type") == "tv")

        return {
            "total_files": len(matched) + len(unmatched),
            "matched_movies": movies,
            "matched_episodes": episodes,
            "unmatched": len(unmatched),
            "last_scan": last_scan.get("completed_at") if last_scan else None,
            "scan_in_progress": (last_scan.get("status") == "running") if last_scan else False,
        }
