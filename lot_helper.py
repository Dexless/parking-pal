# Returns a dict of key value pairs corresponding with lot_id and lot_name
import psycopg2

def lot_dict():
    lot_dict = {0: "P1", 1: "P2", 2: "P3", 3: "P5", 4: "P6", 5: "P9", 6: "P10", 7: "P11", 8: "P13", 9: "P15", 10: "P20", 11: "P27"}
    return lot_dict

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

    cursor.execute("TRUNCATE TABLE %s;", (table))
    connection.commit()

    cursor.close()
    connection.close()