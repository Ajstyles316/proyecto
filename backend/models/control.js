const mongoose = require("mongoose");

const ControlSchema = new mongoose.Schema({
  estado: {
    type: String,
    required: true,
  },
  ubicacion: {
    type: String,
    required: true,
  },
  gerente: {
    type: String,
    required: true,
  },
  encargado: {
    type: String,
    required: true,
  },
  fecha: {
    type: String,
    required: true,
  },
  observaciones: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Control", ControlSchema);