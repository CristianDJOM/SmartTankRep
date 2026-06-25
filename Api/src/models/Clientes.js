const mongoose = require("mongoose");

const ClientesSchema = new mongoose.Schema({
  finalizado: {type: Boolean, default: false},
  FFin: {type: Boolean, default: false},
  name: { type: String, require: true },
  identification: { type: String, required: true, unique: true },
  phone: { type: Number, require: true },
  email: { type: String, unique: false },
  location: {
    coordinates: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    description: { type: String },
  },
  loanDate: { type: Date, required: true }, // Fecha del prestamo
  LastPaymentDate: { type: Date, required: true }, // Fecha ultimo pago
  NextPaymentDate: { type: Date, required: true }, // Fecha Proximo Pago
  paymentFrequency: { type: String, required: true }, // Frecuancia de pago
  paymentDays: { type: Number, required: true }, // Número de días para pagar
  interestRate: { type: Number, required: true }, // Porcentaje de interés
  loanAmount: { type: Number, required: true }, // Monto prestado
  loanAmountSI: { type: Number, required: true }, // Monto prestado sin interes
  guarantee: { type: String}, // Garantía del préstamo
  sharevalue: {type: Number, required: true }, // Valor de la cuota
  loangain: {type: Number, required: true}, // Ganancias del prestamo
  LatePayments: {type: Number, required: true, default: 0}, // Pagos atrasados
  DiaAtrasoRegistrado: { type: Boolean, default: false }, // Se Registro el dia de atraso
  HasPaidToday: { type: Boolean, default: true }, //Pago Hoy
  createdAt: { type: Date, default: Date.now },
});

const Clientes = mongoose.model("Cliente", ClientesSchema);

module.exports = Clientes;
