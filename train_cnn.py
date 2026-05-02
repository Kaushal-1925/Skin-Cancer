"""
train_cnn.py — Skin Cancer CNN Trainer (Supabase Version)
Fetches data from Supabase Table and images from Supabase Storage/URLs.
"""

import os, sys, json, csv, warnings, requests
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
warnings.filterwarnings("ignore")

import numpy as np
import cv2
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
CONFIG_FILE = os.path.join(BASE_DIR, "config.json")
MODEL_OUT   = os.path.join(BASE_DIR, "model.h5")

# ── Load config ───────────────────────────────────────────
with open(CONFIG_FILE) as f:
    cfg = json.load(f)
IMG_SIZE = (64, 64) # Radically reduced for 512MB RAM
EPOCHS   = 5
BATCH_SIZE = 4

# Supabase Config
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── Collect records ───────────────────────────────────────
def get_records():
    try:
        response = supabase.table("fact_lesions").select("*").execute()
        rows = response.data
        print(f"[✓] Loaded {len(rows)} records from Supabase")
        return rows
    except Exception as e:
        print(f"[!] Supabase error: {e}")
        return []

# ── Build dataset ─────────────────────────────────────────
def build_dataset(records):
    X, y = [], []
    labels = sorted(set(r.get("label", "") for r in records))
    label_map = {l: i for i, l in enumerate(labels)}
    print(f"[✓] Classes: {label_map}")

    for r in records:
        label = r.get("label", "")
        # Construct public URL for image
        filename = r.get("local_path")
        if filename.startswith("http"):
            url = filename
        else:
            url = f"{SUPABASE_URL}/storage/v1/object/public/skin-warehouse/{filename}"

        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code != 200: continue
            nparr = np.frombuffer(resp.content, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)
            if img is None: continue

            img = cv2.resize(img, IMG_SIZE).astype("float32") / 255.0
            X.append(img[..., np.newaxis])
            y.append(label_map[label])
        except Exception: continue

    X = np.array(X)
    y = np.array(y)
    print(f"[✓] Dataset: {X.shape}")
    return X, y, labels

def build_model(num_classes, input_shape=(64, 64, 1)):
    import tensorflow as tf
    from tensorflow.keras import layers, models
    import gc
    gc.collect() # Free memory before model build
    
    model = models.Sequential([
        layers.Conv2D(16, (3,3), activation="relu", input_shape=input_shape),
        layers.MaxPooling2D((2,2)),
        layers.Flatten(),
        layers.Dense(32, activation="relu"),
        layers.Dense(num_classes, activation="softmax"),
    ])
    model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
    return model

def train():
    records = get_records()
    if not records:
        print("[!] No records found in Supabase.")
        return

    X, y, labels = build_dataset(records)
    if len(X) < 2:
        print("[!] Not enough images for training.")
        return

    model = build_model(num_classes=len(labels))
    model.fit(X, y, epochs=EPOCHS, batch_size=BATCH_SIZE, verbose=1)
    model.save(MODEL_OUT)

    labels_path = os.path.join(BASE_DIR, "model_labels.json")
    with open(labels_path, "w") as f:
        json.dump(labels, f)
    print(f"[✓] Training complete. Model saved.")

if __name__ == "__main__":
    train()
