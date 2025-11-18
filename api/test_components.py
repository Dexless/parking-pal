import lot_helper as lh
import lot_database as ldb
import detection_database as ddb

def testLotDB():
    # Test Print Table Contents
    ldb.printTableContents()
    print("Successful Print of Table Contents")
    print()

    # Test Fetch All Lots
    test1 = ldb.fetch_all_lots()
    for lot in test1:
        print(lot)
    print("Successful Fetch of All Lots")
    ldb.printTableContents()
    print()

    # Test Fetch Each Lot by ID
    lots = lh.lot_dict()
    for x in range(len(lots)):
        lot = ldb.fetch_lot_by_id(x)
        print(lot)
    print("Successful Fetch of Each Lot by ID")
    print()
    ldb.printTableContents()
    print()

    # Test Randomize all Lot Data
    for x in range(len(lots)):
        ldb.randomize_Lot_Data(x)
    print("Successful Randomization of All Lot Data")
    ldb.printTableContents()

# Test detection_database functions
def testDetectionDB():
    from datetime import datetime

    # Create Vehicle Entries
    vehicle1 = ddb.Vehicle(dt=ddb.progress_time() + datetime.now(), is_entering=True, lot_id=0)
    vehicle2 = ddb.Vehicle(dt=ddb.progress_time() + datetime.now(), is_entering=False, lot_id=1)

    # Insert Vehicle Entries
    ddb.insert_vehicle_entry(vehicle1)
    ddb.insert_vehicle_entry(vehicle2)

    print("Successful Insertion of Vehicle Entries")
    print()
    ldb.printTableContents()

    # Fetch and print all vehicle entries
    vehicles = ddb.fetch_all_vehicle_entries()
    for vehicle in vehicles:
        print(vehicle)

    print("Successful Fetch of All Vehicle Entries")
    print()
    ldb.printTableContents()

def startUVicorn():
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

if __name__ == "__main__":
    testLotDB()

    print()
    print("Starting Uvicorn Server...")
    startUVicorn()

    print("Api and Database Tests Complete!")

    # testDetectionDB()
    testDetectionDB()
    print("Detection Database Tests Complete!")