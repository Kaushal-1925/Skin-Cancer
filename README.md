# SkinCancer DWM: Data Warehouse & Mining Dashboard

A professional, clinical-grade skin cancer detection warehouse built for academic research. This project integrates a full ETL pipeline, web scraping for data mining, and a Convolutional Neural Network (CNN) for real-time lesion classification.

## 🔬 Project Overview

This project implements a complete **Data Warehousing & Mining (DWM)** lifecycle:
- **Data Source Mining:** Automated web scraping from clinical sources (DermNet NZ, BC Cancer Atlas).
- **ETL Pipeline:** Extracting raw images, Transforming them (Grayscale, 224x224 Normalisation), and Loading them into a Supabase PostgreSQL Warehouse.
- **Machine Learning:** A 3-block CNN model trained on the warehouse data to classify lesions as **Melanoma (MEL)**, **Basal Cell Carcinoma (BCC)**, or **Squamous Cell Carcinoma (SCC)**.

## 🛠 Features

- **Live Web Scraper:** Paste a clinical URL and instantly mine new images for the warehouse.
- **Automated Retraining:** The CNN model can be retrained on-the-fly as new data is mined.
- **Immersive UI:** A premium white and green medical-themed dashboard with real-time statistics and a searchable image registry.
- **Cloud Scale:** Powered by Supabase for secure data storage and Render for backend processing.

## 📖 How to Use the Dashboard

### 1. Overview & Statistics
Upon entering the site, the **Overview** section provides a high-level summary of your warehouse, including total record counts and distribution of cancer types across different clinical sources.

### 2. Real-time Prediction (CNN)
Navigate to the **🧠 Detect** tab:
1. Upload or drag-and-drop a photo of a skin lesion.
2. Click **Detect**.
3. The CNN will process the image and provide a classification (MEL, BCC, or SCC) along with a confidence percentage and a medical risk assessment.

### 3. Data Mining (Web Scraping)
Navigate to the **🌐 Scrape** tab:
1. Paste a URL containing clinical skin cancer images.
2. Select the category (e.g., MEL).
3. Check the **"Retrain CNN"** box if you want to update the model with this new data.
4. Click **Scrape**. You will see a live log of the extraction and transformation process.

### 4. Warehouse Registry & Gallery
Browse the **Registry** to see the raw metadata of every mined record, or use the **Gallery** to inspect the transformed images stored in the warehouse.

### 5. Training & Extraction Logs
Use the **📊 Training** section to review how your model was built, see the architecture details, and inspect the logs of which sources contributed the most data to your project.

## ⚙️ Technology Stack

- **Frontend:** HTML5, Vanilla CSS3 (Glassmorphism), JavaScript (ES6+)
- **Backend:** Python (Flask), TensorFlow (Keras), OpenCV, BeautifulSoup4
- **Database:** Supabase (PostgreSQL)
- **Storage:** Supabase Storage (Bucket hosting)
- **Deployment:** Render.com

---

## 🏗 Setup & Installation (Local Development)

1. Clone the repository.
2. Install dependencies: `pip install -r requirements.txt`.
3. Create a `.env` file with your `SUPABASE_URL` and `SUPABASE_KEY`.
4. Run the server: `python server.py`.
5. Access via `http://localhost:8080`.

*Disclaimer: This project is for academic purposes only. Classification results are not medically accurate. Always consult a professional dermatologist.*
