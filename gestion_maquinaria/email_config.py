# Configuración de correo para el sistema
# IMPORTANTE: Para que funcione el envío de correos, necesitas configurar estas credenciales

# Opción 1: Usar tu cuenta de Gmail personal
# 1. Ve a https://myaccount.google.com/apppasswords
# 2. Genera una contraseña de aplicación para "Correo"
# 3. Usa esa contraseña aquí

# Opción 2: Crear una cuenta específica para el sistema
# 1. Crea una cuenta de Gmail nueva: sistema.maquinaria.cof@gmail.com
# 2. Habilita la verificación en 2 pasos
# 3. Genera una contraseña de aplicación

EMAIL_CONFIG = {
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'username': 'sistema.maquinaria.cof@gmail.com',  # Cambia por tu email
    'password': 'tu_password_de_aplicacion',  # Cambia por tu contraseña de aplicación
    'from_name': 'Sistema de Gestión de Maquinaria COF'
}

# Para usar esta configuración, importa este archivo en views.py:
# from .email_config import EMAIL_CONFIG
