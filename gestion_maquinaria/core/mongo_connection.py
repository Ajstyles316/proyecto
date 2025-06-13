# gestion/mongo_connection.py

from pymongo import MongoClient
from bson import ObjectId
from django.conf import settings

client = MongoClient("mongodb://localhost:27017/")
db = client["activos"]  # Cambia si usas otro nombre

def get_collection(collection_class):
    return db[collection_class.collection_name]