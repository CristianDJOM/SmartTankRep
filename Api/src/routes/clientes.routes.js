const router = require("express").Router();

const {
  registrarPrestamo,
  Clientes,
  DetallesCliente,
  ClientesFinalizados,
  EditarCliente,
  registrarNuevoPrestamo,
  NuevosDias,
  EliminarCliente,
} = require("../controllers/Clientes.controller");

// Routes
router.post("/registrar/Prestamo", registrarPrestamo);
router.get("/Clientes/:userId", Clientes);
router.post("/Detalles/Cliente", DetallesCliente);
router.get("/Clientes/Finalizados/:userId", ClientesFinalizados);
router.post("/Editar/Cliente", EditarCliente);
router.post("/registrar/Nuevo/Prestamo", registrarNuevoPrestamo);
router.post("/Eliminar/Cliente", EliminarCliente);
router.post("/Nuevos/Dias", NuevosDias);

module.exports = router;
