from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel, Field
from bson.objectid import ObjectId
from passlib.context import CryptContext
import random
from typing import Optional
from datetime import datetime
from contextlib import asynccontextmanager
from typing import List

app = FastAPI()

# MongoDB connection
#client = MongoClient("mongodb://localhost:27017")
#client = MongoClient("mongodb+srv://6330450121:VcFAG4YlWiQ3v8iw@cluster0.ehyz4.mongodb.net/myDatabase?retryWrites=true&w=majority")

#uri = "mongodb+srv://6330450121:VcFAG4YlWiQ3v8iw@cluster0.ehyz4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"
uri = "mongodb://localhost:27017"
# Create a new client and connect to the server
client = MongoClient(uri)
# Send a ping to confirm a successful connection
try:
    client.admin.command('ping')
    print("Pinged your deployment. You successfully connected to MongoDB!")
except Exception as e:
    print(e)

db = client["kitkats"]

# Ensure the collection exists
if "kitkats" not in db.list_collection_names():
    print("Collection 'kitkats' does not exist. Creating collection...")
    db.create_collection("kitkats")
else:
    print("Collection 'kitkats' already exists.")
collection = db["kitkats"]
store_db = client["store"]
store_collection = store_db["store"]
if "store" not in store_db.list_collection_names():
    print("Collection 'store' does not exist. Creating collection...")
    store_db.create_collection("store")
else:
    print("Collection 'store' already exists.")

# Pydantic model for the KitKat
class KitKat(BaseModel):
    agent: str
    data_lake: list[list]

class Store(BaseModel):
    data_lake: list[list]

@app.get("/")
async def root():
    return {"message": "Hello, welcome to the voting app!"}

# Helper function to generate ID based on the new structure
def generate_id(agent: str) -> str:
    created_date = datetime.now().strftime("%d-%m-%Y")
    created_time = datetime.now().strftime("%H.%M.%S")
    random_digits = random.randint(1000, 9999)
    return f"{agent}_{created_date}_{created_time}_{random_digits}"

# Create a kitkat
@app.post("/kitkats/")
async def create_kitkat(kitkat: KitKat):
    # Generate ID
    kitkat_id = generate_id(kitkat.agent)
    
    # Prepare the document to insert
    kitkat_data = {
        "ID": kitkat_id,
        "agent": kitkat.agent,
        "Createddate": datetime.now().strftime("%d-%m-%Y"),
        "Createdtime": datetime.now().strftime("%H.%M.%S"),
        "Data_Lake": kitkat.data_lake
    }
    
    # Insert into MongoDB
    result = collection.insert_one(kitkat_data)
    return {
        "id": kitkat_id,
        "agent": kitkat.agent,
        "Createddate": kitkat_data["Createddate"],
        "Createdtime": kitkat_data["Createdtime"],
        "Data_Lake": kitkat_data["Data_Lake"]
    }

@app.post("/store/")
async def create_store(store: Store):
    store_data = {
        # "Createddate": datetime.now().strftime("%d-%m-%Y"),
        "Createddate": "23-11-2024",
        "Data_Lake": store.data_lake
    }
    result = store_db["store"].insert_one(store_data)
    return {
        "Createddate": store_data["Createddate"],
        "Data_Lake": store_data["Data_Lake"]
    }

# Read a kitkat
@app.get("/kitkats/{kitkat_id}")
async def read_kitkat(kitkat_id: str):
    kitkat = collection.find_one({"ID": kitkat_id})
    if kitkat:
        return {
            "id": kitkat["ID"],
            "agent": kitkat["agent"],
            "Createddate": kitkat["Createddate"],
            "Createdtime": kitkat["Createdtime"],
            "Data_Lake": kitkat["Data_Lake"]
        }
    else:
        raise HTTPException(status_code=404, detail="kitkat not found")

# Update a kitkat
@app.put("/kitkats/{kitkat_id}")
async def update_kitkat(kitkat_id: str, kitkat: KitKat):
    result = collection.update_one(
        {"ID": kitkat_id},
        {"$set": {
            "agent": kitkat.agent,
            "Data_Lake": kitkat.data_lake
        }}
    )

    if result.modified_count == 1:
        return {"id": kitkat_id, "agent": kitkat.agent, "Data_Lake": kitkat.data_lake}
    else:
        raise HTTPException(status_code=404, detail="kitkat not found")
    
@app.get("/kitkats/sum/{created_date}")
async def sum_prods(created_date: str, agent: str = None):
    # Build the query with Createddate and optional agent filter
    query = {"Createddate": created_date}
    if agent:
        query["agent"] = agent

    # Find all documents matching the query
    documents = collection.find(query)

    # Dictionary to store the aggregated sums of prod values
    prod_sums = {}

    # Iterate through each document
    for doc in documents:
        if "Data_Lake" in doc:
            for prod, value in doc["Data_Lake"]:
                if prod in prod_sums:
                    prod_sums[prod] += value
                else:
                    prod_sums[prod] = value

    # Convert the aggregated dictionary to a list of [prod, sum] pairs for output
    result = [[prod, sum_value] for prod, sum_value in prod_sums.items()]
    return {"Createddate": created_date, "agent": agent, "aggregated_prods": result}

@app.put("/store/update/{created_date}")
async def update_store_data(created_date: str):
    # Step 1: Get the aggregated product sums from the kitkats collection
    documents = collection.find({"Createddate": str(created_date)})
    
    # Dictionary to store the aggregated sums of prod values
    prod_sums = {}

    # Iterate through each document in the kitkats collection
    for doc in documents:
        if "Data_Lake" in doc:
            for prod, value in doc["Data_Lake"]:
                if prod in prod_sums:
                    prod_sums[prod] += value
                else:
                    prod_sums[prod] = value
    from datetime import datetime, timedelta
    # Step 2: Find the matching document in the store collection based on Createddate
    next_date = (datetime.strptime(created_date, "%d-%m-%Y") + timedelta(days=1)).strftime("%d-%m-%Y")

    store_document = store_db["store"].find_one({"Createddate": str(created_date)})
    
    if store_document:
        # Step 3: Deduct the aggregated product sums from the store's data_lake
        updated_data_lake = []
        for prod, value in store_document["Data_Lake"]:
            if prod in prod_sums:
                # Deduct the value from the aggregated sum
                updated_value = value - prod_sums[prod]
                updated_data_lake.append([prod, updated_value])
            else:
                updated_data_lake.append([prod, value])

        # Step 4: Update the store document with the new data_lake values
        store_db["store"].update_one(
            {"Createddate": str(next_date)},
            {"$set": {"Data_Lake": updated_data_lake}}
        )

        return {"message": "Store data updated successfully", "updated_data_lake": updated_data_lake}
    else:
        raise HTTPException(status_code=404, detail="Store document not found for the given date")

#####################3

auth_db = client["authentication"]
user_collection = auth_db["users"]
# Ensure the collection exists
if "users" not in auth_db.list_collection_names():
    print("Collection 'users' does not exist. Creating collection...")
    auth_db.create_collection("users")
else:
    print("Collection 'users' already exists.")

# Pydantic model for User
class User(BaseModel):
    username: str
    password: str
    customer_name: str
    agentId: str

class UserAuth(BaseModel):
    username: str
    password: str

@app.post("/users/")
async def create_user(user: User):
    # Check if the username already exists
    if user_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")

    # Insert user into the database
    user_data = {
        "username": user.username,
        "password": user.password,  # Plain password (no hashing for simplicity)
        "customer_name": user.customer_name,
        "agentId": user.agentId,
    }
    result = user_collection.insert_one(user_data)

    # Return success response
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "customer_name": user.customer_name,
        "agentId": user.agentId
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow React app running on localhost:3000
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.post("/users/authenticate/")
async def authenticate_user(user: UserAuth):
    # Check if the username and password match a record in the database
    db_user = user_collection.find_one({"username": user.username, "password": user.password})
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid username or password")

    # Return the customer_name if authentication is successful
    return {
        "customer_name": db_user["customer_name"],
        "key": "abc1357",
        "agentId": db_user["agentId"]
    }

commodity_db = client["commodity"]
commodity_collection = commodity_db["commodity"]
price_config_colllection = commodity_db['price_config']

class Commodity(BaseModel):
    ref: int
    name: str
    image: str
    class Config:
        # This is optional but it helps convert ObjectId from MongoDB to string if needed
        from_attributes = True

@app.put("/import_commodity")
async def import_commodity(commodity: Commodity):
    try:
        # Prepare the commodity data as a dictionary
        commodity_data = {
            "ref": commodity.ref,
            "name": commodity.name,
            "image": commodity.image,
        }
        
        # Insert commodity data into MongoDB
        result = commodity_collection.insert_one(commodity_data)  # Use commodity_collection to insert
        
        return {"message": "Commodity imported successfully", "id": str(result.inserted_id)}
    except Exception as e:
        return {"error": str(e)}

@app.get("/commodities/", response_model=List[Commodity])
async def get_commodities():
    try:
        # Fetch all commodities from the database
        commodities = commodity_collection.find()
        
        # Convert MongoDB documents to a list of dictionaries
        commodity_list = []
        for commodity in commodities:
            commodity_list.append({
                "ref": commodity["ref"],
                "name": commodity["name"],
                "image": commodity["image"],
            })
        
        return commodity_list
    except Exception as e:
        return {"error": str(e)}
    
@app.get("/price_configlist/", response_model=Optional[dict])
async def get_commodities(agent_id: Optional[str] = Query(None, description="Filter by Agent ID")):
    try:
        # Fetch all data if no agent_id is provided
        if not agent_id:
            price_config_list = list(price_config_colllection.find({}, {"_id": 0}))
            return {"data": price_config_list}

        # Fetch specific agent's data
        result = price_config_colllection.find_one({}, {agent_id: 1, "_id": 0})
        
        if result and agent_id in result:
            return {agent_id: result[agent_id]}
        else:
            return {"error": "Agent not found"}

    except Exception as e:
        return {"error": str(e)}

@app.get("/kitkats/", response_model=List[dict])
async def get_kitkats_by_date(created_date: str):
    """
    Fetch all documents from the kitkats collection filtered by Createddate.
    :param created_date: The date to filter the records by (format: DD-MM-YYYY).
    :return: A list of kitkats matching the given date.
    """
    try:
        documents = collection.find({"Createddate": created_date})
        kitkat_list = []
        for doc in documents:
            kitkat_list.append({
                "ID": doc.get("ID"),
                "agent": doc.get("agent"),
                "Createddate": doc.get("Createddate"),
                "Createdtime": doc.get("Createdtime"),
                "Data_Lake": doc.get("Data_Lake"),
            })
        return kitkat_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")

@app.get("/store/", response_model=List[dict])
async def get_store_by_date_range(start_date: str = Query(..., description="Start date in DD-MM-YYYY format"),
                                  end_date: str = Query(..., description="End date in DD-MM-YYYY format")):
    """
    Fetch all documents from the store collection filtered by a date range.
    :param start_date: The starting date of the range (format: DD-MM-YYYY).
    :param end_date: The ending date of the range (format: DD-MM-YYYY).
    :return: A list of store records matching the date range.
    """
    try:
        start_date_obj = datetime.strptime(start_date, "%d-%m-%Y")
        end_date_obj = datetime.strptime(end_date, "%d-%m-%Y")
        documents = store_collection.find({
            "Createddate": {
                "$gte": start_date,
                "$lte": end_date
            }
        })
        store_list = []
        for doc in documents:
            store_list.append({
                "ID": str(doc.get("_id")),
                "Createddate": doc.get("Createddate"),
                "Data_Lake": doc.get("Data_Lake"),
            })
        return store_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An error occurred: {str(e)}")
    
def fetch_store_data(date: str):
    document = store_collection.find_one({"Createddate": date})
    if not document:
        raise HTTPException(status_code=404, detail="Store data not found")
    return {
        "ID": str(document.get("_id")),
        "Createddate": document.get("Createddate"),
        "Data_Lake": document.get("Data_Lake", [])
    }

def fetch_kitkat_data(date: str):
    documents = collection.find({"Createddate": date})
    kitkat_list = []
    for doc in documents:
        kitkat_list.append({
            "ID": doc.get("ID"),
            "agent": doc.get("agent"),
            "Createddate": doc.get("Createddate"),
            "Createdtime": doc.get("Createdtime"),
            "Data_Lake": doc.get("Data_Lake", [])
        })
    return kitkat_list

@app.get("/process_data/")
async def process_data(date: str = Query(..., description="Date in DD-MM-YYYY format")):
    store_data = fetch_store_data(date)
    kitkat_data = fetch_kitkat_data(date)

    store_data_lake = {item[0]: item[1] for item in store_data["Data_Lake"]}
    hourly_deductions = [{} for _ in range(24)]
    cumulative_deductions = {}

    for entry in kitkat_data:
        hour = int(entry["Createdtime"].split(".")[0])
        for product, quantity in entry["Data_Lake"]:
            cumulative_deductions[product] = cumulative_deductions.get(product, 0) + quantity
            hourly_deductions[hour][product] = cumulative_deductions[product]

    result = []
    for hour in range(24):
        adjusted_data = []
        for product, initial_value in store_data_lake.items():
            if hour == 0:
                total_deduction = hourly_deductions[hour].get(product, 0)
            else:
                total_deduction = sum(hourly_deductions[h].get(product, 0) for h in range(1, hour+1))
            adjusted_data.append([product, max(0, initial_value - total_deduction)])
        result.append(adjusted_data)

    return result
