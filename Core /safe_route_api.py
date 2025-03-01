# safe_route_api.py - Flask API for SafeRoute application
from flask import Flask, request, jsonify
import requests
import json
import os
import pandas as pd
import numpy as np
from datetime import datetime
import polyline
from sklearn.preprocessing import MinMaxScaler

app = Flask(__name__)

# Configuration
GOOGLE_MAPS_API_KEY = os.environ.get('GOOGLE_MAPS_API_KEY', 'AIzaSyDv0leB0g4StU2y-3aXhBpO0g0Bu-qhy34')
CRIME_DATA_API_URL = os.environ.get('CRIME_DATA_API_URL', 'https://data.cityofexample.org/api/v2/crime')
STREET_LIGHT_API_URL = os.environ.get('STREET_LIGHT_API_URL', 'https://data.cityofexample.org/api/v2/street-lights')

# Load sample crime data if no API is available (for demo purposes)
def load_sample_crime_data():
    try:
        # Try to load from file
        with open('sample_crime_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Create synthetic data if file doesn't exist
        crime_types = [
            "Theft", "Robbery", "Assault", "Burglary", 
            "Vehicle Break-in", "Vandalism", "Suspicious Activity"
        ]
        
        # Base coordinates (NYC area)
        base_lat, base_lng = 40.7128, -74.0060
        
        # Generate random crime data
        crimes = []
        for _ in range(500):
            # Random location within ~5km of base
            lat = base_lat + (np.random.random() - 0.5) * 0.1
            lng = base_lng + (np.random.random() - 0.5) * 0.1
            
            # Random date in last 90 days
            days_ago = np.random.randint(1, 90)
            date = (datetime.now() - pd.Timedelta(days=days_ago)).strftime('%Y-%m-%d')
            
            # Random time (weighted more toward evening/night)
            hour = np.random.choice(range(24), p=[
                0.02, 0.01, 0.01, 0.01, 0.01, 0.02,  # 0-5am (8%)
                0.02, 0.03, 0.04, 0.04, 0.04, 0.04,  # 6-11am (21%)
                0.04, 0.04, 0.04, 0.04, 0.05, 0.06,  # 12-5pm (27%)
                0.07, 0.08, 0.09, 0.08, 0.06, 0.04   # 6-11pm (44%)
            ])
            time = f"{hour:02d}:{np.random.randint(0, 60):02d}"
            
            # Random crime type (weighted)
            crime_type = np.random.choice(crime_types, p=[0.3, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1])
            
            # Random severity (1-10)
            severity = np.random.randint(1, 11)
            
            crimes.append({
                "id": f"C{len(crimes) + 1}",
                "type": crime_type,
                "date": date,
                "time": time,
                "lat": lat,
                "lng": lng,
                "severity": severity
            })
        
        # Save to file for future use
        with open('sample_crime_data.json', 'w') as f:
            json.dump(crimes, f)
            
        return crimes

# Load sample lighting data if no API is available
def load_sample_lighting_data():
    try:
        # Try to load from file
        with open('sample_lighting_data.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        # Create synthetic street lighting data if file doesn't exist
        
        # Base coordinates (NYC area)
        base_lat, base_lng = 40.7128, -74.0060
        
        # Generate random street light data
        lights = []
        # Major streets will have more lighting
        num_streets = 20
        lights_per_street = 15
        
        for street_idx in range(num_streets):
            # Create a street path
            street_lat = base_lat + (np.random.random() - 0.5) * 0.08
            street_lng = base_lng + (np.random.random() - 0.5) * 0.08
            
            # Direction of street
            angle = np.random.random() * 2 * np.pi
            dx = np.cos(angle) * 0.002
            dy = np.sin(angle) * 0.002
            
            # Generate lights along the street
            for i in range(lights_per_street):
                # Position light along the street path with some randomness
                light_lat = street_lat + i * dy + (np.random.random() - 0.5) * 0.0005
                light_lng = street_lng + i * dx + (np.random.random() - 0.5) * 0.0005
                
                # Determine light status and brightness
                status = np.random.choice(['functional', 'dim', 'broken'], p=[0.8, 0.15, 0.05])
                
                # Brightness: 0-100 scale
                if status == 'functional':
                    brightness = np.random.randint(80, 101)
                elif status == 'dim':
                    brightness = np.random.randint(30, 80)
                else:  # broken
                    brightness = np.random.randint(0, 30)
                
                # Last inspection date
                days_ago = np.random.randint(1, 365)
                last_inspection = (datetime.now() - pd.Timedelta(days=days_ago)).strftime('%Y-%m-%d')
                
                lights.append({
                    "id": f"L{len(lights) + 1}",
                    "lat": light_lat,
                    "lng": light_lng,
                    "status": status,
                    "brightness": brightness,
                    "type": np.random.choice(["LED", "Sodium", "Halogen"]),
                    "height": np.random.choice([3, 4, 5, 6]),  # meters
                    "last_inspection": last_inspection
                })
        
        # Add some random scattered lights (less dense areas)
        for _ in range(100):
            lat = base_lat + (np.random.random() - 0.5) * 0.1
            lng = base_lng + (np.random.random() - 0.5) * 0.1
            
            status = np.random.choice(['functional', 'dim', 'broken'], p=[0.7, 0.2, 0.1])
            
            if status == 'functional':
                brightness = np.random.randint(80, 101)
            elif status == 'dim':
                brightness = np.random.randint(30, 80)
            else:  # broken
                brightness = np.random.randint(0, 30)
            
            days_ago = np.random.randint(1, 365)
            last_inspection = (datetime.now() - pd.Timedelta(days=days_ago)).strftime('%Y-%m-%d')
            
            lights.append({
                "id": f"L{len(lights) + 1}",
                "lat": lat,
                "lng": lng,
                "status": status,
                "brightness": brightness,
                "type": np.random.choice(["LED", "Sodium", "Halogen"]),
                "height": np.random.choice([3, 4, 5, 6]),  # meters
                "last_inspection": last_inspection
            })
        
        # Save to file for future use
        with open('sample_lighting_data.json', 'w') as f:
            json.dump(lights, f)
            
        return lights