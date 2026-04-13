import random
import lot_helper as lh
import math
import lot_database as ldb
from datetime import datetime, timedelta
from pydantic import BaseModel

START_TIME = 7      # 7 AM
END_TIME   = 20     # 8 PM

# Set dict to correspond lot_id to lot_name
EVENTS_TABLE = "parking_events"

class Vehicle(BaseModel):
    dt: datetime
    is_entering: bool       #1 is entering, 0 is exiting 
    lot_id: int

# takes a Vehicle Obj and adds it to the parking_events table
# lot_id | lot_name | total_capacity | current |  type   |  hours
def insert_vehicle_entry(vehicle: Vehicle):
    lot_id = vehicle.lot_id
    is_entering = vehicle.is_entering

    lot = ldb.fetch_lot_by_id(lot_id)
    if lot is None:
        print(f"Error lot_id {lot_id} does not exist.")
        return None

    if is_entering and ((lot.current + 1) > lot.total_capacity):
        print("Error lot_capacity can not exceed total capacity.")
        return None

    if not is_entering and ((lot.current - 1) < 0):
        print("Error lot_capacity can not be less than 0.")
        return None

    connection = lh.establish_connection()
    cursor = connection.cursor()

    insert_query = f"""
    INSERT INTO {EVENTS_TABLE} (dt, is_entering, lot_id)
    VALUES (%s, %s, %s);
    """

    # Make dt microseconds 0 for db consistency
    vehicle.dt = vehicle.dt.replace(microsecond=0)

    cursor.execute(insert_query, (vehicle.dt, vehicle.is_entering, vehicle.lot_id))

    # Now we update lots table current count based on lot_id and is_entering
    # check if the lot_id is at max capacity or 0 before updating
    if is_entering:
        cursor.execute("UPDATE lots SET current = current + 1 WHERE lot_id = %s;", (lot_id,))
    else:
        cursor.execute("UPDATE lots SET current = current - 1 WHERE lot_id = %s;", (lot_id,))

    connection.commit()

    cursor.close()
    connection.close()

    return vehicle



# Lot of math here get ready
def _progress_time(dt: datetime, tails = 0.05) -> datetime:
    skew = 0

    # We flip a weighted coin where p_tails happens 5% of the time and heas happens 95 % of the time
    if random.random() > tails:
        # When heads hits we take a random uniform value between 1,5 std = 0 at 3 so most likely 3
        skew = random.uniform(1,5)
    else:
        # When tails hits we use lognormvariate which allows us to skewed dist along an centered domain (50mins) and std of 0.25 allowing for values ranging ~40 and 65 one std dev +-
        mu = math.log(50)
        sigma = 0.25
        skew = random.lognormvariate(mu, sigma)

        # Cut values off that are not within normal ~99% domain
        if(skew > 80):
            skew = 80
        if(skew < 5 ):
            skew = 5

    # Add the skew to previous time so DES steps are progressive
    future_date = dt + timedelta(minutes=skew)
    if future_date.hour >= END_TIME:
        future_date = (future_date + timedelta(days=1)).replace(hour=START_TIME, minute=0, second=0, microsecond=0)
    return future_date

def _randomizeIsEntering(lot_id: int) -> bool:
    lot = ldb.fetch_lot_by_id(lot_id)
    if lot is None:
        raise ValueError(f"Lot {lot_id} does not exist.")
    if lot.total_capacity <= 0:
        raise ValueError(f"Lot {lot_id} has no capacity.")
    if lot.current <= 0:
        return True
    if lot.current >= lot.total_capacity:
        return False

    lot_full_percent = int((lot.current / lot.total_capacity) * 100)
    cf = random.random()

    print(f"Lot ID: {lot_id}, Current: {lot.current}, Capacity: {lot.total_capacity}, Full%: {lot_full_percent}, Random CF: {cf}")


    if lot_full_percent <= 80:
        if cf < 0.9:    #Growing
            return True
        else:
            return False
    else:
        if cf < 0.1:    #Shrinking
            return True
        else:
            return False
    return random.choice([True, False])

def _select_lot_id(input_lot: int = -1) -> int:
    if input_lot >= 0:
        return input_lot
    return random.choice(list(lh.lot_dict().keys()))


def fab_vehicle_entry(input_lot: int = -1, select_dt: datetime | None = None):
    lot_id = _select_lot_id(input_lot)
    event_dt = select_dt or datetime.now()
    is_entering = _randomizeIsEntering(lot_id)

    v = Vehicle(dt=event_dt, is_entering=is_entering, lot_id=lot_id)

    return v

def simulate_single_entry(input_lot: int = -1, select_dt: datetime | None = None):
    v = fab_vehicle_entry(input_lot, select_dt)
    return insert_vehicle_entry(v)

def simulate(days: int = 0, itterations: int = 0, input_lot: int = -1):
    vehicles = []
    if (days >= 1 and itterations >= 1) or days < 0 or itterations < 0 or (days == 0 and itterations == 0):
        print("Error: Please only specify either days or itterations, not both (or neither).")
        return vehicles
    
    if days >= 1:
        end_dt = datetime.now() + timedelta(days=days)
        v = simulate_single_entry(input_lot)
        while v is not None and v.dt < end_dt:
            vehicles.append(v)
            v = simulate_single_entry(input_lot, _progress_time(v.dt))
        
    else:
        for i in range(itterations):
            v = simulate_single_entry(input_lot)
            if v is not None:
                vehicles.append(v)

    return vehicles
    

if __name__ == "__main__":
    #Debugging area :^)

    #print only the time from datetime object in pst and just the date
    connection = lh.establish_connection()
    connection.autocommit = True
    cursor = connection.cursor()
    x = datetime.now()

    for i in range(200):
        fab_vehicle_entry()

    cursor.close()
    connection.close()

    print()

    # print(x.strftime("%Y-%m-%d"))
    # print(x.strftime("%H:%M:%S"))

    lh.clearTable(EVENTS_TABLE)



    
