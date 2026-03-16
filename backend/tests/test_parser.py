import pytest
from app.matcher.parser import parse_filename, ParsedMedia


MOVIE_CASES = [
    ("The.Matrix.1999.1080p.BluRay.x264.mkv", "", "movies",
     {"title": "The Matrix", "year": 1999, "media_type": "movie"}),
    ("Inception.2010.720p.mkv", "", "movies",
     {"title": "Inception", "year": 2010, "media_type": "movie"}),
    ("The.Shawshank.Redemption.1994.REMASTERED.1080p.BluRay.mkv", "", "movies",
     {"title": "The Shawshank Redemption", "year": 1994, "media_type": "movie"}),
    ("Parasite.2019.KOREAN.1080p.mkv", "", "movies",
     {"title": "Parasite", "year": 2019, "media_type": "movie"}),
    ("Avengers.Endgame.2019.2160p.UHD.mkv", "", "movies",
     {"title": "Avengers Endgame", "year": 2019, "media_type": "movie"}),
]

TV_CASES = [
    ("Breaking.Bad.S01E01.Pilot.720p.mkv", "Breaking Bad/Season 01", "tv",
     {"title": "Breaking Bad", "season": 1, "episode": 1, "media_type": "episode"}),
    ("Breaking.Bad.S01E02.mkv", "Breaking Bad/Season 01", "tv",
     {"title": "Breaking Bad", "season": 1, "episode": 2, "media_type": "episode"}),
    ("Game.of.Thrones.S08E06.The.Iron.Throne.mkv", "", "tv",
     {"title": "Game of Thrones", "season": 8, "episode": 6, "media_type": "episode"}),
    ("Dark.S03E08.The.Paradise.720p.NF.WEB-DL.mkv", "", "tv",
     {"title": "Dark", "season": 3, "episode": 8, "media_type": "episode"}),
    ("Chernobyl.S01E05.Vichnaya.Pamyat.1080p.mkv", "", "tv",
     {"title": "Chernobyl", "season": 1, "episode": 5, "media_type": "episode"}),
    ("La.Casa.de.Papel.S01E01.mkv", "", "tv",
     {"title": "La Casa de Papel", "season": 1, "episode": 1, "media_type": "episode"}),
]

FOLDER_CONTEXT_CASES = [
    ("S01E01.mkv", "Breaking Bad/Season 01", "tv",
     {"season": 1, "episode": 1, "media_type": "episode"}),
    ("The.Matrix.1999.mkv", "The Matrix (1999)", "movies",
     {"year": 1999, "media_type": "movie"}),
]


@pytest.mark.parametrize("filename,folder,share_type,expected", MOVIE_CASES)
def test_movie_parsing(filename, folder, share_type, expected):
    result = parse_filename(filename, folder, share_type)
    for key, val in expected.items():
        actual = getattr(result, key)
        assert actual == val, f"{filename}: {key} expected={val!r} got={actual!r}"


@pytest.mark.parametrize("filename,folder,share_type,expected", TV_CASES)
def test_tv_parsing(filename, folder, share_type, expected):
    result = parse_filename(filename, folder, share_type)
    for key, val in expected.items():
        actual = getattr(result, key)
        assert actual == val, f"{filename}: {key} expected={val!r} got={actual!r}"


@pytest.mark.parametrize("filename,folder,share_type,expected", FOLDER_CONTEXT_CASES)
def test_folder_context(filename, folder, share_type, expected):
    result = parse_filename(filename, folder, share_type)
    for key, val in expected.items():
        actual = getattr(result, key)
        assert actual == val, f"{filename}: {key} expected={val!r} got={actual!r}"


def test_parse_returns_parsed_media():
    result = parse_filename("The.Matrix.1999.mkv")
    assert isinstance(result, ParsedMedia)
    assert result.title is not None
    assert result.confidence_hint > 0


def test_unknown_file():
    result = parse_filename("file.mkv")
    assert result.media_type == "movie"
