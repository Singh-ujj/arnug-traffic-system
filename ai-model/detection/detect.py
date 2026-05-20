# detect.py - ARNUG Traffic Detection System
# YOLOv8m Pre-trained COCO weights

import cv2
import torch
import numpy as np
from ultralytics import YOLO
import json
import time
from datetime import datetime
import os

# ─── CONFIG ───────────────────────────────────────────────
MODEL_PATH = "yolov8m.pt"        # ✅ Pre-trained weights
CONFIDENCE = 0.4
OUTPUT_DIR = "output/"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# COCO Traffic Classes
VEHICLE_CLASSES = {
    0: "person",
    1: "bicycle",
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

# ─── LOAD MODEL ───────────────────────────────────────────
def load_model():
    print("🔄 Loading YOLOv8m pre-trained model...")
    model = YOLO(MODEL_PATH)
    print("✅ Model loaded! (COCO pre-trained)")
    return model

# ─── DETECT FROM IMAGE ────────────────────────────────────
def detect_image(model, image_path):
    print(f"\n📸 Processing: {image_path}")

    img = cv2.imread(image_path)
    if img is None:
        print("❌ Image not found!")
        return None

    results = model(img, conf=CONFIDENCE)[0]

    detections = []
    vehicle_count = {}

    for box in results.boxes:
        cls_id = int(box.cls[0])
        if cls_id not in VEHICLE_CLASSES:
            continue

        label = VEHICLE_CLASSES[cls_id]
        conf  = float(box.conf[0])
        x1, y1, x2, y2 = map(int, box.xyxy[0])

        vehicle_count[label] = vehicle_count.get(label, 0) + 1

        color = get_color(cls_id)
        cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
        cv2.putText(img, f"{label} {conf:.2f}",
                    (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX,
                    0.6, color, 2)

        detections.append({
            "class": label,
            "confidence": round(conf, 3),
            "bbox": [x1, y1, x2, y2]
        })

    total      = sum(vehicle_count.values())
    congestion = get_congestion_level(total)

    # Save output
    out_path = OUTPUT_DIR + "detected_" + os.path.basename(image_path)
    cv2.imwrite(out_path, img)

    result_data = {
        "timestamp":       datetime.now().isoformat(),
        "source":          image_path,
        "total_vehicles":  total,
        "vehicle_count":   vehicle_count,
        "congestion_level": congestion,
        "detections":      detections
    }

    print_results(result_data)
    save_json(result_data, "image_result.json")

    # Show image
    cv2.imshow("ARNUG - Detection Result", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

    return result_data

# ─── DETECT FROM WEBCAM / VIDEO ───────────────────────────
def detect_video(model, source=0):
    print(f"\n🎥 Starting video detection... (Q = quit)")

    cap = cv2.VideoCapture(source)
    if not cap.isOpened():
        print("❌ Cannot open video source!")
        return

    frame_count = 0
    fps_time    = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        frame_count += 1
        if frame_count % 2 != 0:   # every 2nd frame
            continue

        results = model(frame, conf=CONFIDENCE, verbose=False)[0]
        vehicle_count = {}

        for box in results.boxes:
            cls_id = int(box.cls[0])
            if cls_id not in VEHICLE_CLASSES:
                continue

            label = VEHICLE_CLASSES[cls_id]
            conf  = float(box.conf[0])
            x1, y1, x2, y2 = map(int, box.xyxy[0])

            vehicle_count[label] = vehicle_count.get(label, 0) + 1

            color = get_color(cls_id)
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, f"{label} {conf:.2f}",
                        (x1, y1 - 8), cv2.FONT_HERSHEY_SIMPLEX,
                        0.55, color, 2)

        fps       = 1 / (time.time() - fps_time + 1e-9)
        fps_time  = time.time()
        total     = sum(vehicle_count.values())
        congestion = get_congestion_level(total)

        draw_hud(frame, vehicle_count, total, congestion, fps)

        cv2.imshow("ARNUG Traffic Detection", frame)
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
    print("✅ Detection stopped.")

# ─── HELPERS ──────────────────────────────────────────────
def get_color(cls_id):
    return {
        0: (255, 165,   0),   # person   - orange
        1: (  0, 255, 255),   # bicycle  - cyan
        2: (  0, 255,   0),   # car      - green
        3: (255,   0, 255),   # moto     - magenta
        5: (  0,   0, 255),   # bus      - red
        7: (255, 255,   0),   # truck    - yellow
    }.get(cls_id, (200, 200, 200))

def get_congestion_level(total):
    if total == 0:       return "CLEAR"
    elif total <= 5:     return "LOW"
    elif total <= 15:    return "MODERATE"
    elif total <= 30:    return "HIGH"
    else:                return "SEVERE"

def draw_hud(frame, vehicle_count, total, congestion, fps):
    overlay = frame.copy()
    cv2.rectangle(overlay, (10, 10), (290, 175), (0, 0, 0), -1)
    cv2.addWeighted(overlay, 0.5, frame, 0.5, 0, frame)

    cong_color = {
        "CLEAR":    (  0, 255,   0),
        "LOW":      (  0, 255, 100),
        "MODERATE": (  0, 255, 255),
        "HIGH":     (  0, 165, 255),
        "SEVERE":   (  0,   0, 255),
    }.get(congestion, (255, 255, 255))

    cv2.putText(frame, "ARNUG TRAFFIC AI",  (20, 35),  cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 200, 255), 2)
    cv2.putText(frame, f"FPS      : {fps:.1f}",        (20, 60),  cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255,255,255), 1)
    cv2.putText(frame, f"Vehicles : {total}",          (20, 82),  cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255,255,255), 1)
    cv2.putText(frame, f"Status   : {congestion}",     (20, 104), cv2.FONT_HERSHEY_SIMPLEX, 0.52, cong_color,    2)

    y = 128
    for label, count in vehicle_count.items():
        cv2.putText(frame, f"  {label}: {count}", (20, y),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.42, (200, 200, 200), 1)
        y += 18

def print_results(data):
    print("\n" + "="*45)
    print("🚦 ARNUG DETECTION RESULTS")
    print("="*45)
    print(f"⏰ Time       : {data['timestamp']}")
    print(f"🚗 Vehicles   : {data['total_vehicles']}")
    print(f"🔴 Congestion : {data['congestion_level']}")
    print(f"📊 Breakdown  : {data['vehicle_count']}")
    print("="*45)

def save_json(data, filename):
    path = OUTPUT_DIR + filename
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"💾 Saved: {path}")

# ─── MAIN ─────────────────────────────────────────────────
if __name__ == "__main__":
    model = load_model()

    print("\n🚦 ARNUG Traffic Detection System")
    print("================================")
    print("1. Image Detection (Test)")
    print("2. Webcam Live Detection")
    print("3. Video File Detection")

    choice = input("\nChoice (1/2/3): ").strip()

    if choice == "1":
        img_input = input("Image path (ya 'test' likho sample ke liye): ").strip()
        if img_input == "test":
            import urllib.request
            print("📥 Test image download ho rahi hai...")
            urllib.request.urlretrieve(
                "https://ultralytics.com/images/bus.jpg",
                "test_image.jpg"
            )
            detect_image(model, "test_image.jpg")
        else:
            detect_image(model, img_input)

    elif choice == "2":
        detect_video(model, source=0)

    elif choice == "3":
        vpath = input("Video file path: ").strip()
        detect_video(model, source=vpath)

    else:
        print("❌ Invalid choice!")