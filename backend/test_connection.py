import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

uri = os.getenv("MONGODB_URI")

try:
    client = MongoClient(uri)
    client.admin.command("ping")
    print("✅ MongoDB connected successfully!")

except Exception as error:
    print("❌ Connection failed:", error)