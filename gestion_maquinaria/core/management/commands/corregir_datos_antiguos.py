from django.core.management.base import BaseCommand
from core.mongo_connection import get_database
from datetime import datetime

class Command(BaseCommand):
    help = 'Corrige datos antiguos en el registro de actividad'

    def add_arguments(self, parser):
        parser.add_argument(
            '--backup',
            action='store_true',
            help='Crear respaldo antes de corregir',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostrar qué se corregiría sin hacer cambios',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🚀 Iniciando corrección de datos antiguos...')
        )
        
        if options['backup']:
            self.crear_respaldo()
        
        if options['dry_run']:
            self.corregir_mensajes_antiguos(dry_run=True)
            self.corregir_modulos_antiguos(dry_run=True)
        else:
            self.corregir_mensajes_antiguos(dry_run=False)
            self.corregir_modulos_antiguos(dry_run=False)
        
        self.stdout.write(
            self.style.SUCCESS('🎉 ¡Proceso de corrección completado!')
        )

    def crear_respaldo(self):
        """Crea un respaldo de los datos"""
        db = get_database()
        seguimiento_collection = db['seguimiento']
        
        backup_collection = db['seguimiento_backup_' + datetime.now().strftime('%Y%m%d_%H%M%S')]
        
        self.stdout.write('💾 Creando respaldo de datos...')
        
        registros = list(seguimiento_collection.find({}))
        if registros:
            backup_collection.insert_many(registros)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Respaldo creado: {backup_collection.name}')
            )

    def corregir_mensajes_antiguos(self, dry_run=False):
        """Corrige los mensajes antiguos"""
        db = get_database()
        seguimiento_collection = db['seguimiento']
        
        self.stdout.write('🔍 Buscando registros con errores ortográficos...')
        
        registros_corregidos = 0
        
        registros = seguimiento_collection.find({})
        
        for registro in registros:
            mensaje_original = registro.get('mensaje', '')
            mensaje_corregido = mensaje_original
            
            if isinstance(mensaje_corregido, str):
                # Aplicar todas las correcciones
                mensaje_corregido = self.aplicar_correcciones_mensaje(mensaje_corregido)
            
            if mensaje_corregido != mensaje_original:
                if dry_run:
                    self.stdout.write(
                        f'📝 Se corregiría: {mensaje_original[:50]}... → {mensaje_corregido[:50]}...'
                    )
                else:
                    try:
                        seguimiento_collection.update_one(
                            {'_id': registro['_id']},
                            {'$set': {'mensaje': mensaje_corregido}}
                        )
                        self.stdout.write(
                            f'✅ Corregido: {mensaje_original[:50]}... → {mensaje_corregido[:50]}...'
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ Error al corregir registro: {e}')
                        )
                registros_corregidos += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'📊 Total de registros corregidos: {registros_corregidos}')
        )

    def corregir_modulos_antiguos(self, dry_run=False):
        """Corrige los nombres de módulos antiguos"""
        db = get_database()
        seguimiento_collection = db['seguimiento']
        
        self.stdout.write('🔍 Corrigiendo nombres de módulos...')
        
        mapeo_modulos = {
            'ActaAsignacion': 'Asignación',
            'HistorialControl': 'Control',
            'Depreciacion': 'Depreciación',
            'Autenticacion': 'Autenticación',
            'Pronostico': 'Pronóstico'
        }
        
        registros_corregidos = 0
        
        for modulo_antiguo, modulo_nuevo in mapeo_modulos.items():
            registros = seguimiento_collection.find({'modulo': modulo_antiguo})
            
            for registro in registros:
                if dry_run:
                    self.stdout.write(
                        f'📝 Se corregiría módulo: {modulo_antiguo} → {modulo_nuevo}'
                    )
                else:
                    try:
                        seguimiento_collection.update_one(
                            {'_id': registro['_id']},
                            {'$set': {'modulo': modulo_nuevo}}
                        )
                        self.stdout.write(
                            f'✅ Módulo corregido: {modulo_antiguo} → {modulo_nuevo}'
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'❌ Error al corregir módulo: {e}')
                        )
                registros_corregidos += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'📊 Total de módulos corregidos: {registros_corregidos}')
        )

    def aplicar_correcciones_mensaje(self, mensaje):
        """Aplica todas las correcciones a un mensaje"""
        # Correcciones de preposiciones y artículos
        correcciones = [
            (' De ', ' de '),
            (' Para ', ' para '),
            (' Con ', ' con '),
            (' Sin ', ' sin '),
            (' Por ', ' por '),
            (' En ', ' en '),
            (' Sobre ', ' sobre '),
            (' Entre ', ' entre '),
            (' Hasta ', ' hasta '),
            (' Desde ', ' desde '),
            (' Hacia ', ' hacia '),
            (' Según ', ' según '),
            (' Mediante ', ' mediante '),
            (' Durante ', ' durante '),
            (' Contra ', ' contra '),
            (' Tras ', ' tras '),
            (' Ante ', ' ante '),
            (' Bajo ', ' bajo '),
            (' Cabe ', ' cabe '),
        ]
        
        for antigua, nueva in correcciones:
            mensaje = mensaje.replace(antigua, nueva)
        
        # Correcciones específicas de combinaciones
        correcciones_especificas = [
            ('De Sin Detalle Para Maquinaria', 'de sin detalle para maquinaria'),
            ('Para Maquinaria', 'para maquinaria'),
            ('Con Placa', 'con placa'),
            ('De Sin Detalle', 'de sin detalle'),
        ]
        
        for antigua, nueva in correcciones_especificas:
            mensaje = mensaje.replace(antigua, nueva)
        
        # Correcciones de acciones
        correcciones_acciones = [
            ('Creó Maquinaria con placa', 'Creó maquinaria con placa'),
            ('Editó Maquinaria con placa', 'Editó maquinaria con placa'),
            ('Creó Control para maquinaria', 'Creó control para maquinaria'),
            ('Editó Control para maquinaria', 'Editó control para maquinaria'),
            ('Creó Asignación para maquinaria', 'Creó asignación para maquinaria'),
            ('Editó Asignación para maquinaria', 'Editó asignación para maquinaria'),
            ('Creó Mantenimiento para maquinaria', 'Creó mantenimiento para maquinaria'),
            ('Editó Mantenimiento para maquinaria', 'Editó mantenimiento para maquinaria'),
            ('Creó Seguro para maquinaria', 'Creó seguro para maquinaria'),
            ('Editó Seguro para maquinaria', 'Editó seguro para maquinaria'),
            ('Creó Impuesto para maquinaria', 'Creó impuesto para maquinaria'),
            ('Editó Impuesto para maquinaria', 'Editó impuesto para maquinaria'),
            ('Creó ITV para maquinaria', 'Creó ITV para maquinaria'),
            ('Editó ITV para maquinaria', 'Editó ITV para maquinaria'),
            ('Creó Depreciación para maquinaria', 'Creó depreciación para maquinaria'),
            ('Editó Depreciación para maquinaria', 'Editó depreciación para maquinaria'),
        ]
        
        for antigua, nueva in correcciones_acciones:
            mensaje = mensaje.replace(antigua, nueva)
        
        # Correcciones de "sin detalle"
        mensaje = mensaje.replace('Sin detalle', 'sin detalle')
        
        return mensaje 