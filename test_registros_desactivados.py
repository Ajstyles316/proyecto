#!/usr/bin/env python3
"""
Script de prueba para verificar los endpoints de registros desactivados
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@example.com"  # Cambiar por el email de un admin real

def test_registros_desactivados():
    """Prueba la obtención de registros desactivados"""
    print("=== Probando obtención de registros desactivados ===")
    
    url = f"{BASE_URL}/api/registros-desactivados/"
    headers = {
        'X-User-Email': ADMIN_EMAIL,
        'Content-Type': 'application/json'
    }
    
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("Registros desactivados encontrados:")
            for tipo, registros in data.items():
                print(f"  {tipo}: {len(registros)} registros")
                if registros:
                    # Mostrar el primer registro como ejemplo
                    primer_registro = registros[0]
                    print(f"    Ejemplo - ID: {primer_registro.get('_id', 'N/A')}")
                    print(f"    Maquinaria ID: {primer_registro.get('maquinaria_id', 'N/A')}")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"Error en la petición: {e}")

def test_reactivar_registro(tipo, record_id, maquinaria_id):
    """Prueba la reactivación de un registro"""
    print(f"\n=== Probando reactivación de {tipo} ===")
    
    # Mapeo de tipos a endpoints
    tipo_to_endpoint = {
        'Control': 'control',
        'Asignación': 'asignacion',
        'Liberación': 'liberacion',
        'Mantenimiento': 'mantenimiento',
        'Seguro': 'seguros',
        'ITV': 'itv',
        'SOAT': 'soat',
        'Impuesto': 'impuestos',
        'Depreciación': 'depreciaciones'
    }
    
    endpoint = tipo_to_endpoint.get(tipo)
    if not endpoint:
        print(f"Tipo no soportado: {tipo}")
        return
    
    url = f"{BASE_URL}/api/maquinaria/{maquinaria_id}/{endpoint}/{record_id}/"
    headers = {
        'X-User-Email': ADMIN_EMAIL,
        'Content-Type': 'application/json'
    }
    data = {'activo': True}
    
    print(f"URL: {url}")
    print(f"Data: {data}")
    
    try:
        response = requests.patch(url, headers=headers, json=data)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Registro reactivado exitosamente")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"Error en la petición: {e}")

def test_eliminar_permanentemente(tipo, record_id, maquinaria_id):
    """Prueba la eliminación permanente de un registro"""
    print(f"\n=== Probando eliminación permanente de {tipo} ===")
    
    # Mapeo de tipos a endpoints
    tipo_to_endpoint = {
        'Control': 'control',
        'Asignación': 'asignacion',
        'Liberación': 'liberacion',
        'Mantenimiento': 'mantenimiento',
        'Seguro': 'seguros',
        'ITV': 'itv',
        'SOAT': 'soat',
        'Impuesto': 'impuestos',
        'Depreciación': 'depreciaciones'
    }
    
    endpoint = tipo_to_endpoint.get(tipo)
    if not endpoint:
        print(f"Tipo no soportado: {tipo}")
        return
    
    url = f"{BASE_URL}/api/maquinaria/{maquinaria_id}/{endpoint}/{record_id}/?permanent=true"
    headers = {
        'X-User-Email': ADMIN_EMAIL,
        'Content-Type': 'application/json'
    }
    
    print(f"URL: {url}")
    
    try:
        response = requests.delete(url, headers=headers)
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print("✅ Registro eliminado permanentemente")
        else:
            print(f"❌ Error: {response.text}")
            
    except Exception as e:
        print(f"Error en la petición: {e}")

if __name__ == "__main__":
    # Primero obtener los registros desactivados
    test_registros_desactivados()
    
    # Ejemplo de cómo probar reactivación (descomentar y ajustar IDs)
    # test_reactivar_registro('Control', 'record_id_here', 'maquinaria_id_here')
    # test_reactivar_registro('Liberación', 'record_id_here', 'maquinaria_id_here')
    
    # Ejemplo de cómo probar eliminación permanente (descomentar y ajustar IDs)
    # test_eliminar_permanentemente('Control', 'record_id_here', 'maquinaria_id_here')
    # test_eliminar_permanentemente('Liberación', 'record_id_here', 'maquinaria_id_here')
