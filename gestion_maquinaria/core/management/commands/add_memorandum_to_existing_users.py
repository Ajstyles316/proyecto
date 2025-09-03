from django.core.management.base import BaseCommand
from datetime import datetime
from core.mongo_connection import get_collection
from core.models import Usuario

class Command(BaseCommand):
    help = 'Agrega el campo Memorandum a usuarios existentes que no lo tengan'

    def handle(self, *args, **options):
        try:
            collection = get_collection(Usuario)
            
            # Buscar usuarios que no tienen el campo Memorandum
            usuarios_sin_memorandum = collection.find({"Memorandum": {"$exists": False}})
            
            count = 0
            for usuario in usuarios_sin_memorandum:
                # Si tiene fecha_creacion, usar esa fecha, sino usar fecha actual
                if 'fecha_creacion' in usuario:
                    fecha = usuario['fecha_creacion']
                    if isinstance(fecha, datetime):
                        memorandum = fecha.strftime('%d/%m/%Y')
                    else:
                        memorandum = datetime.now().strftime('%d/%m/%Y')
                else:
                    memorandum = datetime.now().strftime('%d/%m/%Y')
                
                # Actualizar el usuario
                collection.update_one(
                    {"_id": usuario["_id"]},
                    {"$set": {"Memorandum": memorandum}}
                )
                count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Usuario {usuario.get("Email", "N/A")} actualizado con memorandum: {memorandum}'
                    )
                )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Proceso completado. {count} usuarios actualizados con memorandum.'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Error al actualizar usuarios: {str(e)}')
            )
