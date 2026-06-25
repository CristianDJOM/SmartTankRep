const mongoose = require("mongoose");

const { NOTES_APP_MONGODB_HOST, NOTES_APP_MONGODB_DATABASE } = process.env;

//URI que te da mongoDb cuando creas una nueva base de datos deben escribir el nombre y contraseña que asignaron
const MONGODB_URI = "URI";
//Verificacion de conexion

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true 
  })
  .then(db => console.log("DB is connected"))
  .catch(err => console.error(err));