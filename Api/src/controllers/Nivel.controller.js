NivelCtrl = {};
const Nivel = require("../models/Nivel");
const SmartTankConf = require("../models/SmartTannkConf");
const moment = require("moment");

let nivelActual = 0;

//Recibir y Registrar Nivel
NivelCtrl.Nivel = async (req, res) => {
  try {
    const { nivel, id, porcentaje } = req.body;

    if (nivel === undefined || nivel === null || !id) {
      return res.status(400).json({ mensaje: "Datos incompletos" });
    }

    // Buscar el último registro de nivel para este dispositivo
    const ultimoRegistro = await Nivel.findOne({ idDispositivo: id })
      .sort({ _id: -1 }) // _id ya incluye la marca de tiempo
      .lean();

    // Si el último nivel registrado es igual al actual, no guardar
    if (ultimoRegistro && ultimoRegistro.Nivel === nivel) {
      console.log("Nivel sin cambios, no se registró");
      return res
        .status(200)
        .json({ mensaje: "Nivel sin cambios, no se registró" });
    }
    console.log(ultimoRegistro && ultimoRegistro.Nivel === nivel);
    console.log(ultimoRegistro);
    console.log(ultimoRegistro.Nivel);
    console.log(nivel);
    // Crear documento con fecha actual
    const nuevoNivel = new Nivel({
      idDispositivo: id,
      Nivel: nivel,
      porcentaje: porcentaje,
      FechaSensado: moment().toDate(),
    });

    await nuevoNivel.save();

    res.status(201).json({ mensaje: "Nivel registrado correctamente" });
  } catch (error) {
    console.error("Error al registrar nivel:", error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

NivelCtrl.DetallesDeNivel = async (req, res) => {
  try {
    const { dispositivoId } = req.params;

    const dispositivos = await SmartTankConf.find({
      idDispositivo: dispositivoId,
    }).lean();

    const ultimoNivel = await Nivel.findOne({ idDispositivo: dispositivoId })
      .sort({ createdAt: -1 })
      .exec();

    if (!ultimoNivel) {
      return res
        .status(404)
        .json({ mensaje: "No se encontraron datos para este dispositivo" });
    }

    const hoy = moment().endOf("month");
    const cincoMesesAtras = moment().subtract(4, "months").startOf("month");

    // Traer todos los datos desde hace 5 meses hasta hoy
    const datos = await Nivel.aggregate([
      {
        $match: {
          idDispositivo: dispositivoId,
          FechaSensado: {
            $gte: cincoMesesAtras.toDate(),
            $lte: hoy.toDate(),
          },
        },
      },
      {
        $project: {
          Nivel: 1,
          FechaSensado: 1,
          fechaStr: {
            $dateToString: { format: "%Y-%m-%d", date: "$FechaSensado" },
          },
          mesStr: {
            $dateToString: { format: "%Y-%m", date: "$FechaSensado" },
          },
        },
      },
      {
        $sort: { FechaSensado: 1 },
      },
    ]);

    // Agrupar por fecha
    const datosPorFecha = {};
    for (const d of datos) {
      const fecha = d.fechaStr;
      if (!datosPorFecha[fecha]) datosPorFecha[fecha] = [];
      datosPorFecha[fecha].push(d.Nivel);
    }

    // Calcular consumo por día
    let consumos = [];
    for (const [fecha, niveles] of Object.entries(datosPorFecha)) {
      let consumoDia = 0;
      for (let i = 1; i < niveles.length; i++) {
        const dif = niveles[i - 1] - niveles[i];
        if (dif > 0) consumoDia += dif;
      }
      consumos.push({
        fecha,
        mes: fecha.slice(0, 7),
        consumo: parseFloat(consumoDia.toFixed(2)),
      });
    }

    // Agrupar consumo por mes
    const consumoMensual = {};
    for (const { mes, consumo } of consumos) {
      if (!consumoMensual[mes]) consumoMensual[mes] = 0;
      consumoMensual[mes] += consumo;
    }

    // Asegurar que haya 5 meses (aunque no haya datos)
    const consumoUltimos5Meses = [];
    for (let i = 4; i >= 0; i--) {
      const mes = moment().subtract(i, "months").format("YYYY-MM");
      consumoUltimos5Meses.push({
        mes,
        consumo: parseFloat((consumoMensual[mes] || 0).toFixed(2)),
      });
    }
    console.log(consumoUltimos5Meses);

    res.json({
      nivel: ultimoNivel.Nivel,
      porcentaje: ultimoNivel.porcentaje,
      dispositivos,
      consumoUltimos5Meses,
    });
  } catch (error) {
    console.error("Error al obtener nivel y consumo mensual:", error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
};

NivelCtrl.EliminarNivel = async (req, res) => {
  try {
    const { dispositivoId } = req.params;

    if (!dispositivoId) {
      return res.status(400).json({ mensaje: "ID de dispositivo requerido" });
    }

    const resultado = await Nivel.deleteMany({ idDispositivo: dispositivoId });

    res.status(200).json({
      mensaje: "Datos eliminados correctamente",
      eliminados: resultado.deletedCount,
    });
  } catch (error) {
    console.error("Error al eliminar niveles:", error);
    res.status(500).json({ mensaje: "Error al eliminar datos" });
  }
};

module.exports = NivelCtrl;
