import json
import re
import datetime
import requests
from bs4 import BeautifulSoup

# === OFFICIAL PROFILE URLS ===
FIDE_URL = "https://ratings.fide.com/profile/2666243"
CFC_URL  = "https://www.chess.ca/en/ratings/p/?id=187189"
FQE_URL  = "https://www.fqechecs.qc.ca/membres/index.php?Id=109477"

HEADERS = {
    "User-Agent": "kirillchess-bot/1.0 (GitHub Actions)"
}

RATINGS_FILE = "data/ratings.json"


# ---------- HELPERS ----------
def fetch_text(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    return " ".join(soup.get_text(" ").split())


# ---------- FIDE ----------
def parse_fide(text: str):
    def find(label: str):
        m = re.search(rf"(Not rated|\d{{3,4}})\s+{label}\b", text, re.IGNORECASE)
        if not m:
            return None
        val = m.group(1)
        return None if val.lower() == "not rated" else int(val)

    return {
        "standard": find("STANDARD"),
        "rapid":    find("RAPID"),
        "blitz":    find("BLITZ")
    }


# ---------- FQE ----------
def parse_fqe(text: str):
    # Typical pattern:
    # Lente 1524 (xx) | Semi-rapide 1450 (xx) | Rapide 1480 (xx)
    m = re.search(
        r"\b(\d{3,4})\s+\d+\s+(\d{3,4})\s+\d+\s+(\d{3,4})\s+\d+\b",
        text
    )
    if not m:
        return {
            "lente": None,
            "semi_rapide": None,
            "rapide": None
        }

    return {
        "lente": int(m.group(1)),
        "semi_rapide": int(m.group(2)),
        "rapide": int(m.group(3))
    }


# ---------- CFC ----------
def parse_cfc(text: str):
    """
    We parse the exact row of Kirill by CFC ID (187189).
    Typical row fragment:
    187189 2026-02-25 1679 1705 1602 1602
    Regular = 1679
    Quick   = 1602
    """
    m = re.search(
        r"\b187189\b\s+\d{4}-\d{2}-\d{2}\s+(\(?\d{1,4}\)?)\s+(\(?\d{1,4}\)?)\s+(\(?\d{1,4}\)?)\s+(\(?\d{1,4}\)?)",
        text
    )
    if not m:
        return {
            "regular": None,
            "quick": None
        }

    def to_int(val):
        val = val.replace("(", "").replace(")", "")
        try:
            n = int(val)
            return None if n == 0 else n
        except:
            return None

    return {
        "regular": to_int(m.group(1)),
        "quick":   to_int(m.group(3))
    }


# ---------- MAIN ----------
def main():
    with open(RATINGS_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    fide_text = fetch_text(FIDE_URL)
    fqe_text  = fetch_text(FQE_URL)

    cfc_text = ""
    try:
        cfc_text = fetch_text(CFC_URL)
    except Exception:
        pass

    data["updated_at"] = datetime.date.today().isoformat()

    data["fide"].update(parse_fide(fide_text))
    data["fqe"].update(parse_fqe(fqe_text))

    if cfc_text:
        data["cfc"].update(parse_cfc(cfc_text))

    with open(RATINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


if __name__ == "__main__":
    main()
