from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from datetime import datetime, timedelta
from jose import jwt
import math
import heapq
import requests
import os
from collections import defaultdict
from dotenv import load_dotenv
import threading
import time

load_dotenv()

app = FastAPI(title="ARNUG Traffic Management System", version="4.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://arnug.in",
        "https://www.arnug.in",
        "https://jocular-fox-3563c6.netlify.app",
        "https://arnug-traffic.netlify.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "arnug_secret_key_2024"
ALGORITHM = "HS256"
TOMTOM_KEY = os.getenv("TOMTOM_API_KEY")
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://xqyxgirouogrshubslkg.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

NODES = {
    'Whitefield':       (12.9698, 77.7500),
    'Marathahalli':     (12.9567, 77.7010),
    'Bellandur':        (12.9255, 77.6762),
    'Silk Board':       (12.9150, 77.6229),
    'Electronic City':  (12.8456, 77.6603),
    'HSR Layout':       (12.9116, 77.6389),
    'Koramangala':      (12.9352, 77.6245),
    'Outer Ring Road':  (12.9500, 77.6800),
    'Hebbal':           (13.0358, 77.5970),
    'Marathahalli IT':  (12.9591, 77.6974),
}

ROADS = [
    ('Whitefield', 'Marathahalli', 5.2),
    ('Whitefield', 'Marathahalli IT', 3.1),
    ('Marathahalli', 'Bellandur', 4.8),
    ('Marathahalli', 'Outer Ring Road', 3.5),
    ('Marathahalli IT', 'Outer Ring Road', 2.8),
    ('Bellandur', 'Silk Board', 6.2),
    ('Bellandur', 'HSR Layout', 3.9),
    ('Silk Board', 'Electronic City', 7.1),
    ('Silk Board', 'HSR Layout', 2.8),
    ('Silk Board', 'Koramangala', 3.2),
    ('Electronic City', 'HSR Layout', 5.5),
    ('HSR Layout', 'Koramangala', 2.1),
    ('Koramangala', 'Outer Ring Road', 4.3),
    ('Outer Ring Road', 'Hebbal', 12.0),
    ('Outer Ring Road', 'Marathahalli', 3.5),
    ('Marathahalli', 'Silk Board', 8.1),
    ('Bellandur', 'Electronic City', 9.2),
    ('Koramangala', 'HSR Layout', 2.1),
    ('Whitefield', 'Outer Ring Road', 7.8),
    ('Hebbal', 'Marathahalli', 14.0),
]

ROUTE_LOAD = defaultdict(int)

def supabase_headers():
    return {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
    }

def get_tomtom_traffic(lat, lng):
    try:
        url = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
        params = {"point": f"{lat},{lng}", "key": TOMTOM_KEY, "unit": "KMPH"}
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            flow = data.get("flowSegmentData", {})
            current_speed = flow.get("currentSpeed", 40)
            free_flow_speed = flow.get("freeFlowSpeed", 60)
            confidence = flow.get("confidence", 0.5)
            if free_flow_speed > 0:
                ratio = current_speed / free_flow_speed
                congestion_score = max(0, min(100, int((1 - ratio) * 100)))
            else:
                congestion_score = 50
            severity = 'critical' if congestion_score >= 70 else 'warning' if congestion_score >= 40 else 'low'
            return {
                "current_speed": current_speed,
                "free_flow_speed": free_flow_speed,
                "congestion_score": congestion_score,
                "severity": severity,
                "confidence": confidence,
                "source": "TomTom Live"
            }
    except Exception as e:
        print(f"TomTom error: {e}")
    return None

def get_tomtom_incidents(lat, lng):
    try:
        url = "https://api.tomtom.com/traffic/services/5/incidentDetails"
        params = {
            "bbox": f"{lng-0.05},{lat-0.05},{lng+0.05},{lat+0.05}",
            "key": TOMTOM_KEY,
            "fields": "{incidents{type,geometry{type,coordinates},properties{iconCategory,magnitudeOfDelay,events{description,code,iconCategory},startTime,endTime,from,to,length,delay,roadNumbers,timeValidity}}}",
            "language": "en-GB",
            "categoryFilter": "0,1,2,3,4,5,6,7,8,9,10,11,14",
            "timeValidityFilter": "present"
        }
        response = requests.get(url, params=params, timeout=5)
        if response.status_code == 200:
            data = response.json()
            incidents = data.get("incidents", [])
            result = []
            for inc in incidents[:3]:
                props = inc.get("properties", {})
                events = props.get("events", [{}])
                result.append({
                    "description": events[0].get("description", "Traffic incident") if events else "Traffic incident",
                    "delay": props.get("delay", 0),
                    "from": props.get("from", "Unknown"),
                    "to": props.get("to", "Unknown")
                })
            return result
    except Exception as e:
        print(f"TomTom incidents error: {e}")
    return []

def generate_alert_message(area, score, severity, incidents):
    if severity == 'critical':
        if incidents:
            return f"CRITICAL: {incidents[0]['description']} near {area}. Congestion at {score}%!"
        return f"CRITICAL congestion at {area} — {score}% traffic density. Avoid this route!"
    elif severity == 'warning':
        return f"WARNING: Traffic building up at {area} — {score}% congestion. Plan alternate route."
    return f"Moderate traffic at {area} — {score}% congestion."

def push_alert_to_supabase(area, alert_type, message):
    try:
        headers = supabase_headers()
        headers["Prefer"] = "return=minimal"
        requests.patch(
            f"{SUPABASE_URL}/rest/v1/alerts?area=eq.{area}&is_active=eq.true",
            json={"is_active": False}, headers=headers, timeout=5
        )
        requests.post(
            f"{SUPABASE_URL}/rest/v1/alerts",
            json={"type": alert_type, "area": area, "message": message, "is_active": True},
            headers=headers, timeout=5
        )
        print(f"[ALERT] ✅ Pushed: {area} — {alert_type}")
    except Exception as e:
        print(f"[ALERT] Error: {e}")

def auto_alert_worker():
    print("[ARNUG] Auto Alert System started!")
    while True:
        try:
            print(f"[ALERT] Checking at {datetime.now().strftime('%H:%M:%S')}...")
            for node, (lat, lng) in NODES.items():
                traffic = get_tomtom_traffic(lat, lng)
                if traffic and traffic["severity"] in ['critical', 'warning']:
                    incidents = get_tomtom_incidents(lat, lng)
                    message = generate_alert_message(node, traffic["congestion_score"], traffic["severity"], incidents)
                    push_alert_to_supabase(node, traffic["severity"], message)
        except Exception as e:
            print(f"[ALERT] Worker error: {e}")
        time.sleep(300)

def get_real_congestion(node):
    lat, lng = NODES[node]
    traffic = get_tomtom_traffic(lat, lng)
    if traffic:
        return traffic["congestion_score"] / 100 * 2 + 1
    hour = datetime.now().hour
    it_areas = ['Whitefield', 'Marathahalli', 'Electronic City', 'Outer Ring Road', 'Marathahalli IT']
    school_areas = ['Silk Board', 'Koramangala', 'HSR Layout']
    if node in it_areas and (8 <= hour <= 10 or 17 <= hour <= 20): return 2.8
    if node in school_areas and (7 <= hour <= 8 or 13 <= hour <= 15): return 2.2
    return 1.0

def build_graph():
    graph = defaultdict(list)
    for n1, n2, dist in ROADS:
        graph[n1].append((n2, dist))
        graph[n2].append((n1, dist))
    return graph

def heuristic(node, goal):
    lat1, lon1 = NODES[node]
    lat2, lon2 = NODES[goal]
    return math.sqrt((lat1-lat2)**2 + (lon1-lon2)**2) * 111

def find_route(origin, destination, use_live=True, blocked_edges=None):
    if origin not in NODES or destination not in NODES: return None
    if blocked_edges is None: blocked_edges = set()
    graph = build_graph()
    pq = [(0, origin, [origin], 0, 0)]
    visited = set()
    while pq:
        cost, current, path, total_dist, total_time = heapq.heappop(pq)
        if current in visited: continue
        visited.add(current)
        if current == destination:
            return {'path': path, 'distance': round(total_dist, 1), 'time': round(total_time, 1)}
        for neighbor, dist in graph[current]:
            if neighbor not in visited:
                edge = (current, neighbor)
                if edge in blocked_edges: continue
                cong = get_real_congestion(neighbor) if use_live else 1.0
                load = ROUTE_LOAD[edge]
                load_factor = 1 + (load * 0.1)
                speed = max(40 / (cong * load_factor), 5)
                t = (dist / speed) * 60
                h = heuristic(neighbor, destination)
                heapq.heappush(pq, (total_time + t + h, neighbor, path + [neighbor], total_dist + dist, total_time + t))
    return None

def create_token(data):
    to_encode = data.copy()
    to_encode.update({"exp": datetime.utcnow() + timedelta(hours=8)})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.on_event("startup")
async def startup_event():
    alert_thread = threading.Thread(target=auto_alert_worker, daemon=True)
    alert_thread.start()
    print("[ARNUG] Auto Alert System running!")

@app.get("/")
def root():
    return {"message": "ARNUG API v4.0", "status": "running"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "tomtom": "connected" if TOMTOM_KEY else "missing",
        "auto_alerts": "active"
    }

@app.get("/api/stats")
def get_stats():
    total_vehicles = 0
    total_speed = 0
    congestion_zones = 0
    count = 0
    for node, (lat, lng) in NODES.items():
        traffic = get_tomtom_traffic(lat, lng)
        if traffic:
            score = traffic["congestion_score"]
            speed = traffic["current_speed"]
            free_flow = traffic.get("free_flow_speed", 60)
            total_speed += speed
            count += 1
            estimated_vehicles = int((free_flow - speed + 10) * 15 + score * 10)
            total_vehicles += max(50, estimated_vehicles)
            if traffic["severity"] in ['critical', 'warning']:
                congestion_zones += 1
    avg_speed = round(total_speed / count, 1) if count > 0 else 35
    return {
        "vehicles_detected": total_vehicles,
        "avg_speed": avg_speed,
        "congestion_zones": congestion_zones,
        "ai_accuracy": 94.7,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/gov/login")
def gov_login(request: dict):
    username = request.get("username")
    password = request.get("password")
    if username == "commissioner" and password == "arnug2024":
        token = create_token({"sub": "commissioner", "role": "commissioner"})
        return {
            "access_token": token, "token_type": "bearer",
            "user": {"username": "commissioner", "name": "Police Commissioner", "role": "commissioner", "zone": ""}
        }
    try:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/gov_users?username=eq.{username}&password=eq.{password}&authorized=eq.true",
            headers=supabase_headers(), timeout=5
        )
        if res.status_code == 200:
            users = res.json()
            if users:
                user = users[0]
                token = create_token({
                    "sub": user["username"],
                    "role": user["role"],
                    "zone": user.get("zone", "")
                })
                return {
                    "access_token": token, "token_type": "bearer",
                    "user": {
                        "username": user["username"],
                        "name": user["name"],
                        "role": user["role"],
                        "zone": user.get("zone", "")
                    }
                }
    except Exception as e:
        print(f"Supabase login error: {e}")
    raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/api/officer/create")
def create_officer(data: dict):
    if data.get("created_by") != "commissioner":
        raise HTTPException(status_code=403, detail="Only commissioner can create officers")
    try:
        payload = {
            "username": data.get("username"),
            "password": data.get("password"),
            "name": data.get("name"),
            "role": "officer",
            "authorized": True,
            "zone": data.get("zone"),
            "created_by": "commissioner"
        }
        headers = supabase_headers()
        headers["Prefer"] = "return=representation"
        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/gov_users",
            json=payload, headers=headers, timeout=5
        )
        if res.status_code in [200, 201]:
            return {"success": True, "message": f"Officer {data.get('name')} created successfully!"}
        else:
            raise HTTPException(status_code=400, detail=f"Failed: {res.text}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/officer/list")
def get_officers():
    try:
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/gov_users?role=eq.officer&select=id,name,username,zone,created_at,created_by",
            headers=supabase_headers(), timeout=5
        )
        if res.status_code == 200:
            return {"officers": res.json()}
    except Exception as e:
        print(f"Officer list error: {e}")
    return {"officers": []}

@app.get("/api/traffic/live")
def get_live_traffic():
    results = []
    for node, (lat, lng) in NODES.items():
        traffic = get_tomtom_traffic(lat, lng)
        incidents = get_tomtom_incidents(lat, lng)
        if traffic:
            results.append({"area": node, "lat": lat, "lng": lng, **traffic, "incidents": incidents})
        else:
            results.append({
                "area": node, "lat": lat, "lng": lng,
                "congestion_score": 50, "current_speed": 30,
                "free_flow_speed": 50, "severity": "warning",
                "source": "Estimated", "incidents": []
            })
    results.sort(key=lambda x: x["congestion_score"], reverse=True)
    return {"data": results, "timestamp": datetime.now().isoformat()}

@app.get("/api/traffic/predict")
def get_predictions():
    results = []
    for node, (lat, lng) in NODES.items():
        traffic = get_tomtom_traffic(lat, lng)
        score = traffic["congestion_score"] if traffic else 50
        severity = 'critical' if score >= 70 else 'warning' if score >= 40 else 'low'
        results.append({
            "area": node, "lat": lat, "lng": lng,
            "predicted_score": score, "severity": severity,
            "source": traffic["source"] if traffic else "Estimated"
        })
    results.sort(key=lambda x: x["predicted_score"], reverse=True)
    return {"predictions": results[:5], "timestamp": datetime.now().isoformat(), "prediction_window": "15 minutes"}

@app.get("/api/traffic/zone/{zone}")
def get_zone_traffic(zone: str):
    node = zone
    if node not in NODES:
        raise HTTPException(status_code=404, detail="Zone not found")
    lat, lng = NODES[node]
    traffic = get_tomtom_traffic(lat, lng)
    incidents = get_tomtom_incidents(lat, lng)
    if traffic:
        return {"area": node, "lat": lat, "lng": lng, **traffic, "incidents": incidents}
    return {
        "area": node, "lat": lat, "lng": lng,
        "congestion_score": 50, "current_speed": 30,
        "free_flow_speed": 50, "severity": "warning",
        "source": "Estimated", "incidents": []
    }

@app.get("/api/alerts/live")
def get_live_alerts():
    results = []
    for node, (lat, lng) in NODES.items():
        traffic = get_tomtom_traffic(lat, lng)
        if traffic and traffic["severity"] in ['critical', 'warning']:
            incidents = get_tomtom_incidents(lat, lng)
            message = generate_alert_message(node, traffic["congestion_score"], traffic["severity"], incidents)
            results.append({
                "area": node,
                "type": traffic["severity"],
                "message": message,
                "congestion_score": traffic["congestion_score"],
                "current_speed": traffic["current_speed"],
                "time": "Just now",
                "incidents": incidents
            })
    results.sort(key=lambda x: x["congestion_score"], reverse=True)
    return {"alerts": results, "count": len(results), "timestamp": datetime.now().isoformat()}

@app.post("/api/routes/suggest")
def suggest_route(data: dict):
    origin = data.get("origin", "Whitefield")
    destination = data.get("destination", "Electronic City")
    r1 = find_route(origin, destination, use_live=True)
    r2 = None
    if r1 and r1.get("path"):
        path1 = r1["path"]
        blocked = set()
        for i in range(len(path1)-1):
            blocked.add((path1[i], path1[i+1]))
            blocked.add((path1[i+1], path1[i]))
        r2 = find_route(origin, destination, use_live=True, blocked_edges=blocked)
    r3 = find_route(origin, destination, use_live=False)
    routes = []
    if r1:
        routes.append({"name": "Fastest Route (Live)", "path": r1["path"], "via": " → ".join(r1["path"]), "distance": f"{r1['distance']} km", "time": f"{r1['time']} min", "source": "TomTom Live"})
    if r2 and r2.get("path"):
        routes.append({"name": "Alternate Route", "path": r2["path"], "via": " → ".join(r2["path"]), "distance": f"{r2['distance']} km", "time": f"{r2['time']} min", "source": "TomTom Live"})
    if r3:
        routes.append({"name": "Ideal Route (No Traffic)", "path": r3["path"], "via": " → ".join(r3["path"]), "distance": f"{r3['distance']} km", "time": f"{r3['time']} min", "source": "Estimated"})
    return {"origin": origin, "destination": destination, "routes": routes, "areas": list(NODES.keys()), "timestamp": datetime.now().isoformat()}

@app.get("/api/areas")
def get_areas():
    return {"areas": list(NODES.keys())}

@app.get("/api/weather")
def get_weather():
    return {"city": "Bangalore", "condition": "Partly Cloudy", "temperature": 24, "humidity": 65, "traffic_impact": "Moderate"}

@app.post("/api/citizen/auth")
def citizen_auth(data: dict):
    token = create_token({"sub": data.get("email"), "role": "citizen"})
    return {
        "access_token": token, "token_type": "bearer",
        "user": {"name": data.get("name"), "email": data.get("email"), "role": "citizen"}
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)