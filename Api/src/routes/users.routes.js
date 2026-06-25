const router = require("express").Router();

const {
  registrar,
  login,
  profile,
  Empleados,
  EliminarEmpleados,
  ActivarDesactivar,
  DetallesEmpleado,
  EditarEmpleado,
  Verificar,
  recuperar,
  cambiarContrasena,
} = require("../controllers/users.controller");

// Routes
router.post("/registrar/Usuario", registrar);
router.post("/login", login);
router.get("/profile/:userId", profile);
router.post("/recuperar", recuperar);
router.post("/cambiarContrasena", cambiarContrasena);

module.exports = router;