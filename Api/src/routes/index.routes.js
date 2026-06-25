const express = require("express");
const router = express.Router();

// Controllers
const { renderIndex} = require("../controllers/index.controller");

router.get("/", renderIndex);

module.exports = router;