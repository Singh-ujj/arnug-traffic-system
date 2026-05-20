import json
import math
import heapq
from datetime import datetime
from collections import defaultdict

# ══ ARNUG — Smart Route Finder ══
# A* Algorithm + Time-based Congestion + Dynamic Load Balancing

# Bangalore IT Hub — Road Network (Nodes)
NODES = {
    'Whitefield':        (12.9698, 77.7500),
    'Marathahalli':      (12.9567, 77.7010),
    'Bellandur':         (12.9255, 77.6762),
    'Silk Board':        (12.9150, 77.6229),
    'Electronic City':   (12.8456, 77.6603),
    'HSR Layout':        (12.9116, 77.6389),
    'Koramangala':       (12.9352, 77.6245),
    'Outer Ring Road':   (12.9500, 77.6800),
    'Hebbal':            (13.0358, 77.5970),
    'Marathahalli IT':   (12.9591, 77.6974),
}

# Road connections (edges) — distance in km
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
]

# Current traffic load — kitni cars already is route pe hain
ROUTE_LOAD = defaultdict(int)

def get_distance(node1, node2):
    """Haversine distance calculate karo"""
    lat1, lon1 = NODES[node1]
    lat2, lon2 = NODES[node2]
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * 2 * math.asin(math.sqrt(a))

def get_time_congestion(road_key, hour=None):
    """Time-based congestion — school, IT park patterns"""
    if hour is None:
        hour = datetime.now().hour

    congestion = 1.0  # Normal

    # School time patterns
    school_roads = ['Silk Board', 'Koramangala', 'HSR Layout']
    it_roads = ['Whitefield', 'Marathahalli', 'Electronic City', 'Outer Ring Road']

    road_from, road_to = road_key

    # Morning rush — IT park
    if 8 <= hour <= 10:
        if road_from in it_roads or road_to in it_roads:
            congestion = 2.8  # Heavy
        if road_from in school_roads or road_to in school_roads:
            congestion = 2.2

    # Evening rush — IT park
    elif 17 <= hour <= 20:
        if road_from in it_roads or road_to in it_roads:
            congestion = 3.0  # Very heavy
        if road_from in school_roads or road_to in school_roads:
            congestion = 1.5

    # School morning
    elif 7 <= hour <= 8:
        if road_from in school_roads or road_to in school_roads:
            congestion = 2.5

    # School afternoon
    elif 13 <= hour <= 15:
        if road_from in school_roads or road_to in school_roads:
            congestion = 2.0

    # Night — clear
    elif 22 <= hour or hour <= 6:
        congestion = 0.6

    return congestion

def get_dynamic_load_penalty(road_key):
    """Dynamic load balancing — zyada cars = zyada penalty"""
    load = ROUTE_LOAD[road_key]
    if load == 0:
        return 1.0
    elif load < 5:
        return 1.2
    elif load < 10:
        return 1.5
    elif load < 20:
        return 2.0
    else:
        return 3.0

def calculate_travel_time(distance_km, congestion, load_penalty):
    """Total time calculate karo"""
    base_speed = 40  # km/h normal speed
    effective_speed = base_speed / (congestion * load_penalty)
    effective_speed = max(effective_speed, 5)  # Minimum 5 km/h
    return (distance_km / effective_speed) * 60  # Minutes mein

def heuristic(node, goal):
    """A* heuristic — straight line distance"""
    lat1, lon1 = NODES[node]
    lat2, lon2 = NODES[goal]
    return math.sqrt((lat1-lat2)**2 + (lon1-lon2)**2) * 111

def build_graph():
    """Graph build karo"""
    graph = defaultdict(list)
    for road in ROADS:
        n1, n2, dist = road
        graph[n1].append((n2, dist))
        graph[n2].append((n1, dist))
    return graph

def find_best_route(origin, destination, hour=None):
    """A* Algorithm — best route find karo"""
    if origin not in NODES or destination not in NODES:
        return None

    graph = build_graph()
    if hour is None:
        hour = datetime.now().hour

    # Priority queue: (total_cost, current_node, path, total_distance, total_time)
    pq = [(0, origin, [origin], 0, 0)]
    visited = set()

    while pq:
        cost, current, path, total_dist, total_time = heapq.heappop(pq)

        if current in visited:
            continue
        visited.add(current)

        if current == destination:
            return {
                'path': path,
                'distance': round(total_dist, 1),
                'time': round(total_time, 1),
                'congestion_level': get_congestion_level(total_time, total_dist)
            }

        for neighbor, dist in graph[current]:
            if neighbor not in visited:
                road_key = (current, neighbor)
                congestion = get_time_congestion(road_key, hour)
                load_penalty = get_dynamic_load_penalty(road_key)
                travel_time = calculate_travel_time(dist, congestion, load_penalty)

                new_dist = total_dist + dist
                new_time = total_time + travel_time
                h = heuristic(neighbor, destination)
                new_cost = new_time + h

                heapq.heappush(pq, (new_cost, neighbor, path + [neighbor], new_dist, new_time))

    return None

def get_congestion_level(time, distance):
    """Congestion level determine karo"""
    expected_time = (distance / 40) * 60
    ratio = time / max(expected_time, 1)
    if ratio < 1.3:
        return 'LOW'
    elif ratio < 2.0:
        return 'MODERATE'
    else:
        return 'HIGH'

def find_top3_routes(origin, destination):
    """Top 3 alternate routes find karo"""
    graph = build_graph()
    hour = datetime.now().hour
    routes = []

    # Route 1 — Current time
    r1 = find_best_route(origin, destination, hour)
    if r1:
        r1['name'] = 'Fastest Route'
        r1['via'] = ' → '.join(r1['path'])
        routes.append(r1)

    # Route 2 — Avoid high load roads
    for road_key in ROUTE_LOAD:
        ROUTE_LOAD[road_key] += 5
    r2 = find_best_route(origin, destination, hour)
    if r2 and r2['path'] != r1['path']:
        r2['name'] = 'Alternate Route'
        r2['via'] = ' → '.join(r2['path'])
        routes.append(r2)
    for road_key in ROUTE_LOAD:
        ROUTE_LOAD[road_key] -= 5

    # Route 3 — Off peak timing suggestion
    r3 = find_best_route(origin, destination, 22)
    if r3:
        r3['name'] = 'Best Off-Peak Route'
        r3['via'] = ' → '.join(r3['path'])
        r3['note'] = 'Travel after 10 PM for this route'
        routes.append(r3)

    return routes

def update_route_load(path, add=True):
    """Jab car route pe ho — load update karo"""
    for i in range(len(path)-1):
        key = (path[i], path[i+1])
        if add:
            ROUTE_LOAD[key] += 1
        else:
            ROUTE_LOAD[key] = max(0, ROUTE_LOAD[key] - 1)

def predict_congestion_15min(area):
    """15 min pehle congestion predict karo"""
    hour = datetime.now().hour
    next_hour = (hour + 1) % 24

    it_areas = ['Whitefield', 'Marathahalli', 'Electronic City', 'Outer Ring Road', 'Marathahalli IT']
    school_areas = ['Silk Board', 'Koramangala', 'HSR Layout']

    predictions = []

    for node in NODES:
        current_congestion = 1.0
        future_congestion = 1.0

        if node in it_areas:
            if 7 <= hour <= 9 or 17 <= hour <= 19:
                current_congestion = 2.8
            if 7 <= next_hour <= 9 or 17 <= next_hour <= 19:
                future_congestion = 2.8

        if node in school_areas:
            if 7 <= hour <= 8 or 13 <= hour <= 14:
                current_congestion = 2.2
            if 7 <= next_hour <= 8 or 13 <= next_hour <= 14:
                future_congestion = 2.2

        will_worsen = future_congestion > current_congestion
        score = min(int(future_congestion * 30), 100)

        predictions.append({
            'area': node,
            'current_score': min(int(current_congestion * 30), 100),
            'predicted_score': score,
            'will_worsen': will_worsen,
            'severity': 'critical' if score >= 70 else 'warning' if score >= 40 else 'low'
        })

    predictions.sort(key=lambda x: x['predicted_score'], reverse=True)
    return predictions[:5]  # Top 5

if __name__ == "__main__":
    print("="*60)
    print("ARNUG — Smart Route Finder")
    print("="*60)

    # Test route
    origin = "Whitefield"
    destination = "Electronic City"

    print(f"\nFinding routes: {origin} → {destination}")
    print(f"Current time: {datetime.now().strftime('%H:%M')}")

    routes = find_top3_routes(origin, destination)

    print(f"\n{'='*60}")
    print(f"TOP ROUTES FOUND:")
    print(f"{'='*60}")

    for i, route in enumerate(routes, 1):
        print(f"\n#{i} {route['name']}")
        print(f"   Path     : {route['via']}")
        print(f"   Distance : {route['distance']} km")
        print(f"   Time     : {route['time']} min")
        print(f"   Traffic  : {route['congestion_level']}")
        if 'note' in route:
            print(f"   Note     : {route['note']}")

    print(f"\n{'='*60}")
    print(f"15-MIN CONGESTION PREDICTION — TOP 5 ZONES:")
    print(f"{'='*60}")

    predictions = predict_congestion_15min("all")
    for pred in predictions:
        arrow = "↑ WORSENING" if pred['will_worsen'] else "→ STABLE"
        print(f"{pred['area']:25} | Score: {pred['predicted_score']:3}% | {pred['severity'].upper():8} | {arrow}")

    print(f"\n[ARNUG] Route system ready!")