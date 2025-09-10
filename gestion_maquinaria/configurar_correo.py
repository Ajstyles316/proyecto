#!/usr/bin/env python3
"""
Script para configurar las credenciales de correo para el sistema
"""

import os
import sys

def configurar_correo():
    print("🔧 Configuración de Correo para Sistema de Gestión de Maquinaria")
    print("=" * 60)
    
    print("\n📋 INSTRUCCIONES:")
    print("1. Ve a https://myaccount.google.com/apppasswords")
    print("2. Selecciona 'Correo' y genera una contraseña de aplicación")
    print("3. Copia la contraseña generada (16 caracteres)")
    print("4. Asegúrate de tener la verificación en 2 pasos activada")
    
    print("\n" + "=" * 60)
    
    email = input("📧 Ingresa tu email de Gmail: ").strip()
    password = input("🔑 Ingresa la contraseña de aplicación (16 caracteres): ").strip()
    
    if not email or not password:
        print("❌ Email y contraseña son requeridos")
        return False
    
    if '@gmail.com' not in email:
        print("⚠️  Se recomienda usar una cuenta de Gmail")
    
    print(f"\n📝 Configurando variables de entorno...")
    
    # Configurar para la sesión actual
    os.environ['SMTP_USERNAME'] = email
    os.environ['SMTP_PASSWORD'] = password
    
    print("✅ Variables configuradas para esta sesión")
    
    # Crear archivo .env para persistencia
    env_content = f"""# Configuración de correo para Sistema de Gestión de Maquinaria
SMTP_USERNAME={email}
SMTP_PASSWORD={password}
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
"""
    
    try:
        with open('.env', 'w') as f:
            f.write(env_content)
        print("✅ Archivo .env creado")
    except Exception as e:
        print(f"⚠️  No se pudo crear .env: {e}")
    
    print(f"\n🎯 Para usar estas credenciales permanentemente:")
    print(f"   Windows PowerShell:")
    print(f"   $env:SMTP_USERNAME='{email}'")
    print(f"   $env:SMTP_PASSWORD='{password}'")
    print(f"\n   Linux/Mac:")
    print(f"   export SMTP_USERNAME='{email}'")
    print(f"   export SMTP_PASSWORD='{password}'")
    
    print(f"\n🧪 Para probar la configuración:")
    print(f"   python -c \"import os; print('SMTP_USERNAME:', os.getenv('SMTP_USERNAME'))\"")
    
    return True

if __name__ == "__main__":
    configurar_correo()
