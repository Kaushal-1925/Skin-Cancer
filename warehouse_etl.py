"""
warehouse_etl.py — Skin Cancer DWM (Supabase Version)
Scrapes initial data and loads into Supabase.
"""

import os, json, requests
from bs4 import BeautifulSoup
import cv2
import numpy as np
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
CONFIG_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
with open(CONFIG_FILE, "r") as f:
    CONFIG = json.load(f)

TASKS = CONFIG["tasks"]
IMAGE_SIZE = tuple(CONFIG.get("image_size", [224, 224]))
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def run_etl():
    for task in TASKS:
        label = task["label"]
        url = task["url"]
        print(f"\n>>> [{label}] {url}")

        try:
            headers = {"User-Agent": "Mozilla/5.0"}
            response = requests.get(url, headers=headers, timeout=15)
            soup = BeautifulSoup(response.text, "html.parser")
            img_tags = soup.find_all("img")
            saved = 0

            for img_tag in img_tags:
                if saved >= 3: break # Small limit for initial load
                img_url = img_tag.get("src") or img_tag.get("data-src", "")
                if not img_url: continue
                if not img_url.startswith("http"):
                    img_url = requests.compat.urljoin(url, img_url)
                if not any(ext in img_url.lower() for ext in [".jpg", ".jpeg"]): continue

                try:
                    r = requests.get(img_url, timeout=10)
                    nparr = np.frombuffer(r.content, np.uint8)
                    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                    if img is None: continue

                    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
                    img_resized = cv2.resize(img_gray, IMAGE_SIZE)
                    _, buffer = cv2.imencode('.jpg', img_resized)
                    img_bytes = buffer.tobytes()

                    uid = os.urandom(2).hex()
                    filename = f"{label}_etl_{saved}_{uid}.jpg"

                    # Upload to Storage
                    supabase.storage.from_("skin-warehouse").upload(
                        path=filename,
                        file=img_bytes,
                        file_options={"content-type": "image/jpeg"}
                    )

                    # Insert Record
                    supabase.table("fact_lesions").insert({
                        "source_url": img_url,
                        "label": label,
                        "local_path": filename
                    }).execute()

                    saved += 1
                    print(f"    [+] {filename}")
                except Exception as e:
                    print(f"Error: {e}")
                    continue
        except Exception as e:
            print(f"    [!] Skipped {url}: {e}")

if __name__ == "__main__":
    run_etl()