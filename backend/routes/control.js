const express = require("express");
const router = express.Router();
const Control = require("../models/control");

// Obtener todos los controles
router.get("/", async (req, res) => {
  try {
    const controls = await Control.find();
    res.json(controls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Crear un nuevo control
router.post("/", async (req, res) => {
  const { estado, ubicacion, gerente, encargado, fecha, observaciones } = req.body;
  const nuevoControl = new Control({ estado, ubicacion, gerente, encargado, fecha, observaciones });

  try {
    const controlGuardado = await nuevoControl.save();
    res.status(201).json(controlGuardado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Actualizar un control existente
router.put("/:id", async (req, res) => {
  try {
    const { estado, ubicacion, gerente, encargado, fecha, observaciones } = req.body;
    const controlActualizado = await Control.findByIdAndUpdate(
      req.params.id,
      { estado, ubicacion, gerente, encargado, fecha, observaciones },
      { new: true }
    );
    res.json(controlActualizado);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Eliminar un control
router.delete("/:id", async (req, res) => {
  try {
    await Control.findByIdAndDelete(req.params.id);
    res.json({ message: "Control eliminado correctamente" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;