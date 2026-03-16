from __future__ import annotations

import asyncio
import datetime

from app.config import AppConfig
from app.library.db import Database
from app.scanner.file_filter import FileFilter
from app.scanner.smb_source import SmbSource, make_file_id
from app.utils.logging import get_logger

log = get_logger(__name__)


class Scanner:
    def __init__(self, config: AppConfig, db: Database):
        self._config = config
        self._db = db
        self._scanning = False
        self._sources: dict[str, SmbSource] = {}

    @property
    def is_scanning(self) -> bool:
        return self._scanning

    def get_source(self, share_name: str) -> SmbSource | None:
        return self._sources.get(share_name)

    async def connect_shares(self) -> dict[str, bool]:
        results = {}
        for share in self._config.shares:
            source = SmbSource(share)
            try:
                await asyncio.to_thread(source.connect)
                self._sources[share.name] = source
                results[share.name] = True
            except Exception as e:
                log.error("share_connect_failed", share=share.name, error=str(e))
                results[share.name] = False
        return results

    async def scan_all(self) -> str:
        if self._scanning:
            log.warn("scan_already_running")
            return ""

        scan_id = f"scan_{datetime.datetime.now(datetime.UTC).strftime('%Y%m%d_%H%M%S')}"
        self._scanning = True
        await self._db.insert_scan(scan_id)

        total_found = 0
        file_filter = FileFilter(
            self._config.scanner.extensions,
            self._config.scanner.exclude_patterns,
        )

        try:
            for share in self._config.shares:
                source = self._sources.get(share.name)
                if not source or not source.connected:
                    log.warn("share_not_connected", share=share.name)
                    continue

                log.info("scanning_share", share=share.name)
                files = await asyncio.to_thread(source.walk)
                current_paths: set[str] = set()

                for f in files:
                    if not file_filter.should_include(f.path):
                        continue

                    file_id = make_file_id(share.name, f.path)
                    current_paths.add(f.path)

                    unchanged = await self._db.file_unchanged(file_id, f.size, f.mtime)
                    if unchanged:
                        continue

                    media_type = share.type
                    await self._db.upsert_file(
                        file_id=file_id,
                        file_path=f.path,
                        file_name=f.name,
                        share_name=share.name,
                        media_type=media_type,
                        file_size=f.size,
                        file_mtime=f.mtime,
                    )
                    total_found += 1

                deleted = await self._db.delete_missing_files(share.name, current_paths)
                if deleted:
                    log.info("removed_missing_files", share=share.name, count=deleted)

                log.info("share_scanned", share=share.name, new_files=total_found)

        except Exception as e:
            log.error("scan_error", error=str(e))
        finally:
            stats = await self._db.get_stats()
            await self._db.complete_scan(
                scan_id,
                files_found=stats["total_files"],
                files_matched=stats["matched_movies"] + stats["matched_episodes"],
                files_unmatched=stats["unmatched"],
            )
            self._scanning = False
            log.info("scan_completed", scan_id=scan_id, total_found=total_found)

        return scan_id
