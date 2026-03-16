from __future__ import annotations

import os
import re
from dataclasses import dataclass, field
from pathlib import Path

import yaml


@dataclass
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 9090


@dataclass
class ShareConfig:
    name: str = ""
    type: str = "movies"  # "movies" or "tv"
    smb_url: str = ""
    username: str = ""
    password: str = ""


@dataclass
class TmdbConfig:
    api_key: str = ""
    language: str = "en"


@dataclass
class ScannerConfig:
    extensions: list[str] = field(default_factory=lambda: [
        ".mkv", ".mp4", ".avi", ".m4v", ".ts", ".mov", ".wmv", ".flv", ".webm",
    ])
    exclude_patterns: list[str] = field(default_factory=lambda: [
        "**/sample/**", "**/extras/**", "**/.recycle/**",
    ])
    scan_interval_hours: int = 6


@dataclass
class AppConfig:
    server: ServerConfig = field(default_factory=ServerConfig)
    shares: list[ShareConfig] = field(default_factory=list)
    tmdb: TmdbConfig = field(default_factory=TmdbConfig)
    scanner: ScannerConfig = field(default_factory=ScannerConfig)
    data_dir: str = "./data"


_ENV_VAR_PATTERN = re.compile(r"\$\{(\w+)\}")


def _interpolate_env(value: str) -> str:
    """Replace ${VAR_NAME} with environment variable values."""
    def replacer(match: re.Match) -> str:
        var_name = match.group(1)
        return os.environ.get(var_name, match.group(0))

    if isinstance(value, str):
        return _ENV_VAR_PATTERN.sub(replacer, value)
    return value


def _interpolate_dict(d: dict) -> dict:
    result = {}
    for k, v in d.items():
        if isinstance(v, dict):
            result[k] = _interpolate_dict(v)
        elif isinstance(v, list):
            result[k] = [_interpolate_dict(i) if isinstance(i, dict) else _interpolate_env(i) if isinstance(i, str) else i for i in v]
        elif isinstance(v, str):
            result[k] = _interpolate_env(v)
        else:
            result[k] = v
    return result


def load_config(config_path: str | Path = "/config/config.yaml") -> AppConfig:
    """Load configuration from YAML file with environment variable interpolation."""
    path = Path(config_path)

    if not path.exists():
        alt_paths = [
            Path("config.yaml"),
            Path("config/config.yaml"),
            Path(os.environ.get("LLM_CONFIG_PATH", "")),
        ]
        for alt in alt_paths:
            if alt and alt.exists():
                path = alt
                break

    raw: dict = {}
    if path.exists():
        with open(path) as f:
            raw = yaml.safe_load(f) or {}

    raw = _interpolate_dict(raw)

    server_data = raw.get("server", {})
    server = ServerConfig(
        host=server_data.get("host", "0.0.0.0"),
        port=int(server_data.get("port", 9090)),
    )

    shares = []
    for s in raw.get("shares", []):
        shares.append(ShareConfig(
            name=s.get("name", ""),
            type=s.get("type", "movies"),
            smb_url=s.get("smb_url", ""),
            username=s.get("username", ""),
            password=s.get("password", ""),
        ))

    tmdb_data = raw.get("tmdb", {})
    tmdb = TmdbConfig(
        api_key=tmdb_data.get("api_key", os.environ.get("TMDB_API_KEY", "")),
        language=tmdb_data.get("language", "en"),
    )

    scanner_data = raw.get("scanner", {})
    _defaults = ScannerConfig()
    scanner = ScannerConfig(
        extensions=scanner_data.get("extensions", _defaults.extensions),
        exclude_patterns=scanner_data.get("exclude_patterns", _defaults.exclude_patterns),
        scan_interval_hours=int(scanner_data.get("scan_interval_hours", 6)),
    )

    return AppConfig(
        server=server,
        shares=shares,
        tmdb=tmdb,
        scanner=scanner,
        data_dir=raw.get("data_dir", "./data"),
    )
