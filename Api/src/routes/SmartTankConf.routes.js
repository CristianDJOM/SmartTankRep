const router = require("express").Router();

const {
  Registro,
  Editar,
  Eliminar,
  Dispositivos,
  Dispositivo,
  ConsumoTodos,
} = require("../controllers/SmartTankConf.controller");

// Routes
router.post("/registro", Registro);
router.post("/Editar/dispositivo", Editar);
router.post("/Eliminar/:dispositivoId", Eliminar);
router.get("/Dispositivos/:userId", Dispositivos);
router.get("/Dispositivo/:dispositivoId", Dispositivo);
router.get("/consumo/todos/:userId", ConsumoTodos);

module.exports = router;