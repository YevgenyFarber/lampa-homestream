from __future__ import annotations

import hashlib
from dataclasses import dataclass
from urllib.parse import urlparse

import smbclient
from smbclient import scandir as smb_scandir

from app.config import ShareConfig
from app.utils.logging import get_logger

log = get_logger(__name__)


@dataclass
class FileEntry:
    path: str
    name: str
    size: int
    mtime: float
    is_dir: bool


class SmbSource:
    def __init__(self, share: ShareConfig):
        self._share = share
        self._parsed = urlparse(share.smb_url)
        self._host = self._parsed.hostname or ""
        path_parts = self._parsed.path.strip("/").split("/", 1)
        self._share_name = path_parts[0]
        self._root_subdir = path_parts[1] if len(path_parts) > 1 else ""
        self._connected = False

    def connect(self) -> None:
        try:
            smbclient.register_session(
                self._host,
                username=self._share.username,
                password=self._share.password,
            )
            self._connected = True
            log.info("smb_connected", host=self._host, share=self._share_name,
                     subdir=self._root_subdir or "/")
        except Exception as e:
            log.error("smb_connection_failed", host=self._host, error=str(e))
            raise

    @property
    def connected(self) -> bool:
        return self._connected

    def _smb_path(self, relative: str = "") -> str:
        base = rf"\\{self._host}\{self._share_name}"
        if self._root_subdir:
            base = rf"{base}\{self._root_subdir.replace('/', chr(92))}"
        if relative:
            base = rf"{base}\{relative.replace('/', chr(92))}"
        return base

    def list_files(self, subpath: str = "") -> list[FileEntry]:
        smb_path = self._smb_path(subpath)
        entries = []
        try:
            for entry in smb_scandir(smb_path):
                stat_info = entry.stat()
                entries.append(FileEntry(
                    path=(subpath + "/" + entry.name).lstrip("/") if subpath else entry.name,
                    name=entry.name,
                    size=stat_info.st_size,
                    mtime=stat_info.st_mtime,
                    is_dir=entry.is_dir(),
                ))
        except Exception as e:
            log.error("smb_list_error", path=smb_path, error=str(e))
        return entries

    def walk(self, subpath: str = "") -> list[FileEntry]:
        """Recursively walk all files under the share, collapsing BDMV structures."""
        all_files: list[FileEntry] = []
        stack = [subpath]

        while stack:
            current = stack.pop()
            entries = self.list_files(current)

            subdirs = {e.name: e for e in entries if e.is_dir}
            if "BDMV" in subdirs:
                bdmv_entry = self._resolve_bdmv(current)
                if bdmv_entry:
                    all_files.append(bdmv_entry)
                    continue

            for entry in entries:
                if entry.is_dir:
                    stack.append(entry.path)
                else:
                    all_files.append(entry)

        return all_files

    def _resolve_bdmv(self, folder_path: str) -> FileEntry | None:
        """Find the largest .m2ts in BDMV/STREAM and return it as a single entry."""
        stream_path = f"{folder_path}/BDMV/STREAM" if folder_path else "BDMV/STREAM"
        try:
            stream_entries = self.list_files(stream_path)
        except Exception:
            return None

        m2ts = [e for e in stream_entries if not e.is_dir and e.name.endswith(".m2ts")]
        if not m2ts:
            return None

        largest = max(m2ts, key=lambda e: e.size)
        folder_name = folder_path.split("/")[-1] if "/" in folder_path else folder_path
        return FileEntry(
            path=largest.path,
            name=folder_name or largest.name,
            size=largest.size,
            mtime=largest.mtime,
            is_dir=False,
        )

    def open_file(self, relative_path: str, offset: int = 0):
        """Open a file for reading. Returns a file-like object."""
        smb_path = self._smb_path(relative_path)
        f = smbclient.open_file(smb_path, mode="rb")
        if offset > 0:
            f.seek(offset)
        return f

    def file_stat(self, relative_path: str) -> FileEntry:
        smb_path = self._smb_path(relative_path)
        stat_info = smbclient.stat(smb_path)
        name = relative_path.split("/")[-1] if "/" in relative_path else relative_path
        return FileEntry(
            path=relative_path,
            name=name,
            size=stat_info.st_size,
            mtime=stat_info.st_mtime,
            is_dir=False,
        )


def make_file_id(share_name: str, file_path: str) -> str:
    raw = f"{share_name}::{file_path}"
    return hashlib.md5(raw.encode()).hexdigest()[:12]
