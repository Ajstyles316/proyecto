const express = require("express");
const router = express.Router();
const Maquinaria = require("../models/maquinaria");

// Obtener todas las máquinas
router.get("/", async (req, res) => {
  try {
    const maquinarias = await Maquinaria.find();
    res.json(maquinarias);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear una nueva máquina
router.post("/", async (req, res) => {
  const { detalle, placa, unidad, tipo, marca, modelo } = req.body;
  const nuevaMaquinaria = new Maquinaria({ detalle, placa, unidad, tipo, marca, modelo });

  try {
    const maquinariaGuardada = await nuevaMaquinaria.save();
    res.status(201).json(maquinariaGuardada);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Actualizar una máquina
router.put("/:id", async (req, res) => {
  try {
    const { detalle, placa, unidad, tipo, marca, modelo } = req.body;
    const maquinariaActualizada = await Maquinaria.findByIdAndUpdate(
      req.params.id,
      { detalle, placa, unidad, tipo, marca, modelo },
      { new: true }
    );
    res.json(maquinariaActualizada);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Eliminar una máquina
router.delete("/:id", async (req, res) => {
  try {
    await Maquinaria.findByIdAndDelete(req.params.id);
    res.json({ message: "Máquina eliminada correctamente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;