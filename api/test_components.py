# pytest -q

import pytest
import lot_helper as lh
import lot_database as ldb
from datetime import datetime
import detection_database as ddb



# Lot Database Tests (lot_database)
def test_fetch_all_lots_returns_list():
    lots = ldb.fetch_all_lots()
    assert isinstance(lots, list), "fetch_all_lots() should return a list"


def test_fetch_lot_by_id_for_all_known_lots():
    lots_dict = lh.lot_dict()
    assert isinstance(lots_dict, dict), "lh.lot_dict() should return a dict"

    for lot_id in range(len(lots_dict)):
        lot = ldb.fetch_lot_by_id(lot_id)
        assert lot is not None, f"fetch_lot_by_id({lot_id}) returned None"


def test_randomize_lot_data_runs_without_error():
    lots_dict = lh.lot_dict()
    for lot_id in range(len(lots_dict)):
        ldb.randomize_Lot_Data(lot_id)

    lots = ldb.fetch_all_lots()
    assert isinstance(lots, list)
    assert len(lots) >= 0


# Detection Database Tests (detection_database)
def test_insert_and_fetch_vehicle_entries():
    vehicle1 = ddb.Vehicle(
        dt=ddb.progress_time() + datetime.now(),
        is_entering=True,
        lot_id=0
    )
    vehicle2 = ddb.Vehicle(
        dt=ddb.progress_time() + datetime.now(),
        is_entering=False,
        lot_id=1
    )

    # Insert
    ddb.insert_vehicle_entry(vehicle1)
    ddb.insert_vehicle_entry(vehicle2)

    # Fetch
    vehicles = ddb.fetch_all_vehicle_entries()
    assert isinstance(vehicles, list), "fetch_all_vehicle_entries() should return a list"

    # Best-effort membership checks (depends on how Vehicle is represented)
    # If vehicles are returned as dicts/tuples/objects, adjust these assertions accordingly.
    assert len(vehicles) >= 2, "Expected at least 2 vehicle entries after insertion"
