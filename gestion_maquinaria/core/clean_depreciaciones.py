from pymongo import MongoClient
from bson import ObjectId

# Conexión a la base de datos
client = MongoClient("mongodb://localhost:27017/")
db = client["activos_fijos"]
col = db["depreciaciones"]

# 1. Agrupa por maquinaria y encuentra los duplicados
pipeline = [
    {"$group": {
        "_id": "$maquinaria",
        "ids": {"$push": "$_id"},
        "fechas": {"$push": "$fecha_creacion"},
        "count": {"$sum": 1}
    }},
    {"$match": {"count": {"$gt": 1}}}
]

duplicados = list(col.aggregate(pipeline))

# 2. Para cada maquinaria con duplicados, conserva solo el más reciente
for grupo in duplicados:
    ids = grupo["ids"]
    fechas = grupo["fechas"]
    # Encuentra el índice del más reciente
    idx_mas_reciente = fechas.index(max(fechas))
    id_a_conservar = ids[idx_mas_reciente]
    ids_a_borrar = [i for j, i in enumerate(ids) if j != idx_mas_reciente]
    if ids_a_borrar:
        print(f"Borrando {len(ids_a_borrar)} duplicados para maquinaria {grupo['_id']}")
        col.delete_many({"_id": {"$in": ids_a_borrar}})

print("¡Limpieza completada!") 