const mongoose = require("mongoose");

const NivelSchema = new mongoose.Schema({
  idDispositivo: { type: String, required: true },
  Nivel: { type: Number, required: true },
  porcentaje: { type: Number, required: true },
  FechaSensado: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Nivel = mongoose.model("Nivel", NivelSchema);

module.exports = Nivel;