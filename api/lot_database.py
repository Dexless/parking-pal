from random import random
import lot_helper as lh

def printTableContents():
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots ORDER BY lot_id;")
    rows = cursor.fetchall()
    for row in rows:
        print(row)

    cursor.close()
    connection.close()

def fetch_all_lots():
    # Establish a cursor in the db, cursor is akin to a pointer
    # This cursor will be used to execute SQL queries
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM lots ORDER BY lot_id;")   # Execute SQL Query
    rows = cursor.fetchall()
    
    #connection.commit() # Not needed for non-modified queries
    cursor.close()    # Close endpoints
    connection.close()

    # Construct a dict from data_type and row tuples
    data_type = ["lot_id", "lot_name", "total_capacity", "current_type", "type", "hours"]
    joined_data = []
    
    # for tups in rows:
    #     temp_dict = {}
    #     for x in range(len(tups)):
    #         temp_dict[data_type[x]] = tups[x]
    #     joined_data.append(temp_dict)

    for tups in rows:
        lot = lh.Lot(
        lot_id = tups[0],
        lot_name = tups[1],
        total_capacity = tups[2],
        current = tups[3],
        type = tups[4],      
        hours = tups[5]
        )
        joined_data.append(lot)

    return joined_data

def fetch_lot_by_id(lot_id: int) -> lh.Lot:
    connection = lh.establish_connection()
    cursor = connection.cursor()

    # For some reason lot_id requires , even though it's a single param
    cursor.execute("SELECT * FROM lots WHERE lot_id = %s;", (lot_id,))
    row = cursor.fetchone()
    
    cursor.close()
    connection.close()

    if row is None:
        return None

    lot = lh.Lot(
    lot_id = row[0],
    lot_name = row[1],
    total_capacity = row[2],
    current = row[3],
    type = row[4],      
    hours = row[5]
    )

    return lot

def fetch_lot_by_name(lot_name: str) -> lh.Lot:
    connection = lh.establish_connection()
    cursor = connection.cursor()

    # For some reason lot_id requires , even though it's a single param
    cursor.execute("SELECT * FROM lots WHERE lot_name = %s;", (lot_name,))
    row = cursor.fetchone()
    
    cursor.close()
    connection.close()

    if row is None:
        return None

    lot = lh.Lot(
    lot_id = row[0],
    lot_name = row[1],
    total_capacity = row[2],
    current = row[3],
    type = row[4],      
    hours = row[5]
    )

    return lot

def rand_capacity():
    return int(random() * 500) + 50

def rand_current(capacity: int):
    return int(random() * capacity)

# lot_id|lot_name|total_capacity|current|type|hours
def randomize_Lot_Data(lot_id: int, all_lots = False):
    connection = lh.establish_connection()
    cursor = connection.cursor()

    if all_lots:
        cursor.execute("SELECT * FROM lots;")
        rows = cursor.fetchall() # Grab every tuple in the table
        for row in rows: # Iterate through each tuple
            lot_id = row[0] # First element is lot_id
            total_capacity = rand_capacity()
            current = rand_current(total_capacity)
            cursor.execute(
                "UPDATE lots SET total_capacity = %s, current = %s WHERE lot_id = %s;",
                (total_capacity, current, lot_id)
            ) # Overwrite with new random values
    else:
            total_capacity = rand_capacity()
            current = rand_current(total_capacity)
            cursor.execute(
                "UPDATE lots SET total_capacity = %s, current = %s WHERE lot_id = %s;",
                (total_capacity, current, lot_id)
            )

    connection.commit()
    cursor.close()
    connection.close()
    return