import json
import re
import datetime
import requests
from bs4 import BeautifulSoup

FIDE_URL = "https://ratings.fide.com/profile/2666243"
CFC_URL  = "https://www.chess.ca/en/ratings/p/?id=187189"
FQE_URL  = "https://www.fqechecs.qc.ca/membres/index.php?Id=109477"

HEADERS = {"User-Agent": "kirillchess-bot/1.0 (GitHub Actions)"}

def fetch_text(url: str) -> str:
    r = requests.get(url, headers=HEADERS, timeout=30)
    r.raise_for_status()
    soup = BeautifulSoup(r.text, "html.parser")
    return " ".join(soup.get_text(" ").split())

def parse_fide(page_text: str):
    def find(label: str):
        m = re.search(rf"(Not rated|\d{{3,4}})\s+{label}\b", page_text, re.IGNORECASE)
        if not m:
            return None
        v = m.group(1)
        return None if v.lower() == "not rated" else int(v)
    return {
        "standard": find("STANDARD"),
        "rapid": find("RAPID"),
        "blitz": find("BLITZ"),
    }

def parse_fqe(page_text: str):
    # Common pattern: <lente> <games> <semi-rapide> <games> <rapide> <games>
    m = re.search(r"\b(\d{3,4})\s+\d+\s+(\d{3,4})\s+\d+\s+(\d{3,4})\s+\d+\b", page_text)
    if not m:
        return {"lente": None, "semi_rapide": None, "rapide": None}
    return {"lente": int(m.group(1)), "semi_rapide": int(m.group(2)), "rapide": int(m.group(3))}

def parse_cfc(page_text: str):
    def pick(patterns):
        for p in patterns:
            m = re.search(p, page_text, re.IGNORECASE)
            if m:
                v = m.group(1).replace("(", "").replace(")", "")
                try:
                    n = int(v)
                    return None if n == 0 else n
                except:
                    return None
        return None

    regular = pick([
        r"Regular\s+Rating\s*[:\-]?\s*(\d{1,4}|\(0\)|0)",
        r"\bRegular\b.*?\b(\d{3,4})\b"
    ])
    quick = pick([
        r"Quick\s+Rating\s*[:\-]?\s*(\d{1,4}|\(0\)|0)",
        r"\bQuick\b.*?\b(\d{3,4})\b"
    ])
    return {"regular": regular, "quick": quick}

def main():
    data_path = "data/ratings.json"
    with open(data_path, "r", encoding="utf-8") as f:
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

    with open(data_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    main()
