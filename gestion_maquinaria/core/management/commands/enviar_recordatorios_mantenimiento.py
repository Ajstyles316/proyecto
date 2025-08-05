from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from gestion_maquinaria.core.mongo_connection import get_collection
from datetime import datetime, timedelta

class Command(BaseCommand):
    help = 'Envía recordatorios de mantenimiento a todos los usuarios una semana antes'

    def handle(self, *args, **kwargs):
        hoy = datetime.now()
        en_una_semana = hoy + timedelta(days=7)
        collection = get_collection('pronostico')
        usuarios = get_collection('usuarios').find({})
        emails = [u.get('Email') for u in usuarios if u.get('Email')]

        # Buscar pronósticos con fechas de mantenimiento dentro de 7 días
        pronosticos = collection.find({
            'fecha_mantenimiento': {'$exists': True, '$ne': None}
        })

        enviados = 0
        for p in pronosticos:
            placa = p.get('placa', 'Sin placa')
            fecha_mantenimiento = p.get('fecha_mantenimiento')
            fecha_recordatorio = p.get('fecha_recordatorio')
            
            # Verificar fecha de mantenimiento
            if fecha_mantenimiento:
                try:
                    fecha_dt = datetime.strptime(fecha_mantenimiento, '%Y-%m-%d')
                    if hoy <= fecha_dt <= en_una_semana:
                        send_mail(
                            subject=f'Recordatorio de mantenimiento para {placa}',
                            message=f'La maquinaria con placa {placa} tiene un mantenimiento programado para el {fecha_mantenimiento}.',
                            from_email='noreply@tusistema.com',
                            recipient_list=emails,
                            fail_silently=False,
                        )
                        enviados += 1
                        self.stdout.write(self.style.SUCCESS(f'Recordatorio enviado para {placa} ({fecha_mantenimiento})'))
                except Exception:
                    continue
            
            # Verificar fecha de recordatorio
            if fecha_recordatorio:
                try:
                    fecha_dt = datetime.strptime(fecha_recordatorio, '%Y-%m-%d')
                    if hoy <= fecha_dt <= en_una_semana:
                        send_mail(
                            subject=f'Recordatorio de mantenimiento para {placa}',
                            message=f'La maquinaria con placa {placa} tiene un recordatorio de mantenimiento para el {fecha_recordatorio}.',
                            from_email='noreply@tusistema.com',
                            recipient_list=emails,
                            fail_silently=False,
                        )
                        enviados += 1
                        self.stdout.write(self.style.SUCCESS(f'Recordatorio enviado para {placa} ({fecha_recordatorio})'))
                except Exception:
                    continue
        if enviados == 0:
            self.stdout.write(self.style.WARNING('No hay recordatorios para enviar hoy.')) 