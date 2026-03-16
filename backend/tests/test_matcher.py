from app.matcher.matcher import _score_results
from app.matcher.parser import ParsedMedia


def test_exact_match_high_confidence():
    results = [
        {"id": 603, "title": "The Matrix", "original_title": "The Matrix",
         "release_date": "1999-03-31", "popularity": 80.0},
    ]
    parsed = ParsedMedia(title="The Matrix", year=1999, media_type="movie")
    best, confidence = _score_results(results, parsed, "movie")
    assert best is not None
    assert best["id"] == 603
    assert confidence >= 0.8


def test_fuzzy_match():
    results = [
        {"id": 603, "title": "The Matrix", "original_title": "The Matrix",
         "release_date": "1999-03-31", "popularity": 80.0},
    ]
    parsed = ParsedMedia(title="Matrix", year=1999, media_type="movie")
    best, confidence = _score_results(results, parsed, "movie")
    assert best is not None
    assert confidence >= 0.5


def test_no_results():
    best, confidence = _score_results([], ParsedMedia(title="Test"), "movie")
    assert best is None
    assert confidence == 0.0


def test_no_title():
    best, confidence = _score_results(
        [{"id": 1, "title": "Test", "release_date": "", "popularity": 1}],
        ParsedMedia(title=None),
        "movie"
    )
    assert best is None
    assert confidence == 0.0


def test_year_mismatch_lowers_score():
    results = [
        {"id": 1, "title": "The Matrix", "original_title": "The Matrix",
         "release_date": "2021-12-22", "popularity": 50.0},
    ]
    parsed = ParsedMedia(title="The Matrix", year=1999, media_type="movie")
    best, confidence = _score_results(results, parsed, "movie")
    # Should still match on title but year mismatch means lower score
    assert best is not None
    assert confidence < 0.9


def test_tv_scoring():
    results = [
        {"id": 1396, "name": "Breaking Bad", "original_name": "Breaking Bad",
         "first_air_date": "2008-01-20", "popularity": 200.0},
    ]
    parsed = ParsedMedia(title="Breaking Bad", year=2008, media_type="episode")
    best, confidence = _score_results(results, parsed, "tv")
    assert best is not None
    assert best["id"] == 1396
    assert confidence >= 0.8


def test_popularity_boost():
    results = [
        {"id": 1, "title": "Test Movie", "original_title": "Test Movie",
         "release_date": "2020-01-01", "popularity": 100.0},
        {"id": 2, "title": "Test Movie", "original_title": "Test Movie",
         "release_date": "2020-01-01", "popularity": 1.0},
    ]
    parsed = ParsedMedia(title="Test Movie", year=2020, media_type="movie")
    best, confidence = _score_results(results, parsed, "movie")
    assert best["id"] == 1  # higher popularity should win
