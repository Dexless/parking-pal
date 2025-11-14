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

    connection = lh.establish_connection()
    cursor = connection.cursor()

    lot_id = vehicle.lot_id
    is_entering = vehicle.is_entering

    lot = ldb.fetch_lot_by_id(lot_id)

    if not is_entering and ((lot.current - 1) < 0):
        print("Error lot_capacity can not be less than 0.")
        return


    insert_query = f"""
    INSERT INTO {EVENTS_TABLE} (dt, is_entering, lot_id)
    VALUES (%s, %s, %s);
    """

    # Make dt microseconds 0 for db consistency
    vehicle.dt = vehicle.dt.replace(microsecond=0)

    cursor.execute(insert_query, (vehicle.dt, vehicle.is_entering, vehicle.lot_id))
    connection.commit()


    # Now we update lots table current count based on lot_id and is_entering
    # check if the lot_id is at max capacity or 0 before updating
    if is_entering:
        lh.update_lots_current(True, lot_id)
    else:
        lh.update_lots_current(False, lot_id)

    cursor.close()
    connection.close()



# Lot of math here get ready
def progress_time(dt: datetime, tails = 0.05) -> datetime:
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
        future_date = future_date.replace(day=future_date.day + 1, hour=START_TIME, minute=0, second=0, microsecond=0)
    return future_date

def fab_vehicle_entry():
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute(f"SELECT COUNT(*) FROM {EVENTS_TABLE};")
    check_empty = cursor.fetchone()[0]

    # DATABASE STRUCTURE
    # dt | is_entering | lot_id
    if check_empty == 0:
        check_empty = False
        time = datetime.now()

        if time.hour < START_TIME:
            time = time.replace(hour=START_TIME, minute=0, second=0, microsecond=0)
        elif time.hour >= END_TIME:
            time = (time + timedelta(days=1)).replace(
                hour=START_TIME, minute=0, second=0, microsecond=0)

        is_entering = random.randint(0,1)
        lot_id = random.choice(list(lh.lot_dict().keys()))

        v = Vehicle(dt = time, is_entering = is_entering, lot_id= lot_id)
        insert_vehicle_entry(v)
        return
    
    # Create one datetime object to base future entries off of
    # Make sure that the table is not empty otherwise we cannot base time off of
    # previous entry
    cursor.execute(f"SELECT * FROM {EVENTS_TABLE} ORDER BY dt DESC LIMIT 1")
    recent_dt = cursor.fetchone()[0]

    time = progress_time(recent_dt)

    is_entering = random.randint(0,1)
    lot_id = random.randint(0,10)

    v = Vehicle(dt = time, is_entering = is_entering, lot_id= lot_id)
    insert_vehicle_entry(v)

    cursor.close()
    connection.close()

    return

# def simulate_day():
    

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



    