import lot_helper as lh
import lot_database as ldb


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

def startUVicorn():
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000)

if __name__ == "__main__":
    testLotDB()

    print()
    print("Starting Uvicorn Server...")
    startUVicorn()

    print("Api and Database Tests Complete!")

