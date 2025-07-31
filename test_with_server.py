#!/usr/bin/env python3
"""
Script para probar el acceso del admin con el servidor
"""

import requests
import time
import subprocess
import sys
import os

# Configuración
BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "admin123@gmail.com"
ADMIN_PASSWORD = "Aleatorio12$"

def wait_for_server():
    """Espera a que el servidor esté disponible"""
    print("⏳ Esperando a que el servidor esté disponible...")
    max_attempts = 30
    for i in range(max_attempts):
        try:
            response = requests.get(f"{BASE_URL}/test/", timeout=2)
            if response.status_code == 200:
                print("✅ Servidor disponible")
                return True
        except:
            pass
        time.sleep(1)
        if i % 5 == 0:
            print(f"   Intento {i+1}/{max_attempts}")
    
    print("❌ Servidor no disponible después de 30 segundos")
    return False

def test_admin_access():
    """Prueba el acceso del admin"""
    print("\n🧪 Probando acceso del admin...")
    
    # 1. Login
    print("\n1. Login...")
    try:
        login_response = requests.post(f"{BASE_URL}/login/", json={
            "Email": ADMIN_EMAIL,
            "Password": ADMIN_PASSWORD
        }, timeout=10)
        
        if login_response.status_code != 200:
            print(f"❌ Login falló: {login_response.status_code}")
            print(f"   Error: {login_response.text}")
            return False
        
        user_data = login_response.json()
        print(f"✅ Login exitoso")
        print(f"   Usuario: {user_data.get('Nombre')}")
        print(f"   Cargo: {user_data.get('Cargo')}")
        print(f"   Email: {user_data.get('Email')}")
        
    except Exception as e:
        print(f"❌ Error en login: {e}")
        return False
    
    # 2. Probar usuarios
    print("\n2. Probando acceso a usuarios...")
    headers = {"X-User-Email": ADMIN_EMAIL}
    
    try:
        usuarios_response = requests.get(f"{BASE_URL}/usuarios/", headers=headers, timeout=10)
        print(f"   Status: {usuarios_response.status_code}")
        
        if usuarios_response.status_code == 200:
            print("✅ Usuarios accesible")
            usuarios = usuarios_response.json()
            print(f"   Número de usuarios: {len(usuarios)}")
            return True
        else:
            print(f"❌ Usuarios no accesible")
            print(f"   Response: {usuarios_response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error al acceder a usuarios: {e}")
        return False

def main():
    """Función principal"""
    print("🚀 Iniciando prueba del servidor...")
    
    # Verificar si el servidor está corriendo
    if not wait_for_server():
        print("\n💡 Asegúrate de que el servidor esté corriendo:")
        print("   cd gestion_maquinaria")
        print("   python manage.py runserver")
        return
    
    # Probar acceso
    success = test_admin_access()
    
    if success:
        print("\n🎉 ¡Prueba exitosa! El admin puede acceder a usuarios")
    else:
        print("\n❌ Prueba fallida. Revisa los logs del servidor para más detalles")

if __name__ == "__main__":
    main() 