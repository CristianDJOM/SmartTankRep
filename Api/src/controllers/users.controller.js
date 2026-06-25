const usersCtrl = {};
const Users = require("../models/Users");

usersCtrl.registrar = async (req, res) => {
  try {
    const { name, phone, email, password } = req.body;

    // Validaciones básicas
    if (!name) {
      return res.status(400).json({ message: "Por favor ingrese sus nombres" });
    }
    if (!phone) {
      return res
        .status(400)
        .json({ message: "Por favor ingrese su numero de telefono" });
    }
    if (!email) {
      return res
        .status(400)
        .json({ message: "Por favor ingrese su correo electronico" });
    }
    if (!password) {
      return res
        .status(400)
        .json({ message: "Por favor ingrese su contraseña" });
    }

    // Verificar si el usuario ya está registrado
    const existeUser = await Users.findOne({ email });
    if (existeUser) {
      return res
        .status(400)
        .json({ message: "Este usuario ya está registrado" });
    }

    // Encriptar contraseña
    const newUser = new Users({
      name,
      phone,
      email,
      password,
    });
    newUser.password = await newUser.encryptPassword(password);

    await newUser.save();
    
    res.status(201).json({
      message: "Registro exitoso.",
    });

  } catch (error) {
    res.status(500).json({ message: "Registro fallido" });
    console.log(error.message);
  }
};

usersCtrl.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email && !password) {
      return res
        .status(401)
        .json({ message: "Por favor ingrese su correo y su contraseña" });
    }
    if (!email) {
      return res
        .status(401)
        .json({ message: "Por favor ingrese su correo electronico" });
    }
    if (!password) {
      return res
        .status(401)
        .json({ message: "Por favor ingrese su contraseña" });
    }

    // Validar formato del email y dominio de Gmail
    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      return res
        .status(401)
        .json({ message: "El correo debe ser un Gmail válido" });
    }

    const user = await Users.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ message: "Correo electronico o contraseña incorrectos" });
    }

    const match = await user.matchPassword(password);

    if (!match) {
      return res.status(401).json({ message: "Contraseña incorrecta" });
    }

    //generar un token
    const token = { userId: user._id};

    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: "Inicio de sesión fallida" });
  }
};

usersCtrl.profile = async (req, res) => {
  try {
    const userId = req.params.userId;

    const user = await Users.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al recuperar el perfil de usuario" });
  }
};

usersCtrl.recuperar = async (req, res) => {
  try {
    const phone = req.body.phone;

    const user = await Users.find({ phone }).lean();

    res.status(200).json(user);
  } catch (error) {
    console.error("Error en recuperar:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

usersCtrl.cambiarContrasena = async (req, res) => {
  try {
    const { userId, nuevaContrasena } = req.body;

    // Validar que los datos sean correctos
    if (!userId || !nuevaContrasena) {
      return res
        .status(400)
        .json({ message: "Todos los campos son obligatorios." });
    }

    // Buscar el usuario en la base de datos
    const user = await Users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado." });
    }

    // Encriptar la nueva contraseña usando el método del modelo
    const hashedPassword = await user.encryptPassword(nuevaContrasena);

    // Actualizar la contraseña en la base de datos
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Contraseña actualizada correctamente.",
    });
  } catch (error) {
    console.error("Error al cambiar la contraseña:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

module.exports = usersCtrl;
