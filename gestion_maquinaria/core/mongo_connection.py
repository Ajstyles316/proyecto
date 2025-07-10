from pymongo import MongoClient
from bson import ObjectId
from django.conf import settings

def get_client():
    return MongoClient(settings.MONGO_URI)

def get_db():
    client = get_client()
    return client[settings.MONGO_DB_NAME]

def get_collection(collection_name_or_class):
    db = get_db()
    if hasattr(collection_name_or_class, 'collection_name'):
        return db[collection_name_or_class.collection_name]
    return db[collection_name_or_class]

def get_collection_from_activos_db(collection_name):
    client = get_client()
    activos_db = client["activos"]
    return activos_db[collection_name]