from djongo import models
from django.contrib.auth.models import User

class HistorialControl(models.Model):
    ubicacion = models.CharField(max_length=100)
    gerente = models.CharField(max_length=100, blank=True, null=True)
    encargado = models.CharField(max_length=100, blank=True, null=True)
    hoja_tramite = models.CharField(max_length=200)
    fecha_ingreso = models.DateField()
    observacion = models.TextField(blank=True, null=True)

    class Meta:
        abstract = True

class ActaAsignacion(models.Model):
    fecha_asignacion = models.DateField()
    fecha_liberacion = models.DateField(null=True, blank=True)
    recorrido_km = models.DecimalField(max_digits=10, decimal_places=2)
    recorrido_entregado = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        abstract = True

class Mantenimiento(models.Model):
    TIPO_CHOICES = [
        ('preventivo', 'Preventivo'),
        ('correctivo', 'Correctivo')
    ]
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    gestion = models.CharField(max_length=100)
    lugar = models.CharField(max_length=200)

    class Meta:
        abstract = True

class Seguro(models.Model):
    placa = models.CharField(max_length=50)
    numero_poliza = models.CharField(max_length=50)
    importe = models.DecimalField(max_digits=12, decimal_places=2)
    detalle = models.CharField(max_length=200)

    class Meta:
        abstract = True

class ITV(models.Model):
    placa = models.CharField(max_length=50)
    detalle = models.CharField(max_length=200)
    importe = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        abstract = True

class SOAT(models.Model):
    placa = models.CharField(max_length=50)
    importe_2024 = models.DecimalField(max_digits=12, decimal_places=2)
    importe_2025 = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        abstract = True

class Impuesto(models.Model):
    placa = models.CharField(max_length=50)
    importe_2023 = models.DecimalField(max_digits=12, decimal_places=2)
    importe_2024 = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        abstract = True

class Maquinaria(models.Model):
    gestion = models.CharField(max_length=100)
    placa = models.CharField(max_length=50, unique=True)
    detalle = models.CharField(max_length=200)
    unidad = models.CharField(max_length=100)
    adqui = models.CharField(max_length=100)
    codigo = models.CharField(max_length=50)
    tipo = models.CharField(max_length=100)
    marca = models.CharField(max_length=100)
    modelo = models.CharField(max_length=100)
    color = models.CharField(max_length=50)
    nro_motor = models.CharField(max_length=50)
    nro_chasis = models.CharField(max_length=50)
    fecha_registro = models.DateField()
    
    # Historial de control (array de documentos)
    historial = models.ArrayModelField(
        model_container=HistorialControl,
        blank=True,
        default=list
    )
    
    # Documentos embebidos únicos
    acta_asignacion = models.EmbeddedModelField(
        model_container=ActaAsignacion,
        null=True,
        blank=True
    )
    
    mantenimiento = models.EmbeddedModelField(
        model_container=Mantenimiento,
        null=True,
        blank=True
    )
    
    seguros = models.EmbeddedModelField(
        model_container=Seguro,
        null=True,
        blank=True
    )
    
    itv = models.EmbeddedModelField(
        model_container=ITV,
        null=True,
        blank=True
    )
    
    soat = models.EmbeddedModelField(
        model_container=SOAT,
        null=True,
        blank=True
    )
    
    impuestos = models.EmbeddedModelField(
        model_container=Impuesto,
        null=True,
        blank=True
    )
    
    usuario_registro = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='maquinarias'
    )

    def __str__(self):
        return self.placa

    class Meta:
        db_table = 'maquinaria'
        
        
class Usuario:
    collection_name = "usuarios"