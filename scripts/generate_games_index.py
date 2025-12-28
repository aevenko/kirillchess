import json
import os
import re
from datetime import datetime

GAMES_DIR = "data/games"
INDEX_PATH = os.path.join(GAMES_DIR, "index.json")

TAG_RE = re.compile(r'^\[(\w+)\s+"(.*)"\]$')

def read_pgn_tags(path: str) -> dict:
    tags = {}
    with open(path, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            line = line.strip()
            if not line:
                # tags section finished
                break
            m = TAG_RE.match(line)
            if m:
                key, val = m.group(1), m.group(2)
                tags[key] = val
    return tags

def guess_year(tags: dict) -> int | None:
    # Prefer Date tag: "YYYY.MM.DD" or "YYYY"
    date = tags.get("Date", "")
    m = re.match(r"^(\d{4})", date)
    if m:
        try:
            return int(m.group(1))
        except:
            pass
    return None

def build_record(filename: str, tags: dict) -> dict:
    rec = {
        "file": filename,
        "white": tags.get("White") or "",
        "black": tags.get("Black") or "",
        "event": tags.get("Event") or "",
        "site": tags.get("Site") or "",
        "date": tags.get("Date") or "",
        "round": tags.get("Round") or "",
        "result": tags.get("Result") or ""
    }
    y = guess_year(tags)
    if y:
        rec["year"] = y
    return rec

def main():
    if not os.path.isdir(GAMES_DIR):
        raise SystemExit(f"Folder not found: {GAMES_DIR}")

    files = [f for f in os.listdir(GAMES_DIR) if f.lower().endswith(".pgn")]
    files.sort(key=lambda x: x.lower())

    records = []
    for fn in files:
        path = os.path.join(GAMES_DIR, fn)
        tags = read_pgn_tags(path)
        records.append(build_record(fn, tags))

    # sort: newest first if year/date exists, otherwise keep filename order
    def sort_key(r):
        # date like YYYY.MM.DD -> sortable tuple
        d = r.get("date","")
        m = re.match(r"^(\d{4})(?:\.(\d{2}))?(?:\.(\d{2}))?", d)
        if m:
            y = int(m.group(1))
            mo = int(m.group(2) or 0)
            da = int(m.group(3) or 0)
            return (-y, -mo, -da, r["file"].lower())
        y = r.get("year")
        if isinstance(y, int):
            return (-y, 0, 0, r["file"].lower())
        return (0, 0, 0, r["file"].lower())

    records.sort(key=sort_key)

    os.makedirs(GAMES_DIR, exist_ok=True)
    with open(INDEX_PATH, "w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Wrote {INDEX_PATH} with {len(records)} games.")

if __name__ == "__main__":
    main()
