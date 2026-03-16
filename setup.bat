@echo off
chcp 65001 >nul 2>&1
title HomeStream Setup

echo ============================================
echo        HomeStream - Easy Setup
echo ============================================
echo.

if not exist config mkdir config

echo Step 1: TMDB API Key
echo   Get a free key at: https://www.themoviedb.org/settings/api
echo.
set /p TMDB_KEY="Enter your TMDB API key: "
echo.

echo Step 2: TMDB Language
echo   Examples: en, ru, uk, de, fr
set /p TMDB_LANG="Enter language (default: en): "
if "%TMDB_LANG%"=="" set TMDB_LANG=en
echo.

echo Step 3: SMB Shares
echo   Format: smb://IP/share/folder
echo   Example: smb://192.168.1.100/Media/Movies
echo.

set SHARE_COUNT=0

:add_share
set /a SHARE_COUNT+=1
echo --- Share #%SHARE_COUNT% ---
set /p SHARE_NAME="Share name (e.g. Movies): "
set /p SHARE_TYPE="Type - movies or tv: "
set /p SHARE_URL="SMB URL (e.g. smb://192.168.1.2/D/Movies): "
set /p SHARE_USER="SMB username: "
set /p SHARE_PASS="SMB password: "
echo.

set "SHARE_%SHARE_COUNT%_NAME=%SHARE_NAME%"
set "SHARE_%SHARE_COUNT%_TYPE=%SHARE_TYPE%"
set "SHARE_%SHARE_COUNT%_URL=%SHARE_URL%"
set "SHARE_%SHARE_COUNT%_USER=%SHARE_USER%"
set "SHARE_%SHARE_COUNT%_PASS=%SHARE_PASS%"

set /p MORE="Add another share? (y/n): "
if /i "%MORE%"=="y" goto add_share
echo.

echo Step 4: Port
set /p PORT="External port (default: 9091): "
if "%PORT%"=="" set PORT=9091
echo.

echo Generating config/config.yaml ...

(
echo server:
echo   host: "0.0.0.0"
echo   port: 9090
echo.
echo shares:
) > config\config.yaml

for /L %%i in (1,1,%SHARE_COUNT%) do (
    call :write_share %%i
)

(
echo.
echo tmdb:
echo   api_key: "%TMDB_KEY%"
echo   language: "%TMDB_LANG%"
echo.
echo scanner:
echo   extensions:
echo     - ".mkv"
echo     - ".mp4"
echo     - ".avi"
echo     - ".m4v"
echo     - ".ts"
echo     - ".m2ts"
echo     - ".mov"
echo   exclude_patterns:
echo     - "**/sample/**"
echo     - "**/extras/**"
echo     - "**/.recycle/**"
echo   scan_interval_hours: 6
echo.
echo data_dir: "/data"
) >> config\config.yaml

echo Updating docker-compose port to %PORT%...
(
echo services:
echo   homestream:
echo     build: ./backend
echo     container_name: homestream
echo     restart: unless-stopped
echo     ports:
echo       - "%PORT%:9090"
echo     volumes:
echo       - ./config:/config
echo       - homestream-data:/data
echo     environment:
echo       - TZ=Europe/Moscow
echo.
echo volumes:
echo   homestream-data:
) > docker-compose.yml

echo.
echo ============================================
echo  Config saved! Starting Docker...
echo ============================================
echo.

docker compose up -d --build

echo.
echo ============================================
echo  Done! Backend running at port %PORT%
echo.
echo  In Lampa, set backend URL to:
echo    YOUR_PC_IP:%PORT%
echo.
echo  Plugin URL:
echo    https://yevgenyfarber.github.io/lampa-homestream/homestream.js
echo ============================================
pause
goto :eof

:write_share
set idx=%1
call set "S_NAME=%%SHARE_%idx%_NAME%%"
call set "S_TYPE=%%SHARE_%idx%_TYPE%%"
call set "S_URL=%%SHARE_%idx%_URL%%"
call set "S_USER=%%SHARE_%idx%_USER%%"
call set "S_PASS=%%SHARE_%idx%_PASS%%"
(
echo   - name: "%S_NAME%"
echo     type: "%S_TYPE%"
echo     smb_url: "%S_URL%"
echo     username: "%S_USER%"
echo     password: "%S_PASS%"
) >> config\config.yaml
goto :eof
