from __future__ import annotations

import fnmatch
from pathlib import PurePosixPath


class FileFilter:
    def __init__(self, extensions: list[str], exclude_patterns: list[str]):
        self._extensions = {e.lower() for e in extensions}
        self._exclude_patterns = exclude_patterns

    def is_media_file(self, filename: str) -> bool:
        ext = PurePosixPath(filename).suffix.lower()
        return ext in self._extensions

    def is_excluded(self, path: str) -> bool:
        normalized = path.replace("\\", "/")
        for pattern in self._exclude_patterns:
            if fnmatch.fnmatch(normalized, pattern):
                return True
            if fnmatch.fnmatch(normalized.lower(), pattern.lower()):
                return True
        return False

    def should_include(self, path: str) -> bool:
        if self.is_excluded(path):
            return False
        return self.is_media_file(path)
