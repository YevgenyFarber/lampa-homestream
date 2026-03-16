from app.scanner.file_filter import FileFilter


def make_filter():
    return FileFilter(
        extensions=[".mkv", ".mp4", ".avi"],
        exclude_patterns=["**/sample/**", "**/extras/**", "**/.recycle/**"],
    )


def test_media_file_accepted():
    f = make_filter()
    assert f.is_media_file("movie.mkv")
    assert f.is_media_file("Movie.MP4")
    assert f.is_media_file("test.avi")


def test_non_media_rejected():
    f = make_filter()
    assert not f.is_media_file("readme.txt")
    assert not f.is_media_file("poster.jpg")
    assert not f.is_media_file("subtitle.srt")
    assert not f.is_media_file("file")


def test_exclude_sample():
    f = make_filter()
    assert f.is_excluded("movies/Test/sample/sample.mkv")


def test_exclude_extras():
    f = make_filter()
    assert f.is_excluded("movies/Test/extras/behind.mkv")


def test_exclude_recycle():
    f = make_filter()
    assert f.is_excluded("movies/.recycle/old.mkv")


def test_normal_path_not_excluded():
    f = make_filter()
    assert not f.is_excluded("movies/The Matrix (1999)/The.Matrix.mkv")


def test_should_include_combined():
    f = make_filter()
    assert f.should_include("movies/test.mkv")
    assert not f.should_include("movies/test.txt")
    assert not f.should_include("movies/sample/test.mkv")
