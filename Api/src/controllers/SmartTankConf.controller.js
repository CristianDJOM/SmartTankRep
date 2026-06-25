SmartTankConfCtrl = {};
const SmartTankConf = require("../models/SmartTannkConf");
const Nivel = require("../models/Nivel");
const moment = require("moment");

SmartTankConfCtrl.Registro = async (req, res) => {
  console.log(req.body);
  const {
    ssid,
    password,
    tipoTanque,
    alturaTanqueCM,
    ancho,
    anchoS,
    anchoB,
    deviceName,
    idDispositivo,
    idUsuario,
  } = req.body;

  if (
    !ssid ||
    !password ||
    !tipoTanque ||
    !alturaTanqueCM ||
    !deviceName ||
    !idDispositivo ||
    !idUsuario
  ) {
    return res.status(400).json({ mensaje: "Datos generales incompletos" });
  }

  // Validar según tipo de tanque
  if (tipoTanque === "Cilindrico" && !ancho) {
    return res
      .status(400)
      .json({ mensaje: "Falta el campo 'ancho' para tanque Cilíndrico" });
  }

  if (tipoTanque === "Conico" && (!anchoS || !anchoB)) {
    return res.status(400).json({
      mensaje: "Faltan los campos 'anchoS' y/o 'anchoB' para tanque Cónico",
    });
  }

  // Crear documento con los campos disponibles
  const nuevoSmartTankConf = new SmartTankConf({
    Ssid: ssid,
    Password: password,
    tipoTanque: tipoTanque,
    HeightTank: alturaTanqueCM,
    ancho: ancho || null,
    anchoS: anchoS || null,
    anchoB: anchoB || null,
    deviceName: deviceName,
    idDispositivo: idDispositivo,
    idUsuario: idUsuario,
  });

  await nuevoSmartTankConf.save();
  res.status(201).json({ mensaje: "Registro Exitoso" });
};

SmartTankConfCtrl.Dispositivos = async (req, res) => {
  const { userId } = req.params;
  const dispositivos = await SmartTankConf.find({
    idUsuario: userId,
  }).lean();
  res.json(dispositivos);
};

SmartTankConfCtrl.Dispositivo = async (req, res) => {
  const { dispositivoId } = req.params;
  const dispositivo = await SmartTankConf.find({
    idDispositivo: dispositivoId,
  }).lean();
  res.json({ dispositivo });
};

SmartTankConfCtrl.Editar = async (req, res) => {
  const { dispositivoId, ssid, password, altura, deviceName } = req.body;
};

SmartTankConfCtrl.Eliminar = async (req, res) => {
  const { dispositivoId } = req.params;
  console.log(dispositivoId);

  //Eliminar sensor
  await SmartTankConf.findOneAndDelete({ idDispositivo: dispositivoId });

  //Eliminar datos del sensor
  await Nivel.deleteMany({ idDispositivo: dispositivoId });

  res.status(200).json({ message: "Dispositivo eliminado correctamente" });
};

SmartTankConfCtrl.ConsumoTodos = async (req, res) => {
  const { userId } = req.params;

  try {
    const dispositivos = await SmartTankConf.find({ idUsuario: userId }).lean();

    let resultados = [];
    let CostoM3 = 4285.06;

    // Objeto para ir acumulando el consumo total por mes de todos los dispositivos
    const consumoMensual = {}; // { "YYYY-MM": total }

    for (const dispositivo of dispositivos) {
      const datos = await Nivel.aggregate([
        {
          $match: {
            idDispositivo: dispositivo.idDispositivo,
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

      const datosPorFecha = {};
      for (const d of datos) {
        const fecha = d.fechaStr;
        if (!datosPorFecha[fecha]) datosPorFecha[fecha] = [];
        datosPorFecha[fecha].push(d.Nivel);
      }

      let consumos = [];
      for (const [fecha, niveles] of Object.entries(datosPorFecha)) {
        let consumoDia = 0;
        for (let i = 1; i < niveles.length; i++) {
          const dif = niveles[i - 1] - niveles[i];
          if (dif > 0) consumoDia += dif;
        }
        const mes = fecha.substring(0, 7); // "YYYY-MM"
        if (!consumoMensual[mes]) consumoMensual[mes] = 0;
        consumoMensual[mes] += consumoDia;

        consumos.push({
          fecha,
          consumo: parseFloat(consumoDia.toFixed(2)),
        });
      }

      const hoy = moment();
      const hoyStr = hoy.format("YYYY-MM-DD");
      const ayerStr = hoy.clone().subtract(1, "day").format("YYYY-MM-DD");

      const semanaInicio = hoy.clone().startOf("isoWeek");
      const semanaFin = hoy.clone().endOf("isoWeek");

      const semanaPasadaInicio = semanaInicio.clone().subtract(1, "week");
      const semanaPasadaFin = semanaFin.clone().subtract(1, "week");

      const mesPasado = hoy.clone().subtract(1, "month");

      const consumoHoy = consumos.find((c) => c.fecha === hoyStr)?.consumo || 0;
      const consumoAyer = consumos.find((c) => c.fecha === ayerStr)?.consumo || 0;

      const consumoSemanaActual = consumos.filter((c) =>
        moment(c.fecha).isBetween(semanaInicio, semanaFin, null, "[]")
      );
      const totalSemanaActual = consumoSemanaActual.reduce(
        (sum, d) => sum + d.consumo,
        0
      );

      const consumoSemanaPasada = consumos.filter((c) =>
        moment(c.fecha).isBetween(
          semanaPasadaInicio,
          semanaPasadaFin,
          null,
          "[]"
        )
      );
      const totalSemanaPasada = consumoSemanaPasada.reduce(
        (sum, d) => sum + d.consumo,
        0
      );

      const consumoMesActual = consumos.filter((c) =>
        moment(c.fecha).isSame(hoy, "month")
      );
      const totalMesActual = consumoMesActual.reduce(
        (sum, d) => sum + d.consumo,
        0
      );

      const consumoMesPasado = consumos.filter((c) =>
        moment(c.fecha).isSame(mesPasado, "month")
      );

      const totalMesPasado = consumoMesPasado.reduce(
        (sum, d) => sum + d.consumo,
        0
      );

      resultados.push({
        idDispositivo: dispositivo.idDispositivo,
        deviceName: dispositivo.deviceName,
        hoy: parseFloat(consumoHoy.toFixed(2)),
        ayer: parseFloat(consumoAyer.toFixed(2)),
        semana: parseFloat(totalSemanaActual.toFixed(2)),
        semanaPasada: parseFloat(totalSemanaPasada.toFixed(2)),
        mes: parseFloat(totalMesActual.toFixed(2)),
        mesPasado: parseFloat(totalMesPasado.toFixed(2)),

        Choy: parseFloat(((consumoHoy / 1000) * CostoM3).toFixed(2)),
        Cayer: parseFloat(((consumoAyer / 1000) * CostoM3).toFixed(2)),
        Csemana: parseFloat(((totalSemanaActual / 1000) * CostoM3).toFixed(2)),
        CsemanaPasada: parseFloat(
          ((totalSemanaPasada / 1000) * CostoM3).toFixed(2)
        ),
        Cmes: parseFloat(((totalMesActual / 1000) * CostoM3).toFixed(2)),
        CmesPasado: parseFloat(((totalMesPasado / 1000) * CostoM3).toFixed(2)),
      });
    }

    // Construir vector de consumo de los últimos 5 meses
    const consumoUltimos5Meses = [];
    for (let i = 4; i >= 0; i--) {
      const mes = moment().subtract(i, "months").format("YYYY-MM");
      consumoUltimos5Meses.push({
        mes,
        consumo: parseFloat((consumoMensual[mes] || 0).toFixed(2)),
      });
    }

    console.log(resultados);
    console.log(consumoUltimos5Meses);

    res.status(200).json({
      dispositivos: resultados,
      consumoUltimos5Meses,
    });
  } catch (error) {
    console.error(
      "Error al calcular consumo de todos los dispositivos:",
      error
    );
    res
      .status(500)
      .json({ error: "Error al calcular consumo de dispositivos" });
  }
};


module.exports = SmartTankConfCtrl;
