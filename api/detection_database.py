from random import random, randint, lognormvariate
import lot_helper as lh
import math
from datetime import *
from pydantic import BaseModel

START_TIME = datetime.time(7, 0, 0)     # 7AM Start Time
END_TIME = datetime.time(20, 0, 0)      # 8PM End time

# Set dict to correspond lot_id to lot_name
EVENTS_TABLE = "parking_events"

class Vehicle(BaseModel):
    dt: datetime
    is_entering: bool       #1 is entering, 0 is exiting 
    lot_id: int

conn = lh.establish_connection()

# takes a Vehicle Obj and adds it to the parking_events table
# lot_id | lot_name | total_capacity | current |  type   |  hours
def insert_vehicle_entry(vehicle: Vehicle):

    connection = conn
    cursor = connection.cursor()

    lot_id = vehicle.lot_id
    is_entering = vehicle.is_entering
    cursor.execute(f"SELECT * FROM lots WHERE lot_id = '{lot_id}';".format(str(lot_id)))
    row = cursor.fetchone()
    if not is_entering and ((row[3]-1) < 0):
        print("Error lot_capacity can not be less than 0.")
        return

    insert_query = f"""
    INSERT INTO {EVENTS_TABLE} (dt, is_entering, lot_id)
    VALUES (%s, %s, %s);
    """

    cursor.execute(insert_query, (vehicle.dt, vehicle.is_entering, vehicle.lot_id))
    connection.commit()

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
    return future_date

def fab_vehicle_entry():
    connection = conn
    cursor = connection.cursor()

    cursor.execute(f"SELECT COUNT(*) FROM {EVENTS_TABLE};")
    check_empty = bool(cursor.fetchone())

    #Create one datetime object to base future entries off of
    # Make sure that the table is not empty otherwise we cannot base time off of previous entry

    # DATABASE STRUCTURE
    # dt | is_entering | lot_id
    if check_empty is True:
        check_empty = False
        time = datetime.now()

        if(time.hour() < START_TIME):
            time = time.replace(hour = START_TIME)
        elif(time.hour() > END_TIME):
            time = time.replace(day = (time.day()+1),hour = START_TIME)

        is_entering = randint(0,1)
        lot_id = 11 #randint(0,10) - 11 for testing

        v = Vehicle(dt = time, is_entering = is_entering, lot_id= lot_id)
        insert_vehicle_entry(v)
        return
    
    
    cursor.execute(f"SELECT * FROM {EVENTS_TABLE} ORDER BY dt DESC LIMIT 1")
    recent_dt = cursor.fetchone()[0]

    time = progress_time(recent_dt)
    if(time.hour() < START_TIME):
        time = time.replace(hour = START_TIME)
    elif(time.hour() > END_TIME):
        time = time.replace(day = (time.day()+1),hour = START_TIME)

        
    is_entering = randint(0,1)
    lot_id = randint(0,10)

    v = Vehicle(dt = time, is_entering = is_entering, lot_id= lot_id)
    insert_vehicle_entry(v)
    return

# def simulate_day():
    

if __name__ == "__main__":
    #Debugging area :^)

    #print only the time from datetime object in pst and just the date
    connection = conn
    connection.autocommit = True
    cursor = connection.cursor()
    x = datetime.now()

    fab_vehicle_entry()
    fab_vehicle_entry()

    cursor.execute(f"SELECT * FROM {EVENTS_TABLE}")
    dt_obj = cursor.fetchone()
    connection.commit()

    cursor.close()
    connection.close()


    for i in range(len(dt_obj)):
        print(f"Index {i}: {dt_obj[i]}")

    print()
    print(type(dt_obj[0]))

    print(x.strftime("%Y-%m-%d"))
    print(x.strftime("%H:%M:%S"))

    