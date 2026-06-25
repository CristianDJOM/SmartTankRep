const router = require("express").Router();

const {
  Nivel,
  DetallesDeNivel,
  EliminarNivel,
} = require("../controllers/Nivel.controller");

// Routes
router.post("/nivel", Nivel);
router.get("/Detalles/nivel/:dispositivoId", DetallesDeNivel);
router.post("/Eliminar/Nivel/:dispositivoId", EliminarNivel);

module.exports = router;
