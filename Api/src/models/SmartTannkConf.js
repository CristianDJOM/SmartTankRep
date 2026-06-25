const mongoose = require("mongoose");

const SmartTankConfSchema = new mongoose.Schema({
  Ssid: { type: String, required: true },
  Password: { type: String, required: true },
  tipoTanque: { type: String, required: true },
  HeightTank: { type: Number, required: true },
  ancho: { type: Number},
  anchoS: { type: Number},
  anchoB: { type: Number},
  deviceName: { type: String, required: true },
  idDispositivo: { type: String, required: true },
  idUsuario: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const SmartTankConf = mongoose.model("SmartTankConf", SmartTankConfSchema);

module.exports = SmartTankConf;
