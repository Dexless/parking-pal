from typing import Optional
from uuid import UUID

import lot_helper as lh
from pydantic import BaseModel, Field


class VehiclePin(BaseModel):
    uuid: UUID
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


def upsert_vehicle_pin(vehicle_pin: VehiclePin) -> VehiclePin:
    connection = lh.establish_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            DELETE FROM pins
            WHERE pins.id = %s::uuid;
            """,
            (str(vehicle_pin.uuid),),
        )
        cursor.execute(
            """
            INSERT INTO pins (id, lat, lon)
            VALUES (%s::uuid, %s, %s);
            """,
            (str(vehicle_pin.uuid), vehicle_pin.lat, vehicle_pin.lon),
        )
        connection.commit()
        return vehicle_pin
    finally:
        cursor.close()
        connection.close()


def fetch_vehicle_pin(user_uuid: UUID) -> Optional[VehiclePin]:
    connection = lh.establish_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            """
            SELECT lat, lon
            FROM pins
            WHERE pins.id = %s::uuid
              AND lat IS NOT NULL
              AND lon IS NOT NULL
            LIMIT 1;
            """,
            (str(user_uuid),),
        )
        row = cursor.fetchone()
        if row is None:
            return None
        return VehiclePin(uuid=user_uuid, lat=row[0], lon=row[1])
    finally:
        cursor.close()
        connection.close()


def delete_vehicle_pin(user_uuid: UUID) -> bool:
    connection = lh.establish_connection()
    cursor = connection.cursor()
    try:
        cursor.execute(
            "DELETE FROM pins WHERE pins.id = %s::uuid;",
            (str(user_uuid),),
        )
        connection.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        connection.close()
