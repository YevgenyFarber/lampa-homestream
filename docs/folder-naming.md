# Folder Naming Guide

The backend uses [guessit](https://github.com/guessit-io/guessit) to parse filenames, enriched by folder name context. Well-organized media will match more reliably.

## Recommended Movie Structure

```
Movies/
├── The Matrix (1999)/
│   └── The.Matrix.1999.1080p.BluRay.x264.mkv
├── Inception (2010)/
│   └── Inception.2010.720p.mkv
├── Parasite (2019)/
│   └── Parasite.2019.KOREAN.1080p.mkv
```

Key rules:
- One movie per folder
- Folder name: `Title (Year)` 
- Year in the filename helps matching significantly
- Release group tags, quality, codec info is fine — guessit strips them

## Recommended TV Structure

```
TV Shows/
├── Breaking Bad/
│   ├── Season 01/
│   │   ├── Breaking.Bad.S01E01.Pilot.720p.mkv
│   │   ├── Breaking.Bad.S01E02.mkv
│   │   └── ...
│   └── Season 02/
│       └── ...
└── The Office (US)/
    └── Season 01/
        └── The.Office.US.S01E01.mkv
```

Key rules:
- Show name as top folder
- `Season XX` subfolders
- Episode files contain `S01E01` pattern (or `1x01`)
- Show name in filename is helpful but not required if folder provides context

## What Works Without Perfect Naming

| File/Folder | What Happens |
|-------------|-------------|
| `The Matrix 1999.mkv` (no dots) | Works fine — guessit handles spaces |
| `movie.mkv` in flat folder | Likely unmatched — too generic |
| `S01E01.mkv` in `Breaking Bad/Season 01/` | Works — folder provides show name and season |
| `Breaking Bad 1x01.avi` | Works — guessit handles `1x01` format |
| `2001.A.Space.Odyssey.1968.mkv` | Works — guessit distinguishes year from title |
| Non-English filenames | Best effort — guessit and TMDB both support many languages |

## NFO Files

Place a `.nfo` file next to the video with a TMDB or IMDB ID for guaranteed matching:

```xml
<!-- movie.nfo -->
<movie>
    <title>The Matrix</title>
    <uniqueid type="tmdb">603</uniqueid>
    <uniqueid type="imdb">tt0133093</uniqueid>
</movie>
```

The backend checks for:
- `<filename>.nfo` (same name as video, different extension)
- `movie.nfo` in the same folder
- `tvshow.nfo` in the same folder

NFO matches have confidence 1.0 — they override filename-based matching.

## Excluded Paths

By default, these paths are skipped:
- `**/sample/**` — sample clips
- `**/extras/**` — bonus features
- `**/.recycle/**` — NAS recycle bins
