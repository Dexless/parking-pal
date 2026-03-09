from typing import Optional
from uuid import UUID

import lot_helper as lh
from pydantic import BaseModel, Field


class VehiclePin(BaseModel):
    uuid: UUID
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


def _ensure_pins_table(cursor) -> None:
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS pins (
            uuid UUID,
            lat DOUBLE PRECISION,
            lon DOUBLE PRECISION
        );
        """
    )
    cursor.execute("ALTER TABLE pins ADD COLUMN IF NOT EXISTS uuid UUID;")
    cursor.execute("ALTER TABLE pins ADD COLUMN IF NOT EXISTS lat DOUBLE PRECISION;")
    cursor.execute("ALTER TABLE pins ADD COLUMN IF NOT EXISTS lon DOUBLE PRECISION;")
    cursor.execute(
        """
        SELECT EXISTS (
            SELECT 1
            FROM information_schema.columns
            WHERE table_schema = current_schema()
              AND table_name = 'pins'
              AND column_name = 'id'
        );
        """
    )
    has_id = cursor.fetchone()[0]
    if has_id:
        cursor.execute("CREATE SEQUENCE IF NOT EXISTS pins_id_seq;")
        cursor.execute("ALTER SEQUENCE pins_id_seq OWNED BY pins.id;")
        cursor.execute("ALTER TABLE pins ALTER COLUMN id SET DEFAULT nextval('pins_id_seq');")
        cursor.execute(
            """
            SELECT setval(
                'pins_id_seq',
                COALESCE((SELECT MAX(id) FROM pins), 0) + 1,
                false
            );
            """
        )


def upsert_vehicle_pin(vehicle_pin: VehiclePin) -> VehiclePin:
    connection = lh.establish_connection()
    cursor = connection.cursor()
    try:
        _ensure_pins_table(cursor)
        cursor.execute(
            """
            DELETE FROM pins
            WHERE uuid = %s::uuid;
            """,
            (str(vehicle_pin.uuid),),
        )
        cursor.execute(
            """
            INSERT INTO pins (uuid, lat, lon)
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
        _ensure_pins_table(cursor)
        cursor.execute(
            """
            SELECT lat, lon
            FROM pins
            WHERE uuid = %s::uuid
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
        _ensure_pins_table(cursor)
        cursor.execute(
            "DELETE FROM pins WHERE uuid = %s::uuid;",
            (str(user_uuid),),
        )
        connection.commit()
        return cursor.rowcount > 0
    finally:
        cursor.close()
        connection.close()
