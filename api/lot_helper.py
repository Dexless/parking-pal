import psycopg2
from pydantic import BaseModel
from typing import Literal


# Enforce types with BModels
class Lot(BaseModel):
    lot_id: int
    lot_name: str
    total_capacity: int
    current: int
    type: str          
    hours: str

    # Print lot object nicely
    def __print__ (self):
        return f"Lot ID: {self.lot_id}, Lot Name: {self.lot_name}, Total Capacity: {self.total_capacity}, Current: {self.current}, Type: {self.type}, Hours: {self.hours}"

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

# Returns a dict of key value pairs corresponding with lot_id and lot_name
def lot_dict():
    lot_dict = {0: "P1", 1: "P2", 2: "P3", 3: "P5", 4: "P6", 5: "P9", 6: "P10", 7: "P11", 8: "P13", 9: "P15", 10: "P20", 11: "P27"}
    return lot_dict

def update_lots_current(is_entering: bool, lot_id: int):
    import lot_database as ldb
    connection = establish_connection()
    cursor = connection.cursor()

    # Check if updating would exceed capacity or go below 0
    lot = ldb.fetch_lot_by_id(lot_id)
    total_capacity = lot.total_capacity
    current = lot.current
    if is_entering and (current + 1) > total_capacity:
        print("Error lot_capacity can not exceed total capacity.")
        return
    if not is_entering and (current - 1) < 0:
        print("Error lot_capacity can not be less than 0.")
        return

    if is_entering:
        cursor.execute(f"UPDATE lots SET current = current + 1 WHERE lot_id = {lot_id};")
    else:
        cursor.execute(f"UPDATE lots SET current = current - 1 WHERE lot_id = {lot_id};")

    connection.commit()

    cursor.close()
    connection.close()


# Do NOT publically post password to public GitHub
class DB_Credentials:
    DB_HOST = "localhost"
    DB_NAME = "parkingpal_db"
    DB_USER = "postgres"
    DB_PASS = "parking-pal"
    DB_PORT = "5432"

def establish_connection():
    db = DB_Credentials()
    connection = psycopg2.connect(
        host=db.DB_HOST,
        database=db.DB_NAME,
        user=db.DB_USER,
        password=db.DB_PASS,
        port=db.DB_PORT
    )
    return connection

#VERY DANGEROUS - Only for testing purposes
def clearTable(table: str):
    connection = establish_connection()
    cursor = connection.cursor()

    cursor.execute(f"TRUNCATE TABLE {table};")
    connection.commit()

    cursor.close()
    connection.close()