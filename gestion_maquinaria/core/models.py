from django.db import models

class Maquinaria(models.Model):
    detalle = models.CharField(max_length=255)
    placa = models.CharField(max_length=50, unique=True)
    unidad = models.CharField(max_length=100)
    tipo = models.CharField(max_length=100, blank=True, null=True)
    marca = models.CharField(max_length=100, blank=True, null=True)
    modelo = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.detalle


class Control(models.Model):
    estado = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=100)
    gerente = models.CharField(max_length=100)
    encargado = models.CharField(max_length=100)
    fecha = models.DateField()
    observaciones = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.estado} - {self.ubicacion}"


class Mantenimiento(models.Model):
    TIPO_CHOICES = [
        ('preventivo', 'Preventivo'),
        ('correctivo', 'Correctivo'),
    ]

    maquinaria = models.ForeignKey(Maquinaria, on_delete=models.CASCADE, related_name="mantenimientos")
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    recorrido = models.FloatField()
    ultimaRevision = models.DateField()
    horasOperacion= models.IntegerField()
    unidad = models.CharField(max_length=100)  # Podría ser ForeignKey si se define otra tabla Unidad

    def __str__(self):
        return f"{self.tipo} - {self.maquinaria.detalle}"


class Asignacion(models.Model):
    maquinaria = models.ForeignKey(Maquinaria, on_delete=models.CASCADE, related_name="asignaciones")
    fechaAsignacion = models.DateField()
    gestion=models.CharField(max_length=100)
    encargado = models.ForeignKey(Control, on_delete=models.CASCADE, related_name="asignaciones")

    def __str__(self):
        return f"{self.fechaAsignacion} - {self.maquinaria.detalle}"


class Impuesto(models.Model):
    maquinaria = models.ForeignKey(Maquinaria, on_delete=models.CASCADE, related_name="impuestos")
    aporte = models.FloatField()

    def __str__(self):
        return f"{self.maquinaria.detalle} - {self.detalle}"


class ITV(models.Model):
    maquinaria = models.ForeignKey(Maquinaria, on_delete=models.CASCADE, related_name="itvs")
    detalle = models.FloatField()

    def __str__(self):
        return f"{self.maquinaria.detalle} - {self.detalle}"


class Seguro(models.Model):
    maquinaria = models.ForeignKey(Maquinaria, on_delete=models.CASCADE, related_name="seguros")
    aporte = models.FloatField()

    def __str__(self):
        return f"{self.maquinaria.detalle} - {self.aporte}"
    
