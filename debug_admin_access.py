#!/usr/bin/env python3
"""
Script de diagnóstico para identificar el problema de acceso del admin
"""

import requests
import json

# Configuración
BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "admin123@gmail.com"
ADMIN_PASSWORD = "Aleatorio12$"

def debug_admin_access():
    """Diagnóstico detallado del acceso del admin"""
    print("🔍 Diagnóstico del acceso del admin...")
    
    # 1. Login como admin
    print("\n1. Login como admin...")
    login_response = requests.post(f"{BASE_URL}/login/", json={
        "Email": ADMIN_EMAIL,
        "Password": ADMIN_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Error en login: {login_response.status_code}")
        print(f"   Error: {login_response.text}")
        return
    
    user_data = login_response.json()
    print(f"✅ Login exitoso")
    print(f"   Usuario: {user_data.get('Nombre')}")
    print(f"   Cargo: {user_data.get('Cargo')}")
    print(f"   Email: {user_data.get('Email')}")
    print(f"   Permisos: {user_data.get('permisos', 'No definidos')}")
    
    headers = {"X-User-Email": ADMIN_EMAIL}
    
    # 2. Probar acceso a lista de usuarios con detalles
    print("\n2. Probando acceso a lista de usuarios...")
    usuarios_response = requests.get(f"{BASE_URL}/usuarios/", headers=headers)
    print(f"   Status Code: {usuarios_response.status_code}")
    print(f"   Response Headers: {dict(usuarios_response.headers)}")
    
    if usuarios_response.status_code == 200:
        print("✅ Acceso a lista de usuarios exitoso")
        usuarios = usuarios_response.json()
        print(f"   Número de usuarios: {len(usuarios)}")
    else:
        print(f"❌ Error al acceder a usuarios")
        print(f"   Response: {usuarios_response.text}")
        
        # Intentar obtener más detalles del error
        try:
            error_data = usuarios_response.json()
            print(f"   Error JSON: {error_data}")
        except:
            print(f"   Error no es JSON: {usuarios_response.text}")
    
    # 3. Probar otros endpoints para verificar si el problema es específico
    print("\n3. Probando otros endpoints...")
    
    # Dashboard
    dashboard_response = requests.get(f"{BASE_URL}/dashboard/", headers=headers)
    print(f"   Dashboard: {dashboard_response.status_code}")
    
    # Maquinaria
    maquinaria_response = requests.get(f"{BASE_URL}/maquinaria/", headers=headers)
    print(f"   Maquinaria: {maquinaria_response.status_code}")
    
    # Depreciaciones
    depreciaciones_response = requests.get(f"{BASE_URL}/api/depreciaciones/", headers=headers)
    print(f"   Depreciaciones: {depreciaciones_response.status_code}")
    
    # 4. Verificar si el problema está en el frontend o backend
    print("\n4. Verificando si el problema es frontend o backend...")
    
    # Probar directamente el endpoint de usuarios
    print("   Probando endpoint directamente...")
    direct_response = requests.get(f"{BASE_URL}/usuarios/", headers=headers)
    print(f"   Direct API call: {direct_response.status_code}")
    if direct_response.status_code != 200:
        print(f"   Direct API error: {direct_response.text}")
    
    # 5. Verificar configuración del servidor
    print("\n5. Verificando configuración del servidor...")
    test_response = requests.get(f"{BASE_URL}/test/")
    print(f"   Test endpoint: {test_response.status_code}")
    
    print("\n🎯 Diagnóstico completado!")
    print("\n📋 Resumen:")
    print(f"✅ Login: {login_response.status_code}")
    print(f"❌ Usuarios: {usuarios_response.status_code}")
    print(f"✅ Dashboard: {dashboard_response.status_code}")
    print(f"✅ Maquinaria: {maquinaria_response.status_code}")
    print(f"✅ Depreciaciones: {depreciaciones_response.status_code}")

if __name__ == "__main__":
    debug_admin_access() 