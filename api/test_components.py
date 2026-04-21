# pytest -q
import pytest
import lot_helper as lh
import lot_database as ldb
import datetime
import detection_database as ddb
import main



# Lot Database Tests (lot_database)
def test_fetch_all_lots_returns_list():
    lots = ldb.fetch_all_lots()
    assert isinstance(lots, list), "fetch_all_lots() should return a list"


def test_fetch_lot_by_id():
    lots_dict = lh.lot_dict()
    assert isinstance(lots_dict, dict), "lh.lot_dict() should return a dict"

    for lot_id in range(len(lots_dict)):
        lot = ldb.fetch_lot_by_id(lot_id)
        assert lot is not None, f"fetch_lot_by_id({lot_id}) returned None"


def test_randomize_lot_data_runs_without_error():
    lots_dict = lh.lot_dict()
    for lot_id in range(len(lots_dict)):
        ldb.randomize_lot_data(lot_id)

    lots = ldb.fetch_all_lots()
    assert isinstance(lots, list)
    assert len(lots) >= 0

def test_simulate_single_entry():
    v = ddb.simulate_single_entry()
    assert v is not None, "simulate_single_entry() should return a Vehicle"
    assert isinstance(v, ddb.Vehicle), "simulate_single_entry() should return a Vehicle instance"

def test_simulate_multiple_entries():
    vehicles = ddb.simulate(itterations=10)
    assert isinstance(vehicles, list), "simulate() should return a list"
    assert len(vehicles) == 10, "simulate() should return the correct number of entries"
    for v in vehicles:
        assert isinstance(v, ddb.Vehicle), "simulate() should return a list of Vehicle instances"


# Detection Database Tests (detection_database)
def test_insert_and_fetch_vehicle_entries():
    vehicle1 = ddb.Vehicle(
        dt=datetime.datetime.now(tz=datetime.timezone.utc),
        is_entering=True,
        lot_id=0
    )
    vehicle2 = ddb.Vehicle(
        dt=datetime.datetime.now(tz=datetime.timezone.utc),
        is_entering=False,
        lot_id=1
    )

    # Insert
    ddb.insert_vehicle_entry(vehicle1)
    ddb.insert_vehicle_entry(vehicle2)

    # Fetch
    connection = lh.establish_connection()
    cursor = connection.cursor()

    queury = "SELECT dt, is_entering, lot_id FROM parking_events WHERE dt = %s AND dt = %s;"
    cursor.execute(queury, (vehicle1.dt, vehicle2.dt))

    rows = cursor.fetchall()

    assert len(rows) == 2, "Should fetch exactly 2 entries"
    for r in rows:
        assert r[0] == vehicle1.dt or r[0] == vehicle2.dt, "Fetched dt does not match inserted dt"
        assert r[1] == vehicle1.is_entering or r[1] == vehicle2.is_entering, "Fetched is_entering does not match inserted is_entering"
        assert r[2] == vehicle1.lot_id or r[2] == vehicle2.lot_id, "Fetched lot_id does not match inserted lot_id"


# Helper function
def get_lot(lot_id):
    lot = ldb.fetch_lot_by_id(lot_id)
    if not lot:
        return lh.LotSummary(
            lot_id=lot_id,
            lot_name='N/A',
            total_capacity=0,
            current=0,
            percent_full=0,
            state="N/A",
            type="N/A",
            hours="N/A"
        )
    return main.to_summary(lot)

# Load dict call helper function and assert with pytest
def assert_lot_by_id(lot_id):
    lots_dict = lh.lot_dict()
    assert isinstance(lots_dict, dict), "lh.lot_dict() should return a dict"

    lot = get_lot(lot_id)
    assert lot.lot_id == lot_id, f"Response lot_id mismatch for lot {lot_id}"
    assert lot.lot_name == lots_dict[lot_id], f"Response lot_name mismatch for lot {lot_id}"
