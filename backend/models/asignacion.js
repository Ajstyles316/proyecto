const mongoose = require("mongoose");

const AsignacionSchema = new mongoose.Schema({
  maquinaria: {
    type: String,
    required: true,
  },
  fechaAsignacion: {
    type: String,
    required: true,
  },
  gestion: {
    type: String,
    required: true,
  },
  encargado: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Asignacion", AsignacionSchema);