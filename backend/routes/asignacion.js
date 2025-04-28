const express = require("express");
const router = express.Router();
const Asignacion = require("../models/asignacion");

// Obtener todas las asignaciones
router.get("/", async (req, res) => {
  try {
    const asignaciones = await Asignacion.find();
    res.json(asignaciones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear una nueva asignación
router.post("/", async (req, res) => {
  const { maquinaria, fechaAsignacion, gestion, encargado } = req.body;
  const nuevaAsignacion = new Asignacion({ maquinaria, fechaAsignacion, gestion, encargado });

  try {
    const asignacionGuardada = await nuevaAsignacion.save();
    res.status(201).json(asignacionGuardada);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Actualizar una asignación existente
router.put("/:id", async (req, res) => {
  try {
    const { maquinaria, fechaAsignacion, gestion, encargado } = req.body;
    const asignacionActualizada = await Asignacion.findByIdAndUpdate(
      req.params.id,
      { maquinaria, fechaAsignacion, gestion, encargado },
      { new: true }
    );
    res.json(asignacionActualizada);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Eliminar una asignación
router.delete("/:id", async (req, res) => {
  try {
    await Asignacion.findByIdAndDelete(req.params.id);
    res.json({ message: "Asignación eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;