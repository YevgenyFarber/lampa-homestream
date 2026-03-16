"""
Spike 2: Validate guessit parses representative filenames correctly.

Usage:
    pip install guessit
    python spike2_guessit_parse.py

Expected outcome:
    - All test filenames parse to expected title/year/season/episode
    - Report pass/fail per filename
"""

from guessit import guessit

TEST_CASES = [
    # (filename, expected_fields)
    ("The.Matrix.1999.1080p.BluRay.x264.mkv", {"title": "The Matrix", "year": 1999, "type": "movie"}),
    ("The Matrix (1999).mkv", {"title": "The Matrix", "year": 1999, "type": "movie"}),
    ("Inception.2010.720p.mkv", {"title": "Inception", "year": 2010, "type": "movie"}),
    ("Parasite.2019.KOREAN.1080p.mkv", {"title": "Parasite", "year": 2019, "type": "movie"}),
    ("The.Godfather.Part.II.1974.mkv", {"title": "The Godfather Part II", "year": 1974, "type": "movie"}),
    ("Breaking.Bad.S01E01.Pilot.720p.mkv", {"title": "Breaking Bad", "season": 1, "episode": 1, "type": "episode"}),
    ("Breaking.Bad.S01E02.mkv", {"title": "Breaking Bad", "season": 1, "episode": 2, "type": "episode"}),
    ("The.Office.US.S02E03.1080p.mkv", {"title": "The Office US", "season": 2, "episode": 3, "type": "episode"}),
    ("Game.of.Thrones.S08E06.The.Iron.Throne.mkv", {"title": "Game of Thrones", "season": 8, "episode": 6, "type": "episode"}),
    ("Stranger.Things.S04E01.Chapter.One.mkv", {"title": "Stranger Things", "season": 4, "episode": 1, "type": "episode"}),
    ("Friends.1x01.The.Pilot.mkv", {"title": "Friends", "season": 1, "episode": 1, "type": "episode"}),
    ("movie.mkv", {"type": "movie"}),
    ("S01E01.mkv", {"season": 1, "episode": 1, "type": "episode"}),
    ("The.Shawshank.Redemption.1994.REMASTERED.1080p.BluRay.mkv", {"title": "The Shawshank Redemption", "year": 1994, "type": "movie"}),
    ("Avengers.Endgame.2019.2160p.UHD.mkv", {"title": "Avengers Endgame", "year": 2019, "type": "movie"}),
    ("Dark.S03E08.The.Paradise.720p.NF.WEB-DL.mkv", {"title": "Dark", "season": 3, "episode": 8, "type": "episode"}),
    ("Chernobyl.S01E05.Vichnaya.Pamyat.1080p.mkv", {"title": "Chernobyl", "season": 1, "episode": 5, "type": "episode"}),
    ("2001.A.Space.Odyssey.1968.mkv", {"title": "2001 A Space Odyssey", "year": 1968, "type": "movie"}),
    ("La.Casa.de.Papel.S01E01.mkv", {"title": "La Casa de Papel", "season": 1, "episode": 1, "type": "episode"}),
    ("The.100.S01E01.mkv", {"title": "The 100", "season": 1, "episode": 1, "type": "episode"}),
]


def main():
    passed = 0
    failed = 0

    for filename, expected in TEST_CASES:
        result = guessit(filename)
        ok = True
        issues = []

        for key, val in expected.items():
            actual = result.get(key)
            if key == "type":
                actual = result.get("type", "movie")
            if actual != val:
                ok = False
                issues.append(f"{key}: expected={val!r} got={actual!r}")

        status = "PASS" if ok else "FAIL"
        print(f"  [{status}] {filename}")
        if issues:
            for issue in issues:
                print(f"         {issue}")
            failed += 1
        else:
            passed += 1

    print(f"\nResults: {passed} passed, {failed} failed out of {len(TEST_CASES)}")
    if failed == 0:
        print("[OK] Spike 2 passed: guessit handles all test cases")
    else:
        print("[WARN] Spike 2: some cases failed — review and adjust matching logic")


if __name__ == "__main__":
    main()
