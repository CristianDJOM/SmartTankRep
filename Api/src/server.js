const bodyParser = require("body-parser");
const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const morgan = require("morgan");
const moment = require("moment");

// Initializations
const app = require("express")();
require("./config/passport");

// settings
app.set("port", 3000);
app.set("views", path.join(__dirname, "views"));
app.engine(
  ".hbs",
  exphbs({
    defaultLayout: "main",
    layoutsDir: path.join(app.get("views"), "layouts"),
    partialsDir: path.join(app.get("views"), "partials"),
    extname: ".hbs",
    helpers: {
      formatDate: function (date) {
        if (!date) return "Fecha no disponible"; // Evita errores con valores nulos
        return moment(date).format("DD/MM/YYYY"); // Establece un solo formato
      },
      sumTotal: function (pagos) {
        return pagos.reduce((total, pago) => total + pago.ValorCobrado, 0); // Sumar valores cobrados
      },
    },
  })
);
app.set("view engine", ".hbs");

const cors = require("cors");
app.use(cors());

// middlewares
app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride("_method"));
app.use(
  session({
    secret: "secret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
//Para configurar boostrap theme
app.use("/public", express.static(__dirname + "/public"));

// Global Variables
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  next();
});

app.use(express.json());

const Clientes = require("./models/Clientes");
const Pagos = require("./models/Nivel");

const cron = require("node-cron");

// Tarea que se ejecuta a medianoche (00:00)
cron.schedule("0 0 * * *", async () => {
  console.log("⏳ Reiniciando HasPaidToday...");
  await Clientes.updateMany({}, { HasPaidToday: false });
  console.log("✅ HasPaidToday reiniciado");
});

// routes
app.use(require("./routes/index.routes"));
app.use(require("./routes/users.routes"));
app.use(require("./routes/Nivel.routes"));
app.use(require("./routes/SmartTankConf.routes"));

app.post("/api/conexion", (req, res) => {
  console.log("Conexión exitosa:", req.body);
  res.status(200).json({ mensaje: "Conectado al servidor correctamente" });
});

// static files
app.use(express.static(path.join(__dirname, "public")));

module.exports = app;
