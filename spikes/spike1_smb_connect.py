"""
Spike 1: Validate smbprotocol can connect to a NAS, list files, and read a stream.

Usage:
    pip install smbprotocol
    python spike1_smb_connect.py --host NAS_IP --share SHARE_NAME --user USER --password PASS

Expected outcome:
    - Connects to SMB share
    - Lists top-level directory contents
    - Prints file names, sizes, and modification times
"""

import argparse
import smbclient
from smbclient import listdir, scandir, stat, open_file


def main():
    parser = argparse.ArgumentParser(description="Spike 1: SMB connectivity test")
    parser.add_argument("--host", required=True, help="NAS hostname or IP")
    parser.add_argument("--share", required=True, help="Share name (e.g. media)")
    parser.add_argument("--user", required=True, help="SMB username")
    parser.add_argument("--password", required=True, help="SMB password")
    parser.add_argument("--path", default="", help="Subdirectory to list (optional)")
    args = parser.parse_args()

    smb_path = rf"\\{args.host}\{args.share}"
    if args.path:
        smb_path = rf"{smb_path}\{args.path}"

    print(f"[*] Registering credentials for {args.host}")
    smbclient.register_session(args.host, username=args.user, password=args.password)

    print(f"[*] Listing: {smb_path}")
    print("-" * 80)

    count = 0
    for entry in scandir(smb_path):
        info = entry.stat()
        kind = "DIR " if entry.is_dir() else "FILE"
        size_mb = info.st_size / (1024 * 1024)
        print(f"  {kind}  {size_mb:>10.1f} MB  {entry.name}")
        count += 1

    print("-" * 80)
    print(f"[*] Total entries: {count}")

    # Test reading first few bytes of a file
    for entry in scandir(smb_path):
        if entry.is_file() and entry.name.lower().endswith((".mkv", ".mp4", ".avi")):
            file_path = rf"{smb_path}\{entry.name}"
            print(f"\n[*] Test reading first 1024 bytes of: {entry.name}")
            with open_file(file_path, mode="rb") as f:
                data = f.read(1024)
                print(f"    Read {len(data)} bytes successfully")
            break
    else:
        print("\n[*] No media files found at top level to test read")

    print("\n[OK] Spike 1 passed: smbprotocol connectivity works")


if __name__ == "__main__":
    main()
