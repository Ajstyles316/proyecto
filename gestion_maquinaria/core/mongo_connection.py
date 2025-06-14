# gestion/mongo_connection.py

from pymongo import MongoClient
from bson import ObjectId
from django.conf import settings

client = MongoClient("mongodb://localhost:27017/")
db = client["activos_fijos"]  # Cambia si usas otro nombre

def get_collection(collection_name_or_class):
    """
    Obtiene una colección de MongoDB.
    Puede recibir:
    - Una clase que tenga el atributo collection_name
    - Un string con el nombre de la colección
    """
    if hasattr(collection_name_or_class, 'collection_name'):
        return db[collection_name_or_class.collection_name]
    return db[collection_name_or_class]