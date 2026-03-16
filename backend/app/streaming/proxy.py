from __future__ import annotations

import asyncio
from typing import AsyncIterator

from fastapi import Request
from fastapi.responses import StreamingResponse, Response

from app.library.db import Database
from app.scanner.smb_source import SmbSource
from app.config import AppConfig
from app.utils.helpers import get_mime_type
from app.utils.logging import get_logger

log = get_logger(__name__)

CHUNK_SIZE = 64 * 1024  # 64KB


async def stream_file(
    item_id: str,
    request: Request,
    db: Database,
    sources: dict[str, SmbSource],
    config: AppConfig,
) -> Response:
    """Stream a media file over HTTP with Range request support."""
    file_row = await db.get_file(item_id)
    if not file_row:
        return Response(status_code=404, content='{"error":{"code":"NOT_FOUND","message":"Item not found"}}',
                        media_type="application/json")

    share_name = file_row["share_name"]
    source = sources.get(share_name)
    if not source:
        return Response(status_code=503, content='{"error":{"code":"SHARE_UNAVAILABLE","message":"Share not connected"}}',
                        media_type="application/json")

    file_path = file_row["file_path"]
    file_size = file_row["file_size"]
    mime_type = get_mime_type(file_row["file_name"])

    range_header = request.headers.get("range")

    if range_header:
        return await _range_response(source, file_path, file_size, mime_type, range_header)
    else:
        return StreamingResponse(
            _read_chunks(source, file_path, 0, file_size),
            media_type=mime_type,
            headers={
                "Content-Length": str(file_size),
                "Accept-Ranges": "bytes",
            },
        )


async def _range_response(
    source: SmbSource, file_path: str, file_size: int,
    mime_type: str, range_header: str
) -> Response:
    """Handle HTTP Range requests for seeking."""
    try:
        range_spec = range_header.replace("bytes=", "")
        parts = range_spec.split("-")
        start = int(parts[0]) if parts[0] else 0
        end = int(parts[1]) if parts[1] else file_size - 1
    except (ValueError, IndexError):
        return Response(status_code=416, content="Invalid range")

    if start >= file_size or end >= file_size:
        return Response(
            status_code=416,
            headers={"Content-Range": f"bytes */{file_size}"},
        )

    content_length = end - start + 1

    return StreamingResponse(
        _read_chunks(source, file_path, start, content_length),
        status_code=206,
        media_type=mime_type,
        headers={
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(content_length),
            "Accept-Ranges": "bytes",
        },
    )


async def _read_chunks(
    source: SmbSource, file_path: str, offset: int, length: int
) -> AsyncIterator[bytes]:
    """Read file from SMB in chunks, yielded asynchronously."""
    remaining = length

    def _open_and_read():
        f = source.open_file(file_path, offset)
        return f

    f = await asyncio.to_thread(_open_and_read)

    try:
        while remaining > 0:
            to_read = min(CHUNK_SIZE, remaining)
            chunk = await asyncio.to_thread(f.read, to_read)
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk
    finally:
        await asyncio.to_thread(f.close)
