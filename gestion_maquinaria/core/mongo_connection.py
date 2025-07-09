from pymongo import MongoClient
from bson import ObjectId
from django.conf import settings

client = MongoClient(settings.MONGO_URI)
db = client["gestion_maquinaria"]  # Cambia si usas otro nombre

def get_collection(collection_name_or_class):
    
    if hasattr(collection_name_or_class, 'collection_name'):
        return db[collection_name_or_class.collection_name]
    return db[collection_name_or_class]

def get_collection_from_activos_db(collection_name):
    activos_db = client["activos"]
    return activos_db[collection_name]