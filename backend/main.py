from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import json
import geopandas as gpd
import os

# -----------------------------------
# INIT
# -----------------------------------
app = FastAPI(
    title="Village Flood Alert System",
    description="Public Flood Alert Dashboard",
    version="4.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://rohit-project-theta.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# -----------------------------------
# LOAD DATA
# -----------------------------------
data = pd.read_csv(os.path.join(BASE_DIR, "data", "flood_replay.csv"))
data["Date"] = pd.to_datetime(data["Date"])

with open(os.path.join(BASE_DIR, "geo", "kolhapur.geojson")) as f:
    villages = json.load(f)
# 🔥 IMPORTANT: Ensure village names are lowercase
villages["village_na"] = villages["village_na"].str.lower()

# -----------------------------------
# ALERT LOGIC
# -----------------------------------
def get_alert_level(water_level):
    if water_level < 525:
        return "Normal"
    elif water_level < 527:
        return "Warning"
    elif water_level < 529:
        return "High Alert"
    else:
        return "Severe Flood"


def get_affected_villages(alert_level):

    all_villages = villages["village_na"].tolist()

    if alert_level == "Normal":
        return []

    elif alert_level == "Warning":
        return all_villages[:3]

    elif alert_level == "High Alert":
        return all_villages[:6]

    else:
        return all_villages


# -----------------------------------
# API: CURRENT ALERT
# -----------------------------------
@app.get("/api/alert")
def alert(hour: int = 0):

    if hour >= len(data):
        hour = len(data) - 1

    row = data.iloc[hour]
    water_level = float(row["Water_Level_m"])

    alert_level = get_alert_level(water_level)
    affected = get_affected_villages(alert_level)

    return {
        "date": str(row["Date"].date()),
        "alert_level": alert_level,
        "affected_villages": affected
    }


# -----------------------------------
# API: VILLAGE MAP
# -----------------------------------
@app.get("/api/map/villages")
def village_map():
    return json.loads(villages.to_json())
