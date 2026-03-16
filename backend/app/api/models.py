from __future__ import annotations

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str = "ok"
    version: str = "0.1.0"


class ShareStatus(BaseModel):
    name: str
    type: str
    connected: bool = False
    file_count: int = 0
    last_error: str | None = None


class StatusResponse(BaseModel):
    shares: list[ShareStatus] = []
    scan_in_progress: bool = False
    last_scan: str | None = None
    total_files: int = 0
    matched_movies: int = 0
    matched_episodes: int = 0
    unmatched: int = 0


class GenreItem(BaseModel):
    id: int
    name: str


class MovieItem(BaseModel):
    id: str
    tmdb_id: int | None = None
    title: str
    original_title: str = ""
    year: int | None = None
    overview: str = ""
    poster_url: str | None = None
    backdrop_url: str | None = None
    genres: list[dict] = []
    vote_average: float | None = None
    media_type: str = "movie"
    file_path: str = ""
    file_size: int = 0
    match_confidence: float = 0.0
    match_method: str = "auto"


class ShowItem(BaseModel):
    id: str
    tmdb_id: int | None = None
    title: str
    original_title: str = ""
    year: int | None = None
    overview: str = ""
    poster_url: str | None = None
    backdrop_url: str | None = None
    genres: list[dict] = []
    vote_average: float | None = None
    media_type: str = "tv"
    season_count: int = 0
    seasons: list[int] = []
    episode_count: int = 0
    match_confidence: float = 0.0
    match_method: str = "auto"


class EpisodeItem(BaseModel):
    id: str
    episode_number: int
    title: str = ""
    overview: str = ""
    still_url: str | None = None
    air_date: str | None = None
    file_path: str = ""
    file_size: int = 0


class EpisodesResponse(BaseModel):
    show_id: int
    show_title: str = ""
    season: int
    episodes: list[EpisodeItem] = []


class UnmatchedItem(BaseModel):
    id: str
    file_path: str = ""
    file_name: str = ""
    file_size: int = 0


class StatsInfo(BaseModel):
    total_files: int = 0
    matched_movies: int = 0
    matched_episodes: int = 0
    unmatched: int = 0
    last_scan: str | None = None
    scan_in_progress: bool = False


class LibraryResponse(BaseModel):
    movies: list[MovieItem] = []
    shows: list[ShowItem] = []
    unmatched: list[UnmatchedItem] = []
    stats: StatsInfo = StatsInfo()


class RescanResponse(BaseModel):
    status: str = "started"
    scan_id: str = ""
    message: str = "Library rescan started"


class ErrorDetail(BaseModel):
    code: str
    message: str
    details: dict = {}


class ErrorResponse(BaseModel):
    error: ErrorDetail


class ConfigValidation(BaseModel):
    shares_ok: bool = False
    tmdb_ok: bool = False
    errors: list[str] = []
