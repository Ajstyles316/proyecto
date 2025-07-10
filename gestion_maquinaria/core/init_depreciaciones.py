import os
import sys
from datetime import datetime
from bson import ObjectId

# Ajustar el path para importar desde el proyecto
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gestion_maquinaria.settings')

import django
django.setup()

from core.mongo_connection import get_collection
from core.models import Maquinaria
from core.views import DepreciacionesGeneralView


def crear_depreciacion_inicial(maquinaria_doc):
    tipo_maquinaria = maquinaria_doc.get('tipo', '')
    detalle_maquinaria = maquinaria_doc.get('detalle', '')
    bien_uso, vida_util = DepreciacionesGeneralView().determinar_bien_uso_y_vida_util(tipo_maquinaria, detalle_maquinaria)
    costo_activo = maquinaria_doc.get('costo_activo', 0)
    fecha_compra = maquinaria_doc.get('fecha_registro', datetime.now())
    metodo = maquinaria_doc.get('metodo_depreciacion', 'linea_recta')
    valor_residual = maquinaria_doc.get('valor_residual', 0)
    tabla = []
    fecha = fecha_compra if isinstance(fecha_compra, datetime) else datetime.now()
    if metodo == 'linea_recta':
        anual = (float(costo_activo) - float(valor_residual)) / float(vida_util) if float(vida_util) else 0
        depreciacionAcumulada = 0
        valorEnLibros = float(costo_activo)
        for i in range(int(vida_util)):
            depreciacionAcumulada += anual
            valorEnLibros -= anual
            tabla.append({
                'anio': fecha.year + i,
                'valor_anual_depreciado': round(anual, 2),
                'depreciacion_acumulada': round(depreciacionAcumulada, 2),
                'valor_en_libros': round(max(valorEnLibros, 0), 2),
            })
    # Puedes agregar otros métodos si los usas
    return {
        'maquinaria': maquinaria_doc['_id'],
        'costo_activo': float(costo_activo),
        'fecha_compra': fecha.strftime('%Y-%m-%d'),
        'metodo': metodo,
        'vida_util': int(vida_util),
        'bien_uso': bien_uso,
        'depreciacion_por_anio': tabla,
        'fecha_creacion': datetime.now(),
        'fecha_actualizacion': datetime.now(),
        'advertencia': 'Depreciación generada automáticamente por script.'
    }

def main():
    maquinaria_col = get_collection(Maquinaria)
    depreciaciones_col = get_collection('depreciaciones')
    maquinarias = list(maquinaria_col.find())
    nuevas = 0
    for maq in maquinarias:
        # Verificar si ya tiene depreciación
        existe = depreciaciones_col.find_one({'maquinaria': maq['_id']})
        if existe:
            continue
        dep = crear_depreciacion_inicial(maq)
        depreciaciones_col.insert_one(dep)
        print(f"Depreciación creada para maquinaria {maq.get('placa', maq['_id'])}")
        nuevas += 1
    print(f"Total de depreciaciones creadas: {nuevas}")

if __name__ == '__main__':
    main() 