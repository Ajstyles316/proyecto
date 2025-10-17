from django.contrib.auth.models import User
from pymongo import MongoClient
from django.conf import settings
import nbformat
from nbconvert.preprocessors import ExecutePreprocessor
import os

class Maquinaria:
    collection_name = "maquinaria"

class HistorialControl:
    collection_name = "control"

class ActaAsignacion:
    collection_name = "asignacion"

class Liberacion:
    collection_name = "liberacion"

class Mantenimiento:
    collection_name = "mantenimiento"

class Seguro:
    collection_name = "seguro"

class ITV:
    collection_name = "itv"

class SOAT:
    collection_name = "soat"

class Impuesto:
    collection_name = "impuesto"
        
class Usuario:
    collection_name = "usuarios"

class VerificacionRegistro:
    collection_name = "verificaciones_registro"

class Depreciacion:
    collection_name = "depreciaciones"

class Activo:
    collection_name = "activos"
    
class Pronostico:
    collection_name = "pronostico"
    def __init__(self):
        self.client = MongoClient(settings.MONGO_URI)
        self.db = self.client["gestion_maquinaria"]
        self.collection = self.db[self.collection_name]

    def insert(self, data):
        return self.collection.insert_one(data).inserted_id

    def find_all(self):
        return list(self.collection.find())  # sin ObjectId

    def find_one(self, query):
        return self.collection.find_one(query)

    def find_by_placa(self, placa):
        return self.collection.find_one({"placa": placa})

class Seguimiento:
    collection_name = "seguimiento"

class ControlOdometro:
    collection_name = "control_odometro"

class Novedad:
    collection_name = "novedades"