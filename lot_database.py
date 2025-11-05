import psycopg2
import psycopg2.extras
from random import random
from lot_dict import lot_dict
import datetime
import os

# Do NOT publically post password to public GitHub
DB_NAME = os.getenv("DB_NAME", "parkingpal_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "parking-pal")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

def establish_connection():
    connection = psycopg2.connect(
        dbname = DB_NAME,
        dbuser = DB_USER,
        dbpass = DB_PASS,
        dbhost = DB_HOST,
        dbport = DB_PORT,
    )

    return connection

def fetch_all_lots():
    connection = establish_connection()

    # Establish a cursor in the db, cursor is akin to a pointer
    # This cursor will be used to execute SQL queries
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots;")           # Execute SQL Query
    rows = cursor.fetchall()
    
    cursor.close()                                  # Close endpoints
    connection.close()

    # Construct a dict from data_type and row tuples
    data_type = ["lot_id", "lot_name", "total_capacity", "current_type", "hours"]
    joined_data = []
    
    for tups in rows:
        temp_dict.clear()
        for x in range(0, len(tups)):
            temp_dict = {}
            temp_dict[data_type[x]] = tups[x]
        joined_data.append(temp_dict)

    return joined_data

def rand_capacity():
    return int(random() * 500) + 50

def rand_current(capacity: int):
    return int(random() * capacity)

# lot_id | lot_name | total_capacity | current |  type   |  hours
def randomize_Lot_Data(num_lots: int):
    connection = establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots ORDER BY lot_id DESC LIMIT 1")
    prev_row = cursor.fetchone()[0]

    for lot in range(prev_row, (prev_row+num_lots)):
        lot_id = prev_row+1
        prev_row += 1

        lot_name = 'P' + f'{str(random.randint(0,10))}'
        total_capacity = rand_capacity()
        current = rand_current(total_capacity)

        type = "student"
        # Create a dt obj for start and stop
        hours = "07:00-20:00"

        cursor.execute(
            "INSERT INTO lots (lot_id, lot_name, total_capacity, current, type, hours) VALUES (%s, %s, %s, %s, %s, %s);",
            (lot_id, lot_name, total_capacity, current, type, hours)
        )
    
    connection.commit()
    cursor.close()
    connection.close()
    return
