const router = require("express").Router();

const {
  Pagos,
  DetallesDePagos,
  DetallesCobros,
  Rendimiento,
  MisPagos,
  GenerarPdfClientes,
  GenerarPdfAdmin,
  Inventario,
  eliminarPago,
} = require("../controllers/Pagos.controller");

// Routes
router.post("/Pagos", Pagos);
router.get("/DetallesDePagos/:clienteId", DetallesDePagos);
router.get("/Detalles/Cobros/:userId", DetallesCobros);
router.get("/Inventario/:userId", Inventario);
router.get("/Rendimiento/:userId", Rendimiento);
router.post("/Mis/Pagos", MisPagos);
router.post("/GenerarPdf/Clientes", GenerarPdfClientes);
router.get("/GenerarPdf/Admin", GenerarPdfAdmin);
router.post("/Eliminar/Pago", eliminarPago);

module.exports = router;