# Run: fastapi dev main.py
# Swagger: http://127.0.0.1:8000/docs
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Literal
from datetime import datetime
import csv, random

app = FastAPI(title="ParkingPal API")

# Enforce types with BModels
class Lot(BaseModel):
    lot_id: int
    lot_name: str
    total_capacity: int
    current: int
    type: str          
    hours: str

# Expose model with computed fields
class LotSummary(BaseModel):
    lot_id: int
    lot_name: str
    total_capacity: int
    current: int
    percent_full: float
    state: Literal["EMPTY","LIGHT","MEDIUM","HEAVY","FULL"]
    type: str
    hours: str

# parse CSV data into Lot objects
def csv_parse(path: str) -> list[Lot]:
    rows: list[Lot] = []
    with open(path, "r", newline="") as f:
        reader = csv.DictReader(f, skipinitialspace=True)
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

# compute percent full
def percent_full(lot: Lot) -> float:
    return round((lot.current / lot.total_capacity) * 100.0, 1) if lot.total_capacity else 0.0

# compute crowd state
def full_type(p: float) -> str:
    if p == 0: return "EMPTY"
    if p < 40: return "LIGHT"
    if p < 70: return "MEDIUM"
    if p < 90: return "HEAVY"
    return "FULL"

# Create LotSummary from Lot
def to_summary(obj: Lot) -> LotSummary:
    pf = percent_full(obj)
    return LotSummary(
        lot_id=obj.lot_id,
        lot_name=obj.lot_name,
        total_capacity=obj.total_capacity,
        current=obj.current,
        percent_full=pf,
        state=full_type(pf),
        type=obj.type,
        hours=obj.hours
    )

# CORS (Cross-Origin Resource Sharing) settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",  # Vite dev
        "http://localhost:3000", "http://127.0.0.1:3000",  # Next.js dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# CSV columns: lot_id,lot_name,total_capacity,current,type,hours
parking_lots: list[Lot] = csv_parse("fabricated_data.csv")
lots_by_id = {l.lot_id: l for l in parking_lots}

@app.get("/")
async def root():
    return {"message": "Welcome to the ParkingPal API!"}


@app.get("/lots", response_model=List[LotSummary])
def list_lots(
    q: Optional[str] = Query(None, description="Search by name or ID"),
    lot_type: Optional[str] = Query(None, description="student|faculty|visitor"),
    sort: str = Query("percent_full", description="percent_full|lot_name|-percent_full|-lot_name"),
):
    def match(l: Lot) -> bool:
        if lot_type and l.type.lower() != lot_type.lower():
            return False
        if q:
            if q.isdigit() and int(q) == l.lot_id:
                return True
            if q.lower() not in l.lot_name.lower():
                return False
        return True

    filtered = [l for l in parking_lots if match(l)]

    key = sort.lstrip("-")
    reverse = sort.startswith("-")
    def keyfn(l: Lot):
        return percent_full(l) if key == "percent_full" else l.lot_name.lower()
    filtered.sort(key=keyfn, reverse=reverse)

    return [to_summary(l) for l in filtered]

@app.get("/lots/{lot_id}", response_model=LotSummary)
def get_lot(lot_id: int):
    lot = lots_by_id.get(lot_id)
    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")
    return to_summary(lot)