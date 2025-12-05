# Run: fastapi dev main.py
# Swagger: http://127.0.0.1:8000/docs
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import lot_helper as lh
import lot_database as ldb
import detection_database as ddb
import pin_database as pdb

app = FastAPI(title="ParkingPal API")

# compute crowd state
def full_type(p: float) -> str:
    if p == 0: return "EMPTY"
    if p < 40: return "LIGHT"
    if p < 70: return "MEDIUM"
    if p < 90: return "HEAVY"
    return "FULL"

# Create LotSummary from Lot
def to_summary(obj: lh.Lot) -> lh.LotSummary:
    pf = int((obj.current / obj.total_capacity) * 100)
    return lh.LotSummary(
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
# Add CORS for expo development servers
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",  # Vite dev
        "http://localhost:3000", "http://127.0.0.1:3000",  # Next.js dev
        "http://localhost:8081", "http://127.0.0.1:8081",  # React Native dev
        "exp://127.0.0.1:19000", "exp://localhost:19000",  # Expo dev
        "exp://129.8.225.20:8081"  # Expo LAN
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to the ParkingPal API!"}

# Returns all lots that match the given filters
# Filters by optional name/ID search and lot type
# Sorts by percent full or name (asc/desc)
# Converts full lot data to summarized form before returning
@app.get("/lots", response_model=List[lh.LotSummary])
def list_lots(
    search_query: Optional[str] = Query(None, description="Search by name or ID"),
    lot_category: Optional[str] = Query(None, description="student|faculty|visitor"),
    sort_option: str = Query("percent_full", description="percent_full|lot_name|-percent_full|-lot_name"),
    ):
    parking_lots = ldb.fetch_all_lots()
    def lot_matches(lot: lh.Lot) -> bool:
        if lot_category and lot.type.lower() != lot_category.lower():
            return False
        if search_query:
            if search_query.isdigit() and int(search_query) == lot.lot_id:
                return True
            if search_query.lower() not in lot.lot_name.lower():
                return False
        return True

    matching_lots = []
    for lot in parking_lots:
        if lot_matches(lot):
            matching_lots.append(lot)

    # Grab sort option and char[0] for descending
    sort_field = sort_option.lstrip("-")
    descending_order = sort_option.startswith("-")

    def sort_key_function(lot: lh.Lot):
        if sort_field == "percent_full":
            return int((lot.current / lot.total_capacity) * 100)
        else:
            return lot.lot_name.lower()

    matching_lots.sort(key=sort_key_function, reverse=descending_order)

    summarized_lots = []
    for lot in matching_lots:
        summarized_lot = to_summary(lot)
        summarized_lots.append(summarized_lot)

    return summarized_lots


# Get lot by ID
@app.get("/lots/{lot_id}", response_model=lh.LotSummary)
async def get_lot(lot_id: int):
    print("Fetching lot ID:", lot_id)
    lot = ldb.fetch_lot_by_id(lot_id)
    if not lot:
        return lh.LotSummary(
            lot_id=lot_id,
            lot_name='N/A',
            total_capacity=0,
            current=0,
            percent_full=0,
            state="N/A",
            type="N/A",
            hours="N/A"
        )
    return to_summary(lot)

# Get all lot's crowd state
@app.get("/lots_percent_full", response_model=List[str])
async def get_lots_percent_full():
    parking_lots = ldb.fetch_all_lots()
    lots_percent_full = []
    for lot in parking_lots:
        lots_percent_full.append(full_type(int((lot.current / lot.total_capacity) * 100)))
    return lots_percent_full

# Endpoint to randomize lot data for all or specific lot
@app.post("/randomize_all_lot_events/{lot_num}/{all_lots}", status_code=status.HTTP_204_NO_CONTENT)
async def randomize_all_lot_events(lot_num: int, all_lots: bool):
    ldb.randomize_lot_data(lot_num, all_lots)


# Endpoint to post pins to the database
@app.post("/pins", response_model=pdb.pin)
async def create_pin(lot_id: int, loc_x: float, loc_y: float):
    pin = pdb.create_pin_object(lot_id=lot_id, loc_x=loc_x, loc_y=loc_y)
    pdb.insert_pin(pin)
    return pin

# Endpoint to randomize lot data by ID in case lot is not populated
@app.post("/randomize_lot/{lot_id}", response_model=lh.LotSummary)
async def randomize_lot(lot_id: int):
    lot = ldb.fetch_lot_by_id(lot_id)

    if not lot:
        raise HTTPException(status_code=404, detail="Lot not found")

    # Randomize lot data
    ldb.randomize_lot_data(lot_id, False)

    updated_lot = ldb.fetch_lot_by_id(lot_id)
    return to_summary(updated_lot)

# Endpoint to post pins to the database (v1.1)
@app.post("/pins", response_model=pdb.pin)
async def create_pin(lot_id: int, loc_x: float, loc_y: float):
    pin = pdb.create_pin_object(lot_id=lot_id, loc_x=loc_x, loc_y=loc_y)
    pdb.insert_pin(pin)
    return pin
