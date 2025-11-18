import lot_helper as lh
from pydantic import BaseModel, Field
from datetime import datetime

class pin(BaseModel):
    lot_id: int
    loc_x: float
    loc_y: float
    time_alive: datetime = Field(default_factory=datetime.now)


# check if pins are over 30 mins old and delete them if so, might have to be handled on the frontend side to queuery periodically
def delete_old_pins():
    connection = lh.establish_connection()
    cursor = connection.cursor()

    delete_query = f"""
    DELETE FROM pins
    WHERE time_alive < NOW() - INTERVAL '30 minutes';
    """

    cursor.execute(delete_query)
    connection.commit()

    cursor.close()
    connection.close()

def checkValidPinLoc():
    pass

def insert_pin(pin: pin):
    if(pin.lot_id not in lh.lot_dict()):
        print("Error: Invalid lot_id for pin insertion.")
        return
    connection = lh.establish_connection()
    cursor = connection.cursor()

    insert_query = f"""
    INSERT INTO pins (lot_id, loc_x, loc_y, time_created)
    VALUES (%s, %s, %s, %s);
    """

    cursor.execute(insert_query, (pin.lot_id, pin.loc_x, pin.loc_y, pin.time_alive))
    connection.commit()

    cursor.close()
    connection.close()

def create_pin_object(lot_id: int = -1, loc_x: float = 0.0, loc_y: float = 0.0) -> pin:
    return pin(
        lot_id = lot_id,
        loc_x = loc_x,
        loc_y = loc_y,
    )

def fetch_all_pins():
    connection = lh.establish_connection()
    cursor = connection.cursor()

    cursor.execute("SELECT * FROM pins;")
    rows = cursor.fetchall()

    cursor.close()
    connection.close()

    joined_data = []

    data_type = ["lot_id", "loc_x", "loc_y", "time_alive"]
    for tups in rows:
        temp_dict = {}
        for x in range(len(data_type)):
            temp_dict[data_type[x]] = tups[x]
        joined_data.append(temp_dict)

    return joined_data