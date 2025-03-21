import os
import ssl
import certifi
import random
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Query, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pymongo import MongoClient
from passlib.context import CryptContext
from dotenv import load_dotenv

app = FastAPI()

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = "mongodb://newpoopuk5:IEmkYZwoUMPHUqBp@pos1-shard-00-00.2qznf.mongodb.net:27017,pos1-shard-00-01.2qznf.mongodb.net:27017,pos1-shard-00-02.2qznf.mongodb.net:27017/POS1?replicaSet=atlas-oiwgrh-shard-0&ssl=true&authSource=admin"

client = MongoClient(MONGO_URI, tls=True, tlsCAFile=certifi.where())

# Test connection
try:
    client.admin.command('ping')
    print("✅ Connected to MongoDB Atlas!")
except Exception as e:
    print(f"❌ MongoDB connection error: {e}")

# Setup databases and collections
db = client["kitkats"]
if "kitkats" not in db.list_collection_names():
    print("Collection 'kitkats' does not exist. Creating collection...")
    db.create_collection("kitkats")
else:
    print("Collection 'kitkats' already exists.")
collection = db["kitkats"]

store_db = client["store"]
if "store" not in store_db.list_collection_names():
    print("Collection 'store' does not exist. Creating collection...")
    store_db.create_collection("store")
else:
    print("Collection 'store' already exists.")
store_collection = store_db["store"]

auth_db = client["authentication"]
if "users" not in auth_db.list_collection_names():
    print("Collection 'users' does not exist. Creating collection...")
    auth_db.create_collection("users")
else:
    print("Collection 'users' already exists.")
user_collection = auth_db["users"]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Pydantic models
class User(BaseModel):
    username: str
    password: str
    customer_name: str
    agentId: str
    role: str = "user"  # Add role field, default to "user"

class UserAuth(BaseModel):
    username: str
    password: str

class KitKat(BaseModel):
    agent: str
    data_lake: List[List]

class Store(BaseModel):
    data_lake: List[List]

class Commodity(BaseModel):
    ref: int
    name: str
    image: str

    class Config:
        from_attributes = True

# Add admin user on startup
@app.on_event("startup")
async def add_admin_user():
    admin_user = {
        "username": "admin",
        "password": hash_password("admin"),  # Hash the admin password
        "customer_name": "Admin",
        "agentId": "admin123",
        "role": "admin"  # Set role to admin
    }
    if not user_collection.find_one({"username": "admin"}):
        user_collection.insert_one(admin_user)
        print("Admin user added successfully.")
    else:
        print("Admin user already exists.")

# Middleware to check admin role
async def require_admin(request: Request):
    user_role = request.headers.get("user-role")
    if not user_role or user_role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return True

# FastAPI Endpoints
@app.get("/")
async def root():
    return {"message": "Hello, welcome to the voting app!"}

def generate_id(agent: str) -> str:
    created_date = datetime.now().strftime("%d-%m-%Y")
    created_time = datetime.now().strftime("%H.%M.%S")
    random_digits = random.randint(1000, 9999)
    return f"{agent}_{created_date}_{created_time}_{random_digits}"

@app.post("/kitkats/")
async def create_kitkat(kitkat: KitKat):
    kitkat_id = generate_id(kitkat.agent)
    kitkat_data = {
        "ID": kitkat_id,
        "agent": kitkat.agent,
        "Createddate": datetime.now().strftime("%d-%m-%Y"),
        "Createdtime": datetime.now().strftime("%H.%M.%S"),
        "Data_Lake": kitkat.data_lake,
    }
    result = collection.insert_one(kitkat_data)
    return {
        "id": kitkat_id,
        "agent": kitkat.agent,
        "Createddate": kitkat_data["Createddate"],
        "Createdtime": kitkat_data["Createdtime"],
        "Data_Lake": kitkat_data["Data_Lake"],
    }

@app.post("/store/")
async def create_store(store: Store):
    store_data = {
        "Createddate": "23-11-2024",
        "Data_Lake": store.data_lake,
    }
    result = store_db["store"].insert_one(store_data)
    return {
        "Createddate": store_data["Createddate"],
        "Data_Lake": store_data["Data_Lake"],
    }

@app.get("/kitkats/{kitkat_id}")
async def read_kitkat(kitkat_id: str):
    kitkat = collection.find_one({"ID": kitkat_id})
    if kitkat:
        return {
            "id": kitkat["ID"],
            "agent": kitkat["agent"],
            "Createddate": kitkat["Createddate"],
            "Createdtime": kitkat["Createdtime"],
            "Data_Lake": kitkat["Data_Lake"],
        }
    else:
        raise HTTPException(status_code=404, detail="Kitkat not found")

@app.put("/kitkats/{kitkat_id}")
async def update_kitkat(kitkat_id: str, kitkat: KitKat):
    result = collection.update_one(
        {"ID": kitkat_id},
        {"$set": {"agent": kitkat.agent, "Data_Lake": kitkat.data_lake}},
    )
    if result.modified_count == 1:
        return {"id": kitkat_id, "agent": kitkat.agent, "Data_Lake": kitkat.data_lake}
    else:
        raise HTTPException(status_code=404, detail="Kitkat not found")

@app.get("/kitkats/sum/{created_date}")
async def sum_prods(created_date: str, agent: Optional[str] = None):
    query = {"Createddate": created_date}
    if agent:
        query["agent"] = agent
    documents = collection.find(query)
    prod_sums = {}
    for doc in documents:
        if "Data_Lake" in doc:
            for prod, value in doc["Data_Lake"]:
                prod_sums[prod] = prod_sums.get(prod, 0) + value
    result = [[prod, sum_value] for prod, sum_value in prod_sums.items()]
    return {"Createddate": created_date, "agent": agent, "aggregated_prods": result}

@app.put("/store/update/{created_date}")
async def update_store_data(created_date: str):
    documents = collection.find({"Createddate": str(created_date)})
    prod_sums = {}
    for doc in documents:
        if "Data_Lake" in doc:
            for prod, value in doc["Data_Lake"]:
                prod_sums[prod] = prod_sums.get(prod, 0) + value
    next_date = (datetime.strptime(created_date, "%d-%m-%Y") + timedelta(days=1)).strftime("%d-%m-%Y")
    store_document = store_db["store"].find_one({"Createddate": str(created_date)})
    if store_document:
        updated_data_lake = []
        for prod, value in store_document["Data_Lake"]:
            updated_value = value - prod_sums.get(prod, 0)
            updated_data_lake.append([prod, updated_value])
        store_db["store"].update_one(
            {"Createddate": str(next_date)},
            {"$set": {"Data_Lake": updated_data_lake}},
        )
        return {"message": "Store data updated successfully", "updated_data_lake": updated_data_lake}
    else:
        raise HTTPException(status_code=404, detail="Store document not found for the given date")

# User Authentication Endpoints
@app.post("/users/")
async def create_user(user: User):
    if user_collection.find_one({"username": user.username}):
        raise HTTPException(status_code=400, detail="Username already exists")
    hashed_password = hash_password(user.password)
    user_data = {
        "username": user.username,
        "password": hashed_password,
        "customer_name": user.customer_name,
        "agentId": user.agentId,
        "role": user.role,
    }
    result = user_collection.insert_one(user_data)
    return {
        "id": str(result.inserted_id),
        "username": user.username,
        "customer_name": user.customer_name,
        "agentId": user.agentId,
        "role": user.role,
    }

@app.post("/users/authenticate/")
async def authenticate_user(user: UserAuth):
    print(f"Querying MongoDB for user: {user.username}")
    db_user = user_collection.find_one({"username": user.username})
    if not db_user or not verify_password(user.password, db_user["password"]):
        print("User not found or password incorrect in MongoDB.")
        raise HTTPException(status_code=400, detail="Invalid username or password")
    print("User found:", db_user)
    return {
        "customer_name": db_user["customer_name"],
        "key": "abc1357",
        "agentId": db_user["agentId"],
        "role": db_user["role"],
    }

# Example admin-only endpoint
@app.get("/admin", dependencies=[Depends(require_admin)])
async def admin_dashboard():
    return {"message": "Welcome to the admin dashboard"}

# Commodity Endpoints
commodity_db = client["commodity"]
commodity_collection = commodity_db["commodity"]
price_config_collection = commodity_db["price_config"]

@app.put("/import_commodity")
async def import_commodity(commodity: Commodity):
    try:
        commodity_data = {
            "ref": commodity.ref,
            "name": commodity.name,
            "image": commodity.image,
        }
        result = commodity_collection.insert_one(commodity_data)
        return {"message": "Commodity imported successfully", "id": str(result.inserted_id)}
    except Exception as e:
        return {"error": str(e)}

@app.get("/commodities/", response_model=List[Commodity])
async def get_commodities():
    try:
        commodities = commodity_collection.find()
        commodity_list = [
            {"ref": commodity["ref"], "name": commodity["name"], "image": commodity["image"]}
            for commodity in commodities
        ]
        return commodity_list
    except Exception as e:
        return {"error": str(e)}

@app.get("/price_configlist/", response_model=Optional[dict])
async def get_price_config(agent_id: Optional[str] = Query(None, description="Filter by Agent ID")):
    try:
        if not agent_id:
            price_config_list = list(price_config_collection.find({}, {"_id": 0}))
            return {"data": price_config_list}
        result = price_config_collection.find_one({}, {agent_id: 1, "_id": 0})
        if result and agent_id in result:
            return {agent_id: result[agent_id]}
        else:
            return {"error": "Agent not found"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/kitkats/", response_model=List[dict])
async def get_kitkats_by_date(created_date: str):
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
async def get_store_by_date_range(
    start_date: str = Query(..., description="Start date in DD-MM-YYYY format"),
    end_date: str = Query(..., description="End date in DD-MM-YYYY format")
):
    try:
        documents = store_collection.find({
            "Createddate": {"$gte": start_date, "$lte": end_date}
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
            "Data_Lake": doc.get("Data_Lake", []),
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
                total_deduction = sum(hourly_deductions[h].get(product, 0) for h in range(1, hour + 1))
            adjusted_data.append([product, max(0, initial_value - total_deduction)])
        result.append(adjusted_data)
    return result

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)