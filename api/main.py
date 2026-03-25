# Run: fastapi dev main.py
# Swagger: http://127.0.0.1:8000/docs
from fastapi import FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from uuid import UUID
import os
import httpx
import lot_helper as lh
import lot_database as ldb
import detection_database as ddb
import users_database as udb

app = FastAPI(title="ParkingPal API")

class UserCredentials(BaseModel):
    email: EmailStr
    password: str

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
# Some ports are redundant to run locally
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

@app.post("/auth/login")
async def login(user_credentials: UserCredentials):
    supabase_url = os.getenv("EXPO_PUBLIC_SUPABASE_URL")
    supabase_anon_key = os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    supabase_auth_url = f"{supabase_url}/auth/v1/token?grant_type=password"
    async with httpx.AsyncClient() as client:
        supabase_response = await client.post(
            supabase_auth_url,
            headers={
                "apikey": supabase_anon_key,
                "Authorization": f"Bearer {supabase_anon_key}",
                "Content-Type": "application/json",
            },
            json={
                "email": user_credentials.email,
                "password": user_credentials.password,
            },
        )

    response_data = supabase_response.json()
    if supabase_response.status_code >= 400:
        raise HTTPException(status_code=supabase_response.status_code, detail=response_data)

    return response_data

@app.post("/auth/register")
async def register(user_credentials: UserCredentials):
    supabase_url = os.getenv("EXPO_PUBLIC_SUPABASE_URL")
    supabase_anon_key = os.getenv("EXPO_PUBLIC_SUPABASE_ANON_KEY")
    supabase_auth_url = f"{supabase_url}/auth/v1/signup"
    async with httpx.AsyncClient() as client:
        supabase_response = await client.post(
            supabase_auth_url,
            headers={
                "apikey": supabase_anon_key,
                "Authorization": f"Bearer {supabase_anon_key}",
                "Content-Type": "application/json",
            },
            json={
                "email": user_credentials.email,
                "password": user_credentials.password,
            },
        )

    response_data = supabase_response.json()
    if supabase_response.status_code >= 400:
        raise HTTPException(status_code=supabase_response.status_code, detail=response_data)

    return response_data

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

# Get all lot fullness values
# This function was created because calling all lots and parsing just their % full didn't work and individual calls were too slow.
@app.get("/lots_percent_full", response_model=List[lh.LotPercentFull])
async def get_lots_percent_full():
    return ldb.fetch_lot_percent_full()

# Endpoint to randomize lot data for all or specific lot
@app.post("/randomize_all_lot_events/{lot_num}/{all_lots}", status_code=status.HTTP_204_NO_CONTENT)
async def randomize_all_lot_events(lot_num: int, all_lots: bool):
    ldb.randomize_lot_data(lot_num, all_lots)


@app.get("/profile/{user_uuid}", response_model=udb.UserProfile)
async def get_user_profile(user_uuid: UUID):
    return udb.fetch_user_profile(user_uuid)


@app.post("/profile", response_model=udb.UserProfile)
async def upsert_user_profile(profile: udb.UserProfile):
    return udb.upsert_user_profile(profile)


@app.post("/vehicle-pin", response_model=udb.VehiclePin)
async def upsert_vehicle_pin(pin: udb.VehiclePin):
    return udb.upsert_vehicle_pin(pin)


@app.get("/vehicle-pin/{user_uuid}", response_model=udb.VehiclePin)
async def get_vehicle_pin(user_uuid: UUID):
    pin = udb.fetch_vehicle_pin(user_uuid)
    if pin is None:
        raise HTTPException(status_code=404, detail="Vehicle pin not found")
    return pin


@app.delete("/vehicle-pin/{user_uuid}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_vehicle_pin(user_uuid: UUID):
    udb.delete_vehicle_pin(user_uuid)

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

