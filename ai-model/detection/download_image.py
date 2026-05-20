import ee
import requests
import os

# GEE authenticate
ee.Authenticate()
ee.Initialize(project='arnug-traffic')

print("[ARNUG] Connecting to Google Earth Engine...")

# Bangalore Whitefield area
bangalore = ee.Geometry.Rectangle([77.6800, 12.9200, 77.7600, 12.9800])

# Sentinel-2 image
image = ee.ImageCollection('COPERNICUS/S2_SR_HARMONIZED') \
    .filterBounds(bangalore) \
    .filterDate('2024-01-01', '2024-12-31') \
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)) \
    .sort('CLOUDY_PIXEL_PERCENTAGE') \
    .first() \
    .clip(bangalore)

# Download URL generate karo
url = image.getThumbURL({
    'bands': ['B4', 'B3', 'B2'],
    'region': bangalore,
    'dimensions': 1024,
    'min': 0,
    'max': 3000,
    'format': 'jpg'
})

print(f"[ARNUG] Downloading satellite image...")

# Download karo
response = requests.get(url)
with open('test_traffic.jpg', 'wb') as f:
    f.write(response.content)

print(f"[ARNUG] Image saved: test_traffic.jpg")
print(f"[ARNUG] Size: {os.path.getsize('test_traffic.jpg') / 1024:.1f} KB")
print("[ARNUG] Ready for detection!")