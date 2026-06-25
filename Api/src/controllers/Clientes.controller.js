const ClientesCtrl = {};
const Users = require("../models/Users");
const Clientes = require("../models/Clientes");
const Pagos = require("../models/Pagos");
const moment = require("moment");

ClientesCtrl.registrarPrestamo = async (req, res) => {
  const {
    name,
    identification,
    phone,
    email,
    location,
    description,
    loanDate,
    LastPaymentDate,
    NextPaymentDate,
    paymentFrequency,
    paymentDays,
    interestRate,
    loanAmount,
    loanAmountSI,
    guarantee,
    sharevalue,
    loangain,
  } = req.body;

  // Validaciones de campos obligatorios
  if (!name) {
    return res
      .status(400)
      .json({ message: "Por favor, ingrese el nombre del cliente" });
  }
  if (!identification) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese la identificación del cliente" });
  }
  if (!phone) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese el teléfono del cliente" });
  }
  if (!loanDate) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese la fecha de préstamo" });
  }
  if (!LastPaymentDate) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular la fecha de último pago" });
  }
  if (!NextPaymentDate) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular la fecha del próximo pago" });
  }
  if (!paymentFrequency) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese la frecuencia de pago" });
  }
  if (!paymentDays) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese el número de días para pagar" });
  }
  if (!interestRate) {
    return res.status(400).json({
      message: "Por favor, Ingrese el porcentaje de interés del préstamo",
    });
  }
  if (!loanAmountSI) {
    return res
      .status(400)
      .json({ message: "Ingrese el Monto Prestado" });
  }
  if (!loanAmount) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular el total del préstamo" });
  }
  if (!sharevalue) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular el valor de la cuota" });
  }
  if (!loangain) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular las ganancias del préstamo" });
  }

  // Formatear ubicación si se proporciona
  let formattedLocation = {};
  if (location) {
    const match = location.match(
      /Lat:\s*(-?\d+(\.\d+)?),\s*Lon:\s*(-?\d+(\.\d+)?)/
    );
    if (match) {
      formattedLocation = {
        coordinates: {
          latitude: parseFloat(match[1]),
          longitude: parseFloat(match[3]),
        },
        description: description || "", // Agregar descripción si está disponible
      };
    } else {
      return res.status(400).json({ message: "Formato de ubicación inválido" });
    }
  }

  // Verificar si el cliente ya tiene un préstamo registrado
  const existeCliente = await Clientes.findOne({ identification });
  if (existeCliente) {
    return res
      .status(400)
      .json({ message: "Esta persona ya tiene un préstamo registrado" });
  }

  // Crear el cliente con los datos proporcionados
  const nuevoCliente = new Clientes({
    name,
    identification,
    phone,
    email: email || null, // Si no se proporciona, guardar como null
    location: formattedLocation,
    loanDate: new Date(loanDate),
    LastPaymentDate: new Date(LastPaymentDate),
    NextPaymentDate: new Date(NextPaymentDate),
    paymentFrequency,
    paymentDays: parseInt(paymentDays),
    interestRate: parseFloat(interestRate),
    loanAmount: parseFloat(loanAmount),
    loanAmountSI: parseFloat(loanAmountSI),
    guarantee: guarantee || null, // Si no se proporciona, guardar como null
    sharevalue: parseFloat(sharevalue),
    loangain: parseFloat(loangain),
  });

  // Guardar el cliente en la base de datos
  try {
    await nuevoCliente.save();
    return res.status(201).json({ message: "Préstamo registrado con éxito" });
  } catch (error) {
    console.error("Error al guardar el préstamo:", error);
    res.status(500).json({ message: "Error al guardar el préstamo" });
  }
};

ClientesCtrl.NuevosDias = async (req, res) => {
  try {
    const { paymentDays, idCliente, idUsuario } = req.body;

    // Verificar si el usuario existe y es administrador
    const usuario = await Users.findById(idUsuario);
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!usuario.admin) {
      return res
        .status(403)
        .json({ message: "Acceso denegado. No eres administrador" });
    }

    // Buscar el cliente
    const cliente = await Clientes.findById(idCliente);
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado" });
    }

    // Verificar que el cliente tenga una fecha de último pago válida
    if (!cliente.LastPaymentDate) {
      return res
        .status(400)
        .json({ message: "El cliente no tiene un último pago registrado" });
    }

    // Convertir la fecha de último pago a objeto Date
    let lastPaymentDate = new Date(cliente.LastPaymentDate);

    // Sumar los días recibidos
    // Sumar los días correctamente
    lastPaymentDate.setUTCDate(
      lastPaymentDate.getUTCDate() + parseInt(paymentDays)
    );
    const FFin = false;

    // Actualizar los días de pago del cliente
    await Clientes.findByIdAndUpdate(idCliente, {
      FFin,
      LastPaymentDate: lastPaymentDate,
    });

    return res.status(201).json({
      message: "Días de pago actualizados correctamente",
    });
  } catch (error) {
    console.error("Error al actualizar los días de pago:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

ClientesCtrl.Clientes = async (req, res) => {
  try {
    const clientes = await Clientes.find({ finalizado: false }).lean();

    if (!clientes) {
      return res
        .status(404)
        .json({ message: "No se encontraron clientes registrados" });
    }

    const hoy = new Date();

    // Forzar la fecha a la zona horaria de Colombia (GMT-5)
    const opciones = {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    // Convertir la fecha a formato 'YYYY-MM-DD'
    const hoyM = new Intl.DateTimeFormat("en-CA", opciones).format(hoy);

    const clientesActualizados = await Promise.all(
      clientes.map(async (cliente) => {
        let LatePayments = cliente.LatePayments;
        const nextPaymentDate = new Date(cliente.NextPaymentDate);
        const lastPaymentDate = new Date(cliente.LastPaymentDate);
        const nextPaymentDateISO = nextPaymentDate.toISOString().split("T")[0];
        const LastPaymentDateOnlyISO = lastPaymentDate
          .toISOString()
          .split("T")[0];

        if (
          cliente.paymentFrequency === "Diario" ||
          cliente.paymentFrequency === "Semanal" ||
          cliente.paymentFrequency === "Quincenal" ||
          cliente.paymentFrequency === "Mensual"
        ) {
          if (nextPaymentDateISO === hoyM && cliente.LatePayments === 1) {
            LatePayments -= 1;
            await Clientes.findByIdAndUpdate(cliente._id, {
              LatePayments,
            });
          }
        }

        // Si aún no ha pagado hoy y su fecha de pago ya pasó, actualizar LatePayments
        if (nextPaymentDateISO < hoyM) {
          // Convertirlas nuevamente a objetos Date
          const nextPaymentDateOnly = new Date(nextPaymentDateISO);
          const hoyOnly = new Date(hoyM);

          // Calcular la diferencia en días completos
          const diasAtraso = Math.floor(
            (hoyOnly - nextPaymentDateOnly) / (1000 * 60 * 60 * 24)
          );

          if (cliente.paymentFrequency === "Diario") {
            if (diasAtraso > 0) {
              let diasSinDomingos = 0;
              let fechaTemporal = new Date(nextPaymentDateOnly);

              // Recorrer cada día hasta hoy, omitiendo los domingos
              while (fechaTemporal < hoyOnly) {
                fechaTemporal.setDate(fechaTemporal.getDate() + 1);
                if (fechaTemporal.getDay() !== 0) {
                  // 0 representa el domingo
                  diasSinDomingos++;
                }
              }

              LatePayments = diasSinDomingos;
              await Clientes.findByIdAndUpdate(cliente._id, { LatePayments });
            }
          }
          if (cliente.paymentFrequency === "Semanal") {
            if (
              (diasAtraso % 7 === 0 || diasAtraso === 1) &&
              !cliente.DiaAtrasoRegistrado
            ) {
              LatePayments += 1;
              const DiaAtrasoRegistrado = true;
              await Clientes.findByIdAndUpdate(cliente._id, {
                LatePayments,
                DiaAtrasoRegistrado,
              });
            }
            if (
              diasAtraso % 7 != 0 &&
              diasAtraso != 1 &&
              cliente.DiaAtrasoRegistrado
            ) {
              const DiaAtrasoRegistrado = false;
              await Clientes.findByIdAndUpdate(cliente._id, {
                DiaAtrasoRegistrado,
              });
            }
          }
          if (cliente.paymentFrequency === "Quincenal") {
            if (
              (diasAtraso % 15 === 0 || diasAtraso === 1) &&
              !cliente.DiaAtrasoRegistrado
            ) {
              LatePayments += 1;
              const DiaAtrasoRegistrado = true;
              await Clientes.findByIdAndUpdate(cliente._id, {
                LatePayments,
                DiaAtrasoRegistrado,
              });
            }
            if (
              diasAtraso % 15 != 0 &&
              diasAtraso != 1 &&
              cliente.DiaAtrasoRegistrado
            ) {
              const DiaAtrasoRegistrado = false;
              await Clientes.findByIdAndUpdate(cliente._id, {
                DiaAtrasoRegistrado,
              });
            }
          }

          if (cliente.paymentFrequency === "Mensual") {
            const fechaPago = new Date(nextPaymentDate);
            const añoPago = fechaPago.getFullYear();
            const mesPago = fechaPago.getMonth();

            //const hoyS = new Date("2025-04-06T00:00:00Z"); // Simulando que hoy es 6 de febrero de 2025

            const diasAtraso = Math.floor(
              (hoy - nextPaymentDate) / (1000 * 60 * 60 * 24)
            );

            const añoHoy = hoy.getFullYear();
            const mesHoy = hoy.getMonth();

            // Calcular la diferencia de meses
            const mesesAtraso = (añoHoy - añoPago) * 12 + (mesHoy - mesPago);

            if (mesesAtraso > 0) {
              LatePayments = mesesAtraso;
              await Clientes.findByIdAndUpdate(cliente._id, {
                LatePayments,
              });
            }
            if (
              mesesAtraso === 0 &&
              diasAtraso === 1 &&
              !cliente.DiaAtrasoRegistrado
            ) {
              LatePayments += 1;
              const DiaAtrasoRegistrado = true;
              await Clientes.findByIdAndUpdate(cliente._id, {
                LatePayments,
                DiaAtrasoRegistrado,
              });
            }
            if (mesesAtraso > 0 && cliente.DiaAtrasoRegistrado) {
              const DiaAtrasoRegistrado = false;
              await Clientes.findByIdAndUpdate(cliente._id, {
                DiaAtrasoRegistrado,
              });
            }
          }
        }
        const nextPaymentDateOnly = new Date(nextPaymentDateISO);
        const hoyOnly = new Date(hoyM);
        const LastPaymentDateOnly = new Date(LastPaymentDateOnlyISO);

        const FechaFin = Math.floor(
          (hoyOnly - LastPaymentDateOnly) / (1000 * 60 * 60 * 24)
        );

        let color = "#8fed8a"; // Verde
        let estado = `Faltan ${Math.ceil(
          (nextPaymentDateOnly - hoyOnly) / (1000 * 60 * 60 * 24)
        )} días para el pago`;

        if (FechaFin > 0 && cliente.loanAmount > 0) {
          const FFin = true;
          await Clientes.findByIdAndUpdate(cliente._id, {
            FFin,
          });
          color = "#f48a8a"; // Rojo
          estado = "Alerta! no tiene mas fechas habilitadas";
        } else if (LatePayments > 0) {
          color = "#f48a8a"; // Rojo
          estado = `Tiene ${LatePayments} ${
            LatePayments === 1 ? "fecha" : "fechas"
          } de atraso`;
        } else if (
          nextPaymentDate.toISOString().split("T")[0] ===
          hoyOnly.toISOString().split("T")[0]
        ) {
          color = "#f4f990"; // Amarillo
          estado = "Debe pagar hoy";
        }

        return { ...cliente, color, estado, LatePayments };
      })
    );

    const clientesOrdenados = clientesActualizados.sort((a, b) => {
      const prioridad = { "#f48a8a": 1, "#f4f990": 2, "#8fed8a": 3 };
      return prioridad[a.color] - prioridad[b.color];
    });

    res.status(200).json({ clientes: clientesOrdenados });
  } catch (error) {
    res.status(500).json({ message: "Error al buscar clientes" });
  }
};

ClientesCtrl.DetallesCliente = async (req, res) => {
  const { ID } = req.body;

  try {
    const cliente = await Clientes.findById(ID).lean();

    if (!cliente) {
      return res
        .status(404)
        .json({ message: "No se encontraron clientes registrados" });
    }

    res.status(200).json({ cliente });
  } catch (error) {
    res.status(500).json({ message: "Error al buscar al cliente" });
  }
};

ClientesCtrl.ClientesFinalizados = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verificar si el usuario existe y es administrador
    const admin = await Users.findById(userId).lean();
    if (!admin || !admin.admin) {
      return res.status(403).json({ message: "Acceso denegado." });
    }

    // Buscar clientes finalizados
    const clientes = await Clientes.find({ finalizado: true }).lean();

    const hoy = new Date();

    // Forzar la fecha a la zona horaria de Colombia (GMT-5)
    const opciones = {
      timeZone: "America/Bogota",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    // Convertir la fecha a formato 'YYYY-MM-DD'
    const hoyM = new Intl.DateTimeFormat("en-CA", opciones).format(hoy);

    const clientesActualizados = await Promise.all(
      clientes.map(async (cliente) => {
        const LastPaymentDate = new Date(cliente.LastPaymentDate);
        const LastPaymentDateISO = LastPaymentDate.toISOString().split("T")[0];
        const LastPaymentDateISOOnly = new Date(LastPaymentDateISO);
        const hoyOnly = new Date(hoyM);

        // Calcular la diferencia en días completos
        const diasEliminado = Math.floor(
          (hoyOnly - LastPaymentDateISOOnly) / (1000 * 60 * 60 * 24)
        );

        // Verificar si los días eliminados son >= 60 y eliminar el cliente
        if (diasEliminado >= 90) {
          await Clientes.findByIdAndDelete(cliente._id);
          console.log(`Cliente ${cliente.name} eliminado por inactividad.`);
          // Eliminar los pagos asociados al cliente
          const pagosEliminados = await Pagos.deleteMany({ idCliente: cliente._id });
          console.log(`Pagos eliminados: ${pagosEliminados.deletedCount}`);
          return null; // No retornar el cliente eliminado
        }

        return cliente; // Retornar solo los clientes no eliminados
      })
    );

    // Filtrar clientes nulos (los eliminados)
    const clientesFiltrados = clientesActualizados.filter(cliente => cliente !== null);

    res.status(200).json({ Personas: clientesFiltrados });
  } catch (error) {
    console.error("Error en ClientesFinalizados:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

ClientesCtrl.EditarCliente = async (req, res) => {
  const {
    clienteId,
    userId,
    name,
    identification,
    phone,
    email,
    location,
    description,
    loanDate,
    LastPaymentDate,
    NextPaymentDate,
    paymentFrequency,
    paymentDays,
    interestRate,
    loanAmount,
    loanAmountSI,
    guarantee,
    sharevalue,
    loangain,
  } = req.body;

  const autorizado = await Users.findById(userId).lean();
  if (autorizado) {
    try {
      // Formatear ubicación si se proporciona
      let formattedLocation = {};
      if (location) {
        const match = location.match(
          /Lat:\s*(-?\d+(\.\d+)?),\s*Lon:\s*(-?\d+(\.\d+)?)/
        );
        if (match) {
          formattedLocation = {
            coordinates: {
              latitude: parseFloat(match[1]),
              longitude: parseFloat(match[3]),
            },
            description: description || "", // Agregar descripción si está disponible
          };
        } else {
          return res
            .status(400)
            .json({ message: "Formato de ubicación inválido" });
        }
      }
      await Pagos.updateMany(
        { idCliente: clienteId }, // Filtro para encontrar los pagos
        { $set: { identification: identification } } // Actualización de la identificación
      );
      await Clientes.findByIdAndUpdate(clienteId, {
        name: name,
        identification: identification,
        phone: phone,
        email: email || null,
        location: formattedLocation,
        loanDate: new Date(loanDate),
        LastPaymentDate: new Date(LastPaymentDate),
        NextPaymentDate: new Date(NextPaymentDate),
        paymentFrequency,
        paymentDays: parseInt(paymentDays),
        interestRate: parseFloat(interestRate),
        loanAmount: parseFloat(loanAmount),
        loanAmountSI: parseFloat(loanAmountSI),
        guarantee: guarantee || null, // Si no se proporciona, guardar como null
        sharevalue: parseFloat(sharevalue),
        loangain: parseFloat(loangain),
      });
      return res.status(201).json({ message: "Datos Editados Correctamente" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error al actualizar los datos del cliente" });
    }
  } else {
    return res
      .status(404)
      .json({ message: "No estas autorizado a realizar esta accion " });
  }
};

ClientesCtrl.registrarNuevoPrestamo = async (req, res) => {
  const {
    clienteId,
    userId,
    loanDate,
    LastPaymentDate,
    NextPaymentDate,
    paymentFrequency,
    paymentDays,
    interestRate,
    loanAmount,
    guarantee,
    sharevalue,
    loangain,
  } = req.body;

  if (!loanDate) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese la fecha de préstamo" });
  }
  if (!LastPaymentDate) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular la fecha de último pago" });
  }
  if (!NextPaymentDate) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular la fecha del próximo pago" });
  }
  if (!paymentFrequency) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese la frecuencia de pago" });
  }
  if (!paymentDays) {
    return res
      .status(400)
      .json({ message: "Por favor, Ingrese el número de días para pagar" });
  }
  if (!interestRate) {
    return res.status(400).json({
      message: "Por favor, Ingrese el porcentaje de interés del préstamo",
    });
  }
  if (!loanAmount) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular el total del préstamo" });
  }
  if (!sharevalue) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular el valor de la cuota" });
  }
  if (!loangain) {
    return res
      .status(400)
      .json({ message: "No se pudo calcular las ganancias del préstamo" });
  }

  // Verificar si el cliente ya tiene un préstamo registrado
  const autorizado = await Users.findById(userId).lean();

  if (!autorizado) {
    return res
      .status(400)
      .json({ message: "No estas autorizado para registrar prestamos" });
  }

  const finalizado = false;
  try {
    await Clientes.findByIdAndUpdate(clienteId, {
      finalizado,
      loanDate: new Date(loanDate),
      LastPaymentDate: new Date(LastPaymentDate),
      NextPaymentDate: new Date(NextPaymentDate),
      paymentFrequency,
      paymentDays: parseInt(paymentDays),
      interestRate: parseFloat(interestRate),
      loanAmount: parseFloat(loanAmount),
      guarantee: guarantee || null, // Si no se proporciona, guardar como null
      sharevalue: parseFloat(sharevalue),
      loangain: parseFloat(loangain),
    });
    const pagosPendientes = await Pagos.find({
      idCliente: clienteId,
      finalizado: false,
    }).lean();

    if (pagosPendientes.length > 0) {
      // Actualizamos todos los pagos a finalizado: true
      await Pagos.updateMany(
        { idCliente: clienteId, finalizado: false },
        { finalizado: true }
      );
    }
    return res.status(201).json({ message: "Préstamo registrado con éxito" });
  } catch (error) {
    console.error("Error al guardar el préstamo:", error);
    res.status(500).json({ message: "Error al guardar el préstamo" });
  }
};

ClientesCtrl.EliminarCliente = async (req, res) => {
  try {
    const { personaToDelete, userId } = req.body;

    const admin = await Users.findById(userId).lean();
    if (!admin || !admin.admin) {
      return res.status(403).json({ message: "Acceso denegado." });
    }

    // Obtener el cliente antes de eliminarlo
    const cliente = await Clientes.findById(personaToDelete).lean();
    if (!cliente) {
      return res.status(404).json({ message: "Cliente no encontrado." });
    }

    // Eliminar todos los pagos asociados al cliente usando su identificación
    await Pagos.deleteMany({ identification: cliente.identification });

    // Eliminar el cliente
    await Clientes.findByIdAndDelete(personaToDelete);

    res.status(200).json({ message: "Cliente y sus pagos eliminados correctamente" });
  } catch (error) {
    console.error("Error en Eliminar cliente:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

module.exports = ClientesCtrl;