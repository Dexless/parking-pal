import psycopg2
from random import random, randint
import os
import time
from datetime import *
from pydantic import BaseModel

# Set dict to correspond lot_id to lot_name

# Do NOT publically post password to public GitHub
DB_NAME = os.getenv("DB_NAME", "parkingpal_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "parking-pal")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

EVENTS_TABLE = "parking_events"

class Vehicle(BaseModel):
    dt: datetime
    is_entering: bool       #1 is entering, 0 is exiting 
    lot_id: int

def clear_table():
    connection = establish_connection()
    cursor = connection.cursor()

    cursor.execute(f"DELETE FROM {EVENTS_TABLE};")
    connection.commit()

    cursor.close()
    connection.close()

def establish_connection():
    conn = psycopg2.connect(
        host="localhost",
        database="parkingpal_db",
        user="postgres",
        password="parking-pal",
        port="5432"
    )

    return conn

# takes a Vehicle Obj and adds it to the parking_events table
# lot_id | lot_name | total_capacity | current |  type   |  hours
def insert_vehicle_entry(vehicle: Vehicle):

    connection = establish_connection()
    cursor = connection.cursor()

    lot_id = vehicle.lot_id
    is_entering = vehicle.is_entering
    cursor.execute(f"SELECT * FROM lots WHERE lot_id = '{lot_id}';".format(str(lot_id)))
    row = cursor.fetchone()
    if not is_entering and ((row[3]-1) < 0):
        return

    insert_query = f"""
    INSERT INTO {EVENTS_TABLE} (dt, is_entering, lot_id)
    VALUES (%s, %s, %s);
    """

    cursor.execute(insert_query, (vehicle.dt, vehicle.is_entering, vehicle.lot_id))
    connection.commit()

    cursor.close()
    connection.close()

def progress_time(dt: datetime) -> datetime:
    #Apply normal distribution skew left with median of -0.4 and std dev = 0.3 (I think) 
    skew = randint(1, 100)
    future_date = dt + timedelta(minutes=skew)
    return future_date

def fab_vehicle_entry():
    connection = establish_connection()
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
        is_entering = randint(0,1)
        lot_id = 11 #randint(0,10) - 11 for testing

        v = Vehicle(dt = time, is_entering = is_entering, lot_id= lot_id)
        insert_vehicle_entry(v)
        return

    cursor.execute(f"SELECT * FROM {EVENTS_TABLE} ORDER BY dt DESC LIMIT 1")
    recent_dt = cursor.fetchone()[0]

    time = progress_time(recent_dt)
    is_entering = randint(0,1)
    lot_id = randint(0,10)

    v = Vehicle(dt = time, is_entering = is_entering, lot_id= lot_id)
    insert_vehicle_entry(v)
    return

#def simulate_day():
    

if __name__ == "__main__":
    #Debugging area :^)

    #print only the time from datetime object in pst and just the date
    connection = establish_connection()
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

    