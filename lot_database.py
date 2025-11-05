import psycopg2
import psycopg2.extras
from random import random
from random import randint
import lot_helper as lh
import datetime
import os


def fetch_all_lots():
    # Establish a cursor in the db, cursor is akin to a pointer
    # This cursor will be used to execute SQL queries
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots;")   # Execute SQL Query
    rows = cursor.fetchall()
    
    #connection.commit() # Not needed for non-modified queries
    cursor.close()    # Close endpoints
    connection.close()

    # Construct a dict from data_type and row tuples
    data_type = ["lot_id", "lot_name", "total_capacity", "current_type", "type", "hours"]
    joined_data = []
    
    for tups in rows:
        temp_dict = {}
        for x in range(len(tups)):
            temp_dict[data_type[x]] = tups[x]
        joined_data.append(temp_dict)

    return joined_data

def fetch_lot_by_id(lot_id: int):
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots WHERE lot_id = %s;", (lot_id,))
    row = cursor.fetchone()
    
    cursor.close()
    connection.close()

    if row is None:
        return None

    data_type = ["lot_id", "lot_name", "total_capacity", "current", "type", "hours"]
    lot_data = {}
    
    for x in range(0, len(row)):
        lot_data[data_type[x]] = row[x]

    return lot_data

def rand_capacity():
    return int(random() * 500) + 50

def rand_current(capacity: int):
    return int(random() * capacity)

# lot_id|lot_name|total_capacity|current|type|hours
def randomize_Lot_Data(num_lots: int):
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots ORDER BY lot_id DESC LIMIT 1")
    prev_row = cursor.fetchone()[0]

    for lot in range(prev_row, (prev_row+num_lots)):
        lot_id = prev_row+1
        prev_row += 1

        lot_name = 'P' + f'{str(randint(0,10))}'
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

def runFullTest():
    randomize_Lot_Data(5)
    print(fetch_all_lots())
    print(fetch_lot_by_id(1))
    pass


if __name__ == "__main__":
    runFullTest()