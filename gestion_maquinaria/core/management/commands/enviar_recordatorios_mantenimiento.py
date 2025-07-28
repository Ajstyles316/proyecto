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

        # Buscar pronósticos con fechas futuras dentro de 7 días
        pronosticos = collection.find({
            'fechas_futuras': {'$exists': True, '$ne': []}
        })

        enviados = 0
        for p in pronosticos:
            placa = p.get('placa', 'Sin placa')
            fechas = p.get('fechas_futuras', [])
            for fecha in fechas:
                try:
                    fecha_dt = datetime.strptime(fecha, '%Y-%m-%d')
                except Exception:
                    continue
                if hoy <= fecha_dt <= en_una_semana:
                    send_mail(
                        subject=f'Recordatorio de mantenimiento para {placa}',
                        message=f'La maquinaria con placa {placa} tiene un mantenimiento programado para el {fecha}.',
                        from_email='noreply@tusistema.com',
                        recipient_list=emails,
                        fail_silently=False,
                    )
                    enviados += 1
                    self.stdout.write(self.style.SUCCESS(f'Recordatorio enviado para {placa} ({fecha})'))
        if enviados == 0:
            self.stdout.write(self.style.WARNING('No hay recordatorios para enviar hoy.')) 