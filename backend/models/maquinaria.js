const mongoose = require("mongoose");

const MaquinariaSchema = new mongoose.Schema({
  detalle: {
    type: String,
    required: true,
  },
  placa: {
    type: String,
    required: true,
  },
  unidad: {
    type: String,
    required: true,
  },
  tipo: {
    type: String,
  },
  marca: {
    type: String,
  },
  modelo: {
    type: String,
  },
});

module.exports = mongoose.model("Maquinaria", MaquinariaSchema);