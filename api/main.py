# Test with: fastapi dev main.py
# Hosted on http://127.0.0.1:8000
# Swagger API info at: http://127.0.0.1:8000/docs#
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import csv

# Create lot class and use BM for data validation
class Lot(BaseModel):
    lot_id: int
    lot_name: str
    total_capacity: int
    current: int
    type: str
    hours: str

# Parse CSV file and return list of Lot objects
def csv_parse(path: str) -> list[Lot]:
    rows: list[Lot] = []
    with open(path, "r", newline="") as f:
        reader = csv.DictReader(f, skipinitialspace=True)  # trims spaces after commas
        for r in reader:
            rows.append(
                Lot(
                    lot_id=int(r["lot_id"]),
                    lot_name=r["lot_name"],
                    total_capacity=int(r["total_capacity"]),
                    current=int(r["current"]),
                    type=r["type"],
                    hours=r["hours"],
                )
            )
    return rows

# Calculate percentage full for a lot using Lot.current and lot.total_capacity
def get_percentage_full(lot: Lot) -> float:
    return round((lot.current / lot.total_capacity) * 100, 1)

#Create FastAPI instance
app = FastAPI(title="ParkingPal API")

# Load parking lots from CSV and create a dictionary for quick lookup by lot_id
# This will most likely be replaced by a database in the future
parking_lots = csv_parse("fabricated_data.csv")
lots_by_id = {lot.lot_id: lot for lot in parking_lots}

@app.get("/")
async def root():
    return {"message": "Hello World!"}

@app.get("/lots", response_model=list[Lot])
async def list_lots():
    return parking_lots

@app.get("/lots/{lot_id}", response_model=Lot)
async def display_lot_info(lot_id: int):
    lot = lots_by_id.get(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    return lot
