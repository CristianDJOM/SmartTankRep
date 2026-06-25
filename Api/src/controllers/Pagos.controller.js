const PagosCtrl = {};
const Pagos = require("../models/Pagos");
const Users = require("../models/Users");
const Clientes = require("../models/Clientes");
const PDFDocument = require("pdfkit");
const path = require("path");
const axios = require("axios");
const moment = require("moment");
require("moment/locale/es"); // Asegúrate de importar el idioma español

moment.locale("es"); // Establece el idioma español de forma global

PagosCtrl.Pagos = async (req, res) => {
  const { FdP, Cuota, idCliente, idUsuario } = req.body;
  const autorizado = await Users.findById(idUsuario).lean();
  const hoy = new Date();
  if (autorizado) {
    const cliente = await Clientes.findById(idCliente).lean();
    if (cliente.LatePayments === 0) {
      try {
        const nuevaCantidadTotal = cliente.loanAmount - parseFloat(Cuota);
        const HasPaidToday = true;

        if (nuevaCantidadTotal > 0) {
          const fechaDepago = new Date(hoy);
          let diasFrecuencia = 1;
          switch (cliente.paymentFrequency) {
            case "Semanal":
              diasFrecuencia = 7;
              break;
            case "Quincenal":
              diasFrecuencia = 14;
              break;
            case "Mensual":
              diasFrecuencia = "Mensual";
              break;
          }

          const ajustarSiDomingo = (fecha) => {
            const diaSemana = fecha.getUTCDay();
            console.log(
              `Fecha: ${fecha.toISOString()} - Día de la semana: ${diaSemana}`
            );

            if (diaSemana === 0) {
              fecha.setDate(fecha.getDate() + 1);
            }
          };

          const fechaProximoCobro = new Date(fechaDepago);

          if (diasFrecuencia === "Mensual") {
            fechaProximoCobro.setMonth(fechaProximoCobro.getMonth() + 1);
          } else {
            fechaProximoCobro.setDate(
              fechaProximoCobro.getDate() + diasFrecuencia
            );
          }
          ajustarSiDomingo(fechaProximoCobro);
          await Clientes.findByIdAndUpdate(idCliente, {
            NextPaymentDate: fechaProximoCobro,
          });
        }
        if (cliente.paymentDays > 0) {
          const ACND = cliente.paymentDays - 1;
          await Clientes.findByIdAndUpdate(idCliente, {
            loanAmount: nuevaCantidadTotal,
            paymentDays: ACND,
            HasPaidToday,
          });
        } else {
          await Clientes.findByIdAndUpdate(idCliente, {
            loanAmount: nuevaCantidadTotal,
            HasPaidToday,
          });
        }

        if (nuevaCantidadTotal === 0) {
          if (cliente.paymentDays > 0) {
            const paymentDays = 0;
            await Clientes.findByIdAndUpdate(idCliente, { paymentDays });
          }
          const fechaFin = new Date(hoy);
          const finalizado = true;
          await Clientes.findByIdAndUpdate(idCliente, {
            finalizado,
            LastPaymentDate: fechaFin,
          });
        }

        const NuevoPago = new Pagos({
          idCliente: idCliente,
          idUsuario: idUsuario,
          nameCliente: cliente.name,
          nameCobrador: autorizado.name,
          identification: cliente.identification,
          identificationCobrador: autorizado.identification,
          FechaDelPago: new Date(FdP),
          FechaVencimiento: cliente.NextPaymentDate,
          ValorCobrado: parseInt(Cuota),
        });

        await NuevoPago.save();

        res.status(201).json({ message: "Pago registrado correctamente" });
      } catch (error) {
        res.status(500).json({ message: "Error al registrar el pago" });
      }
    }
    if (cliente.LatePayments > 0) {
      try {
        const NuevoPagoAtrasado = cliente.LatePayments - 1;
        const nuevaCantidadTotal = cliente.loanAmount - parseInt(Cuota, 10);
        const HasPaidToday = true;

        if (cliente.paymentDays > 0) {
          const ACND = cliente.paymentDays - 1;
          await Clientes.findByIdAndUpdate(idCliente, {
            loanAmount: nuevaCantidadTotal,
            LatePayments: NuevoPagoAtrasado,
            paymentDays: ACND,
            HasPaidToday,
          });
        } else {
          await Clientes.findByIdAndUpdate(idCliente, {
            loanAmount: nuevaCantidadTotal,
            LatePayments: NuevoPagoAtrasado,
            HasPaidToday,
          });
        }

        
        if (nuevaCantidadTotal === 0) {
          if (cliente.paymentDays > 0) {
            const paymentDays = 0;
            await Clientes.findByIdAndUpdate(idCliente, { paymentDays });
          }
          const fechaFin = new Date(hoy);
          const finalizado = true;
          await Clientes.findByIdAndUpdate(idCliente, {
            finalizado,
            LastPaymentDate: fechaFin,
          });
        }

        const fechaDepago = new Date(cliente.NextPaymentDate);
        let diasFrecuencia = 1;
        switch (cliente.paymentFrequency) {
          case "Semanal":
            diasFrecuencia = 7;
            break;
          case "Quincenal":
            diasFrecuencia = 14;
            break;
          case "Mensual":
            diasFrecuencia = "Mensual";
            break;
        }

        const ajustarSiDomingo = (fecha) => {
          const diaSemana = fecha.getUTCDay();
          console.log(
            `Fecha: ${fecha.toISOString()} - Día de la semana: ${diaSemana}`
          );

          if (diaSemana === 0) {
            fecha.setDate(fecha.getDate() + 1);
          }
        };

        const fechaProximoCobro = new Date(fechaDepago);

        if (diasFrecuencia === "Mensual") {
          fechaProximoCobro.setMonth(fechaProximoCobro.getMonth() + 1);
        } else {
          fechaProximoCobro.setDate(
            fechaProximoCobro.getDate() + diasFrecuencia
          );
        }
        ajustarSiDomingo(fechaProximoCobro);
        await Clientes.findByIdAndUpdate(idCliente, {
          NextPaymentDate: fechaProximoCobro,
        });

        if (NuevoPagoAtrasado === 0 && nuevaCantidadTotal > 0) {
          // Calcula la fecha del próximo cobro
          const fechaDepago = new Date(cliente.NextPaymentDate);
          let diasFrecuencia = 1;
          switch (cliente.paymentFrequency) {
            case "Semanal":
              diasFrecuencia = 7;
              break;
            case "Quincenal":
              diasFrecuencia = 14;
              break;
            case "Mensual":
              diasFrecuencia = "Mensual";
              break;
          }

          const ajustarSiDomingo = (fecha) => {
            const diaSemana = fecha.getUTCDay();
            console.log(
              `Fecha: ${fecha.toISOString()} - Día de la semana: ${diaSemana}`
            );

            if (diaSemana === 0) {
              fecha.setDate(fecha.getDate() + 1);
            }
          };

          const fechaProximoCobro = new Date(fechaDepago);

          if (diasFrecuencia === "Mensual") {
            fechaProximoCobro.setMonth(fechaProximoCobro.getMonth() + 1);
          } else {
            fechaProximoCobro.setDate(
              fechaProximoCobro.getDate() + diasFrecuencia
            );
          }
          ajustarSiDomingo(fechaProximoCobro);
          await Clientes.findByIdAndUpdate(idCliente, {
            NextPaymentDate: fechaProximoCobro,
          });
        }
        const NuevoPago = new Pagos({
          idCliente: idCliente,
          idUsuario: idUsuario,
          nameCliente: cliente.name,
          nameCobrador: autorizado.name,
          identification: cliente.identification,
          identificationCobrador: autorizado.identification,
          FechaDelPago: new Date(FdP),
          FechaVencimiento: cliente.NextPaymentDate,
          ValorCobrado: parseInt(Cuota),
        });

        await NuevoPago.save();
        res.status(201).json({ message: "Pago registrado correctamente" });
      } catch (error) {
        res.status(500).json({ message: "Error al registrar el pago" });
      }
    }
  } else {
    return res
      .status(404)
      .json({ message: "No estas autorizado a realizar esta accion " });
  }
};

PagosCtrl.DetallesDePagos = async (req, res) => {
  try {
    const clienteId = req.params.clienteId;

    const cliente = await Clientes.findById(clienteId).lean();

    const pagos = await Pagos.find({
      idCliente: clienteId,
      finalizado: false,
    }).lean();

    const totalPagos = pagos.reduce((sum, pago) => sum + pago.ValorCobrado, 0);

    // Formatear el total de pagos
    const totalPagosFormateado =
      new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(totalPagos) + " $";

    res.json({ cliente, pagos, totalPagosFormateado });
  } catch (error) {
    res.status(500).json({ message: "Error al buscar los pagos" });
  }
};

PagosCtrl.DetallesCobros = async (req, res) => {
  const userId = req.params.userId;
  const autorizado = await Users.findById(userId).lean();

  if (!autorizado.admin) {
    return res.status(400).json({
      message: "No estás autorizado para ver los detalles de los cobros",
    });
  }

  try {
    const pagos = await Pagos.find().lean();

    // Formatear fechas eliminando la hora sin cambiar el día
    const pagosFormateados = pagos.map((pago) => ({
      ...pago,
      FechaDelPago: pago.FechaDelPago.toISOString().split("T")[0], // YYYY-MM-DD
      FechaVencimiento: pago.FechaVencimiento.toISOString().split("T")[0], // YYYY-MM-DD
    }));

    res.json({ pagos: pagosFormateados });
  } catch (error) {
    res.status(500).json({ message: "Error al buscar los pagos" });
  }
};

PagosCtrl.Inventario = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Verificar si el usuario está autorizado
    const autorizado = await Users.findById(userId).lean();
    if (!autorizado || !autorizado.admin) {
      return res.status(400).json({
        message: "No estás autorizado para ver los detalles de los cobros",
      });
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

    // Obtener todos los clientes y sumar loanAmount y loanGain
    const clientes = await Clientes.find().lean();
    const fechaHoy = moment().startOf("day");
    let totalLoanAmount = 0;
    let totalLoanGain = 0;
    let totalLoanAmountHoy = 0;
    let totalLoanGainHoy = 0;

    clientes.forEach((cliente) => {
      totalLoanAmount += cliente.loanAmount || 0;
      totalLoanGain += cliente.loangain || 0;

      const LoanDate = new Date(cliente.loanDate);
      const LoanDateISO = LoanDate.toISOString().split("T")[0];
      if (LoanDateISO === hoyM) {
        totalLoanAmountHoy += cliente.loanAmount || 0;
        totalLoanGainHoy += cliente.loangain || 0;
      }
    });

    // Obtener todos los pagos y sumar ValorCobrado
    const pagos = await Pagos.find().lean();
    let totalValorCobrado = 0;
    let totalValorCobradoHoy = 0;

    pagos.forEach((pago) => {
      totalValorCobrado += pago.ValorCobrado || 0;

      const fechaDelPago = new Date(pago.FechaDelPago);
      const fechaDelPagoISO = fechaDelPago.toISOString().split("T")[0];
      if (fechaDelPagoISO === hoyM) {
        totalValorCobradoHoy += pago.ValorCobrado || 0;
      }
    });

    // Calcular cuánto falta por cobrar

    const TotalPrestado = totalLoanAmount + totalValorCobrado;
    const totalPendienteCobro = TotalPrestado - totalValorCobrado;

    const resultado = {
      TotalPrestado: TotalPrestado,
      totalLoanGain: totalLoanGain,
      totalValorCobrado: totalValorCobrado,
      totalPendienteCobro: totalPendienteCobro,
      totalLoanAmountHoy: totalLoanAmountHoy,
      totalLoanGainHoy: totalLoanGainHoy,
      totalValorCobradoHoy: totalValorCobradoHoy,
    };

    return res.json(resultado);
  } catch (error) {
    console.error("Error al calcular el inventario de pagos:", error);
    return res.status(500).json({ message: "Error al buscar los pagos" });
  }
};

PagosCtrl.Rendimiento = async (req, res) => {
  try {
    const userId = req.params.userId;

    const pagos = await Pagos.find({ idUsuario: userId }).lean();

    res.json({ pagos });
  } catch (error) {
    res.status(500).json({ message: "Error al buscar los pagos" });
  }
};

PagosCtrl.MisPagos = async (req, res) => {
  let errors = [];
  const identificacion = req.body.identificacion;

  if (!identificacion) {
    errors.push({ text: "Ingrese su numero de documento" });
  }

  if (errors.length > 0) {
    res.render("index", {
      errors,
    });
    return;
  } else {
    try {
      const user = await Clientes.findOne({
        identification: identificacion,
      }).lean();

      if (!user) {
        errors.push({ text: "Cliente no encontrado" });
      }
      if (errors.length > 0) {
        res.render("index", {
          errors,
        });
        return;
      }
      const mispagos = await Pagos.find({
        identification: identificacion,
        finalizado: false,
      }).lean();

      // Calcular la suma total de los pagos
      const totalPagos = mispagos.reduce(
        (sum, pago) => sum + pago.ValorCobrado,
        0
      );

      // Formatear el total de pagos
      const totalPagosFormateado =
        new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(totalPagos) + " $";

      // Formatear fechas y valores monetarios
      const pagosFormateados = mispagos.map((pago, index) => ({
        ...pago,
        numero: index + 1,
        FechaDelPago: pago.FechaDelPago.toISOString().split("T")[0], // YYYY-MM-DD
        FechaVencimiento: pago.FechaVencimiento.toISOString().split("T")[0], // YYYY-MM-DD
        ValorCobrado: new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(pago.ValorCobrado),
      }));

      const cliente = await Clientes.find({
        identification: identificacion,
      }).lean();

      const clienteFormateados = cliente.map((cliente) => ({
        ...cliente,
        loanDate: cliente.loanDate.toISOString().split("T")[0], // YYYY-MM-DD
        LastPaymentDate: cliente.LastPaymentDate.toISOString().split("T")[0], // YYYY-MM-DD
        NextPaymentDate: cliente.NextPaymentDate.toISOString().split("T")[0], // YYYY-MM-DD
        loanAmount: new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(cliente.loanAmount),
      }));

      res.render("Pagos", {
        mispagos: pagosFormateados,
        cliente: clienteFormateados,
        totalPagosFormateado,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error al obtener tus pagos");
    }
  }
};

PagosCtrl.GenerarPdfClientes = async (req, res) => {
  const { _id } = req.body;

  try {
    // Obtener la información del cliente y sus pagos
    const cliente = await Clientes.findById(_id);
    const pagos = await Pagos.find({ idCliente: _id, finalizado: false }).lean();

    if (!cliente) {
      return res.status(404).json({ mensaje: "Cliente no encontrado" });
    }

    // Crear el documento PDF
    const doc = new PDFDocument({ margin: 50 });
    const fileName = `Pagos_${cliente.name}.pdf`;
    res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    // Estilos generales
    const primaryColor = "#004aad"; // Azul corporativo
    const secondaryColor = "#333333"; // Gris oscuro
    const accentColor = "#f0f0f0"; // Fondo suave

    // Fondo del encabezado
    doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

    // Cargar imagen desde la URL de Cloudinary
    const logoUrl =
      "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
    const response = await axios.get(logoUrl, { responseType: "arraybuffer" });
    const logoImage = Buffer.from(response.data, "binary");

    // Logo y encabezado
    doc.image(logoImage, 25, 25, {
      width: 130,
      height: 70,
    });

    // Información del cliente
    doc
      .fillColor(secondaryColor)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text("Certificación de Pagos", 50, 120);

    doc
      .fontSize(12)
      .font("Helvetica")
      .fillColor(secondaryColor)
      .text(
        `Pagos realizados por ${cliente.name} (ID: ${cliente.identification})`,
        50,
        140
      );

    // Sección de historial de pagos
    doc
      .fillColor(primaryColor)
      .fontSize(14)
      .font("Helvetica-Bold")
      .text("Historial de Pagos:", 50, 180, { underline: true });

    // Espaciado y coordenadas
    const tableTop = 200;
    const itemSpacing = 25;
    const rowHeight = 20;
    const pageBottomMargin = 50;

    // Cabecera de la tabla con fondo
    const drawTableHeader = (y) => {
      doc
        .rect(50, y - 5, doc.page.width - 100, rowHeight)
        .fill(accentColor)
        .stroke();

      doc
        .fillColor(primaryColor)
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("Fecha de Pago", 60, y);
      doc.text("Vencimiento", 160, y);
      doc.text("Cobrador", 270, y);
      doc.text("Valor Cobrado", 450, y, { align: "right" });
    };

    drawTableHeader(tableTop);

    // Formateador de moneda
    const currencyFormatter = new Intl.NumberFormat("es-ES", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    let totalPagos = 0;
    let y = tableTop + rowHeight;

    pagos.forEach((pago, index) => {
      // Verificar si hay suficiente espacio en la página actual
      if (y + itemSpacing > doc.page.height - pageBottomMargin) {
        doc.addPage();
        y = 50; // Reiniciar la coordenada Y
        drawTableHeader(y); // Redibujar la cabecera en la nueva página
        y += rowHeight; // Espacio después del encabezado
      }

      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
      doc.text(pago.FechaVencimiento.toLocaleDateString(), 160, y);
      doc.text(pago.nameCobrador, 270, y, { width: 160, align: "left" });
      doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 450, y, {
        width: 100,
        align: "right",
      });

      y += rowHeight; // Mover a la siguiente fila
      totalPagos += pago.ValorCobrado;
    });

    // Total de pagos con estilo
    const totalText = `Total Pagado: ${currencyFormatter.format(totalPagos)} $`;
    const textWidth = doc.widthOfString(totalText);
    const pageWidth = doc.page.width;
    const centerX = (pageWidth - textWidth) / 2;

    // Comprobar si hay espacio para el total en la página actual
    if (y + 30 > doc.page.height - pageBottomMargin) {
      doc.addPage();
      y = 50;
    }

    doc
      .fillColor(primaryColor)
      .fontSize(16)
      .font("Helvetica-Bold")
      .text(totalText, centerX, y + 20, { align: "center" });

    // Finalizar el documento
    doc.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al generar el PDF" });
  }
};

PagosCtrl.GenerarPdfAdmin = async (req, res) => {
  const { Filtro, identificacion, FechaBusqueda, userId } = req.query;
  console.log(req.query);

  try {
    console.log("Hola");
    const user = await Users.findById(userId).lean();
    console.log(user);
    if (!user.admin) {
      return res.status(401).json({
        message: "No estas autorizado para generar PDF",
      });
    }

    if (Filtro && !identificacion && !FechaBusqueda) {
      const meses = {
        enero: 1,
        febrero: 2,
        marzo: 3,
        abril: 4,
        mayo: 5,
        junio: 6,
        julio: 7,
        agosto: 8,
        septiembre: 9,
        octubre: 10,
        noviembre: 11,
        diciembre: 12,
      };
      const hoy = moment().format("YYYY-MM-DD");
      const ayer = moment().subtract(1, "days").format("YYYY-MM-DD");

      const inicioSemana = moment().startOf("isoWeek");
      const finSemana = moment().endOf("isoWeek").toDate();
      const inicioSemanaPasada = moment()
        .subtract(1, "week")
        .startOf("isoWeek");
      const finSemanaPasada = moment().subtract(1, "week").endOf("isoWeek");

      const mesActual = moment().format("MMMM");
      const mesAnterior = moment().subtract(1, "month").format("MMMM");

      if (Filtro == "Hoy") {
        const pagos = await Pagos.find({ FechaDelPago: hoy }).lean();
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Cobros_${Filtro}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos generales
        const primaryColor = "#004aad"; // Azul corporativo
        const secondaryColor = "#333333"; // Gris oscuro
        const accentColor = "#f0f0f0"; // Fondo suave

        // Fondo del encabezado
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Cargar imagen desde la URL de Cloudinary
        const logoUrl =
          "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
        const response = await axios.get(logoUrl, {
          responseType: "arraybuffer",
        });
        const logoImage = Buffer.from(response.data, "binary");

        // Logo y encabezado
        doc.image(logoImage, 25, 25, {
          width: 130,
          height: 70,
        });

        // Información del cliente
        doc
          .fillColor(secondaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Certificación de Cobros", 50, 120);

        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`Cobros realizados el dia de hoy con fecha: ${hoy}`, 50, 140);

        // Sección de historial de pagos
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Historial de Pagos:", 50, 180, { underline: true });

        // Espaciado y coordenadas
        const tableTop = 200;
        const itemSpacing = 25;
        const rowHeight = 20;
        const pageBottomMargin = 50;

        // Cabecera de la tabla con fondo
        const drawTableHeader = (y) => {
          doc
            .rect(50, y - 5, doc.page.width - 70, rowHeight)
            .fill(accentColor)
            .stroke();
  
          doc
            .fillColor(primaryColor)
            .fontSize(10) // Reducir el tamaño de la letra en la cabecera
            .font("Helvetica-Bold")
            .text("Fecha de Pago", 60, y);
          doc.text("Vencimiento", 140, y);
          doc.text("Cliente", 250, y);
          doc.text("Cobrador", 380, y);
          doc.text("Cobrado", 500, y, { align: "right" });
        };

        drawTableHeader(tableTop);

        // Formateador de moneda
        const currencyFormatter = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        let totalPagos = 0;
        let y = tableTop + rowHeight;

        pagos.forEach((pago, index) => {
          if (y + itemSpacing > doc.page.height - pageBottomMargin) {
            doc.addPage();
            y = 50;
            drawTableHeader(y);
            y += rowHeight;
          }
  
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
          doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
          doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
          doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
          doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
            width: 100,
            align: "right",
          });
  
          y += rowHeight;
          totalPagos += pago.ValorCobrado;
        });

        // Total de pagos con estilo
        const totalText = `Total Cobros: ${currencyFormatter.format(
          totalPagos
        )} $`;
        const textWidth = doc.widthOfString(totalText);
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - textWidth) / 2;

        // Comprobar si hay espacio para el total en la página actual
        if (y + 30 > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(totalText, centerX, y + 20, { align: "center" });

        // Finalizar el documento
        doc.end();
      }
      if (Filtro == "Ayer") {
        const pagos = await Pagos.find({ FechaDelPago: ayer }).lean();
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Cobros_${Filtro}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos generales
        const primaryColor = "#004aad"; // Azul corporativo
        const secondaryColor = "#333333"; // Gris oscuro
        const accentColor = "#f0f0f0"; // Fondo suave

        // Fondo del encabezado
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Cargar imagen desde la URL de Cloudinary
        const logoUrl =
          "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
        const response = await axios.get(logoUrl, {
          responseType: "arraybuffer",
        });
        const logoImage = Buffer.from(response.data, "binary");

        // Logo y encabezado
        doc.image(logoImage, 25, 25, {
          width: 130,
          height: 70,
        });

        // Información del cliente
        doc
          .fillColor(secondaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Certificación de Pagos", 50, 120);

        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`Cobros realizados el dia de ayer con fecha: ${ayer}`, 50, 140);

        // Sección de historial de pagos
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Historial de Pagos:", 50, 180, { underline: true });

        // Espaciado y coordenadas
        const tableTop = 200;
        const itemSpacing = 25;
        const rowHeight = 20;
        const pageBottomMargin = 50;

        // Cabecera de la tabla con fondo
        const drawTableHeader = (y) => {
          doc
            .rect(50, y - 5, doc.page.width - 70, rowHeight)
            .fill(accentColor)
            .stroke();
  
          doc
            .fillColor(primaryColor)
            .fontSize(10) // Reducir el tamaño de la letra en la cabecera
            .font("Helvetica-Bold")
            .text("Fecha de Pago", 60, y);
          doc.text("Vencimiento", 140, y);
          doc.text("Cliente", 250, y);
          doc.text("Cobrador", 380, y);
          doc.text("Cobrado", 500, y, { align: "right" });
        };

        drawTableHeader(tableTop);

        // Formateador de moneda
        const currencyFormatter = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        let totalPagos = 0;
        let y = tableTop + rowHeight;

        pagos.forEach((pago, index) => {
          if (y + itemSpacing > doc.page.height - pageBottomMargin) {
            doc.addPage();
            y = 50;
            drawTableHeader(y);
            y += rowHeight;
          }
  
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
          doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
          doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
          doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
          doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
            width: 100,
            align: "right",
          });
  
          y += rowHeight;
          totalPagos += pago.ValorCobrado;
        });

        // Total de pagos con estilo
        const totalText = `Total Cobros: ${currencyFormatter.format(
          totalPagos
        )} $`;
        const textWidth = doc.widthOfString(totalText);
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - textWidth) / 2;

        // Comprobar si hay espacio para el total en la página actual
        if (y + 30 > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(totalText, centerX, y + 20, { align: "center" });

        // Finalizar el documento
        doc.end();
      }
      if (Filtro == "Esta semana") {
        const pagos = await Pagos.find({
          FechaDelPago: { $gte: inicioSemana, $lte: finSemana },
        }).lean();
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Cobros_${Filtro}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos generales
        const primaryColor = "#004aad"; // Azul corporativo
        const secondaryColor = "#333333"; // Gris oscuro
        const accentColor = "#f0f0f0"; // Fondo suave

        // Fondo del encabezado
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Cargar imagen desde la URL de Cloudinary
        const logoUrl =
          "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
        const response = await axios.get(logoUrl, {
          responseType: "arraybuffer",
        });
        const logoImage = Buffer.from(response.data, "binary");

        // Logo y encabezado
        doc.image(logoImage, 25, 25, {
          width: 130,
          height: 70,
        });

        // Información del cliente
        doc
          .fillColor(secondaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Certificación de Pagos", 50, 120);

        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`Cobros realizados esta semana`, 50, 140);

        // Sección de historial de pagos
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Historial de Pagos:", 50, 180, { underline: true });

        // Espaciado y coordenadas
        const tableTop = 200;
        const itemSpacing = 25;
        const rowHeight = 20;
        const pageBottomMargin = 50;

        // Cabecera de la tabla con fondo
        const drawTableHeader = (y) => {
          doc
            .rect(50, y - 5, doc.page.width - 70, rowHeight)
            .fill(accentColor)
            .stroke();
  
          doc
            .fillColor(primaryColor)
            .fontSize(10) // Reducir el tamaño de la letra en la cabecera
            .font("Helvetica-Bold")
            .text("Fecha de Pago", 60, y);
          doc.text("Vencimiento", 140, y);
          doc.text("Cliente", 250, y);
          doc.text("Cobrador", 380, y);
          doc.text("Cobrado", 500, y, { align: "right" });
        };

        drawTableHeader(tableTop);

        // Formateador de moneda
        const currencyFormatter = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        let totalPagos = 0;
        let y = tableTop + rowHeight;

        pagos.forEach((pago, index) => {
          if (y + itemSpacing > doc.page.height - pageBottomMargin) {
            doc.addPage();
            y = 50;
            drawTableHeader(y);
            y += rowHeight;
          }
  
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
          doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
          doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
          doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
          doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
            width: 100,
            align: "right",
          });
  
          y += rowHeight;
          totalPagos += pago.ValorCobrado;
        });

        // Total de pagos con estilo
        const totalText = `Total Cobros: ${currencyFormatter.format(
          totalPagos
        )} $`;
        const textWidth = doc.widthOfString(totalText);
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - textWidth) / 2;

        // Comprobar si hay espacio para el total en la página actual
        if (y + 30 > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(totalText, centerX, y + 20, { align: "center" });

        // Finalizar el documento
        doc.end();
      }
      if (Filtro == "Semana pasada") {
        const pagos = await Pagos.find({
          FechaDelPago: { $gte: inicioSemanaPasada, $lte: finSemanaPasada },
        }).lean();
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Cobros_${Filtro}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos generales
        const primaryColor = "#004aad"; // Azul corporativo
        const secondaryColor = "#333333"; // Gris oscuro
        const accentColor = "#f0f0f0"; // Fondo suave

        // Fondo del encabezado
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Cargar imagen desde la URL de Cloudinary
        const logoUrl =
          "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
        const response = await axios.get(logoUrl, {
          responseType: "arraybuffer",
        });
        const logoImage = Buffer.from(response.data, "binary");

        // Logo y encabezado
        doc.image(logoImage, 25, 25, {
          width: 130,
          height: 70,
        });

        // Información del cliente
        doc
          .fillColor(secondaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Certificación de Pagos", 50, 120);

        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`Cobros realizados la semana pasada`, 50, 140);

        // Sección de historial de pagos
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Historial de Pagos:", 50, 180, { underline: true });

        // Espaciado y coordenadas
        const tableTop = 200;
        const itemSpacing = 25;
        const rowHeight = 20;
        const pageBottomMargin = 50;

        // Cabecera de la tabla con fondo
        const drawTableHeader = (y) => {
          doc
            .rect(50, y - 5, doc.page.width - 70, rowHeight)
            .fill(accentColor)
            .stroke();
  
          doc
            .fillColor(primaryColor)
            .fontSize(10) // Reducir el tamaño de la letra en la cabecera
            .font("Helvetica-Bold")
            .text("Fecha de Pago", 60, y);
          doc.text("Vencimiento", 140, y);
          doc.text("Cliente", 250, y);
          doc.text("Cobrador", 380, y);
          doc.text("Cobrado", 500, y, { align: "right" });
        };

        drawTableHeader(tableTop);

        // Formateador de moneda
        const currencyFormatter = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        let totalPagos = 0;
        let y = tableTop + rowHeight;

        pagos.forEach((pago, index) => {
          if (y + itemSpacing > doc.page.height - pageBottomMargin) {
            doc.addPage();
            y = 50;
            drawTableHeader(y);
            y += rowHeight;
          }
  
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
          doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
          doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
          doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
          doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
            width: 100,
            align: "right",
          });
  
          y += rowHeight;
          totalPagos += pago.ValorCobrado;
        });

        // Total de pagos con estilo
        const totalText = `Total Cobros: ${currencyFormatter.format(
          totalPagos
        )} $`;
        const textWidth = doc.widthOfString(totalText);
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - textWidth) / 2;

        // Comprobar si hay espacio para el total en la página actual
        if (y + 30 > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(totalText, centerX, y + 20, { align: "center" });

        // Finalizar el documento
        doc.end();
      }
      if (Filtro == mesActual) {
        const mesActual = meses[Filtro];
        const pagos = await Pagos.find({
          $expr: { $eq: [{ $month: "$FechaDelPago" }, mesActual] },
        }).lean();
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Cobros_${Filtro}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos generales
        const primaryColor = "#004aad"; // Azul corporativo
        const secondaryColor = "#333333"; // Gris oscuro
        const accentColor = "#f0f0f0"; // Fondo suave

        // Fondo del encabezado
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Cargar imagen desde la URL de Cloudinary
        const logoUrl =
          "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
        const response = await axios.get(logoUrl, {
          responseType: "arraybuffer",
        });
        const logoImage = Buffer.from(response.data, "binary");

        // Logo y encabezado
        doc.image(logoImage, 25, 25, {
          width: 130,
          height: 70,
        });

        // Información del cliente
        doc
          .fillColor(secondaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Certificación de Pagos", 50, 120);

        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`Cobros realizados en el mes de ${Filtro}`, 50, 140);

        // Sección de historial de pagos
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Historial de Pagos:", 50, 180, { underline: true });

        // Espaciado y coordenadas
        const tableTop = 200;
        const itemSpacing = 25;
        const rowHeight = 20;
        const pageBottomMargin = 50;

        // Cabecera de la tabla con fondo
        const drawTableHeader = (y) => {
          doc
            .rect(50, y - 5, doc.page.width - 70, rowHeight)
            .fill(accentColor)
            .stroke();
  
          doc
            .fillColor(primaryColor)
            .fontSize(10) // Reducir el tamaño de la letra en la cabecera
            .font("Helvetica-Bold")
            .text("Fecha de Pago", 60, y);
          doc.text("Vencimiento", 140, y);
          doc.text("Cliente", 250, y);
          doc.text("Cobrador", 380, y);
          doc.text("Cobrado", 500, y, { align: "right" });
        };

        drawTableHeader(tableTop);

        // Formateador de moneda
        const currencyFormatter = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        let totalPagos = 0;
        let y = tableTop + rowHeight;

        pagos.forEach((pago, index) => {
          if (y + itemSpacing > doc.page.height - pageBottomMargin) {
            doc.addPage();
            y = 50;
            drawTableHeader(y);
            y += rowHeight;
          }
  
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
          doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
          doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
          doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
          doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
            width: 100,
            align: "right",
          });
  
          y += rowHeight;
          totalPagos += pago.ValorCobrado;
        });

        // Total de pagos con estilo
        const totalText = `Total Cobros: ${currencyFormatter.format(
          totalPagos
        )} $`;
        const textWidth = doc.widthOfString(totalText);
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - textWidth) / 2;

        // Comprobar si hay espacio para el total en la página actual
        if (y + 30 > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(totalText, centerX, y + 20, { align: "center" });

        // Finalizar el documento
        doc.end();
      }
      if (Filtro == mesAnterior) {
        const mesAnterior = meses[Filtro];
        const pagos = await Pagos.find({
          $expr: { $eq: [{ $month: "$FechaDelPago" }, mesAnterior] },
        }).lean();
        // Crear el documento PDF
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `Cobros_${Filtro}.pdf`;
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=${fileName}`
        );
        res.setHeader("Content-Type", "application/pdf");
        doc.pipe(res);

        // Estilos generales
        const primaryColor = "#004aad"; // Azul corporativo
        const secondaryColor = "#333333"; // Gris oscuro
        const accentColor = "#f0f0f0"; // Fondo suave

        // Fondo del encabezado
        doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

        // Cargar imagen desde la URL de Cloudinary
        const logoUrl =
          "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
        const response = await axios.get(logoUrl, {
          responseType: "arraybuffer",
        });
        const logoImage = Buffer.from(response.data, "binary");

        // Logo y encabezado
        doc.image(logoImage, 25, 25, {
          width: 130,
          height: 70,
        });

        // Información del cliente
        doc
          .fillColor(secondaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text("Certificación de Pagos", 50, 120);

        doc
          .fontSize(12)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(`Cobros realizados en el mes de ${Filtro}`, 50, 140);

        // Sección de historial de pagos
        doc
          .fillColor(primaryColor)
          .fontSize(14)
          .font("Helvetica-Bold")
          .text("Historial de Pagos:", 50, 180, { underline: true });

        // Espaciado y coordenadas
        const tableTop = 200;
        const itemSpacing = 25;
        const rowHeight = 20;
        const pageBottomMargin = 50;

        // Cabecera de la tabla con fondo
        const drawTableHeader = (y) => {
          doc
            .rect(50, y - 5, doc.page.width - 70, rowHeight)
            .fill(accentColor)
            .stroke();
  
          doc
            .fillColor(primaryColor)
            .fontSize(10) // Reducir el tamaño de la letra en la cabecera
            .font("Helvetica-Bold")
            .text("Fecha de Pago", 60, y);
          doc.text("Vencimiento", 140, y);
          doc.text("Cliente", 250, y);
          doc.text("Cobrador", 380, y);
          doc.text("Cobrado", 500, y, { align: "right" });
        };

        drawTableHeader(tableTop);

        // Formateador de moneda
        const currencyFormatter = new Intl.NumberFormat("es-ES", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });

        let totalPagos = 0;
        let y = tableTop + rowHeight;

        pagos.forEach((pago, index) => {
          if (y + itemSpacing > doc.page.height - pageBottomMargin) {
            doc.addPage();
            y = 50;
            drawTableHeader(y);
            y += rowHeight;
          }
  
          doc
            .fontSize(11)
            .font("Helvetica")
            .fillColor(secondaryColor)
            .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
          doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
          doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
          doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
          doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
            width: 100,
            align: "right",
          });
  
          y += rowHeight;
          totalPagos += pago.ValorCobrado;
        });

        // Total de pagos con estilo
        const totalText = `Total Cobros: ${currencyFormatter.format(
          totalPagos
        )} $`;
        const textWidth = doc.widthOfString(totalText);
        const pageWidth = doc.page.width;
        const centerX = (pageWidth - textWidth) / 2;

        // Comprobar si hay espacio para el total en la página actual
        if (y + 30 > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
        }

        doc
          .fillColor(primaryColor)
          .fontSize(16)
          .font("Helvetica-Bold")
          .text(totalText, centerX, y + 20, { align: "center" });

        // Finalizar el documento
        doc.end();
      }
    }
    if (FechaBusqueda) {
      const pagos = await Pagos.find({ FechaDelPago: FechaBusqueda }).lean();
      // Crear el documento PDF
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `Cobros__Fecha${FechaBusqueda}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      // Estilos generales
      const primaryColor = "#004aad"; // Azul corporativo
      const secondaryColor = "#333333"; // Gris oscuro
      const accentColor = "#f0f0f0"; // Fondo suave

      // Fondo del encabezado
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

      // Cargar imagen desde la URL de Cloudinary
      const logoUrl =
        "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
      const response = await axios.get(logoUrl, {
        responseType: "arraybuffer",
      });
      const logoImage = Buffer.from(response.data, "binary");

      // Logo y encabezado
      doc.image(logoImage, 25, 25, {
        width: 130,
        height: 70,
      });

      // Información del cliente
      doc
        .fillColor(secondaryColor)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Certificación de Pagos", 50, 120);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(`Cobros realizados en la fecha: ${FechaBusqueda}`, 50, 140);

      // Sección de historial de pagos
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Historial de Pagos:", 50, 180, { underline: true });

      // Espaciado y coordenadas
      const tableTop = 200;
      const itemSpacing = 25;
      const rowHeight = 20;
      const pageBottomMargin = 50;

      // Cabecera de la tabla con fondo
      const drawTableHeader = (y) => {
        doc
          .rect(50, y - 5, doc.page.width - 70, rowHeight)
          .fill(accentColor)
          .stroke();

        doc
          .fillColor(primaryColor)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Fecha de Pago", 60, y);
        doc.text("Vencimiento", 140, y);
        doc.text("Cliente", 250, y);
        doc.text("Cobrador", 380, y);
        doc.text("Cobrado", 500, y, { align: "right" });
      };

      drawTableHeader(tableTop);

      // Formateador de moneda
      const currencyFormatter = new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      let totalPagos = 0;
      let y = tableTop + rowHeight;

      pagos.forEach((pago, index) => {
        if (y + itemSpacing > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
          drawTableHeader(y);
          y += rowHeight;
        }

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
        doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
        doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
        doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
        doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
          width: 100,
          align: "right",
        });

        y += rowHeight;
        totalPagos += pago.ValorCobrado;
      });

      // Total de pagos con estilo
      const totalText = `Total Cobros: ${currencyFormatter.format(
        totalPagos
      )} $`;
      const textWidth = doc.widthOfString(totalText);
      const pageWidth = doc.page.width;
      const centerX = (pageWidth - textWidth) / 2;

      // Comprobar si hay espacio para el total en la página actual
      if (y + 30 > doc.page.height - pageBottomMargin) {
        doc.addPage();
        y = 50;
      }

      doc
        .fillColor(primaryColor)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(totalText, centerX, y + 20, { align: "center" });

      // Finalizar el documento
      doc.end();
    }
    if (identificacion) {
      const pagos = await Pagos.find({
        $or: [
          { identification: Number(identificacion) },
          { identificationCobrador: Number(identificacion) },
        ],
      }).lean();
      // Crear el documento PDF
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `Cobros__Fecha${FechaBusqueda}.pdf`;
      res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
      res.setHeader("Content-Type", "application/pdf");
      doc.pipe(res);

      // Estilos generales
      const primaryColor = "#004aad"; // Azul corporativo
      const secondaryColor = "#333333"; // Gris oscuro
      const accentColor = "#f0f0f0"; // Fondo suave

      // Fondo del encabezado
      doc.rect(0, 0, doc.page.width, 100).fill(primaryColor);

      // Cargar imagen desde la URL de Cloudinary
      const logoUrl =
        "https://res.cloudinary.com/dbpcmxdx4/image/upload/v1740257596/CobroExpress/Logo2_jfko2m.png";
      const response = await axios.get(logoUrl, {
        responseType: "arraybuffer",
      });
      const logoImage = Buffer.from(response.data, "binary");

      // Logo y encabezado
      doc.image(logoImage, 25, 25, {
        width: 130,
        height: 70,
      });

      // Información del cliente
      doc
        .fillColor(secondaryColor)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Certificación de Pagos", 50, 120);

      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor(secondaryColor)
        .text(`Cobros realizados por la id(${identificacion})`, 50, 140);

      // Sección de historial de pagos
      doc
        .fillColor(primaryColor)
        .fontSize(14)
        .font("Helvetica-Bold")
        .text("Historial de Pagos:", 50, 180, { underline: true });

      // Espaciado y coordenadas
      const tableTop = 200;
      const itemSpacing = 25;
      const rowHeight = 20;
      const pageBottomMargin = 50;

      // Cabecera de la tabla con fondo
      const drawTableHeader = (y) => {
        doc
          .rect(50, y - 5, doc.page.width - 70, rowHeight)
          .fill(accentColor)
          .stroke();

        doc
          .fillColor(primaryColor)
          .fontSize(10) // Reducir el tamaño de la letra en la cabecera
          .font("Helvetica-Bold")
          .text("Fecha de Pago", 60, y);
        doc.text("Vencimiento", 140, y);
        doc.text("Cliente", 250, y);
        doc.text("Cobrador", 380, y);
        doc.text("Cobrado", 500, y, { align: "right" });
      };

      drawTableHeader(tableTop);

      // Formateador de moneda
      const currencyFormatter = new Intl.NumberFormat("es-ES", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      let totalPagos = 0;
      let y = tableTop + rowHeight;

      pagos.forEach((pago, index) => {
        if (y + itemSpacing > doc.page.height - pageBottomMargin) {
          doc.addPage();
          y = 50;
          drawTableHeader(y);
          y += rowHeight;
        }

        doc
          .fontSize(11)
          .font("Helvetica")
          .fillColor(secondaryColor)
          .text(pago.FechaDelPago.toLocaleDateString(), 60, y);
        doc.text(pago.FechaVencimiento.toLocaleDateString(), 145, y);
        doc.text(pago.nameCliente, 210, y, { width: 130, align: "left" });
        doc.text(pago.nameCobrador, 350, y, { width: 130, align: "left" });
        doc.text(`${currencyFormatter.format(pago.ValorCobrado)} $`, 480, y, {
          width: 100,
          align: "right",
        });

        y += rowHeight;
        totalPagos += pago.ValorCobrado;
      });

      // Total de pagos con estilo
      const totalText = `Total Cobros: ${currencyFormatter.format(
        totalPagos
      )} $`;
      const textWidth = doc.widthOfString(totalText);
      const pageWidth = doc.page.width;
      const centerX = (pageWidth - textWidth) / 2;

      // Comprobar si hay espacio para el total en la página actual
      if (y + 30 > doc.page.height - pageBottomMargin) {
        doc.addPage();
        y = 50;
      }

      doc
        .fillColor(primaryColor)
        .fontSize(16)
        .font("Helvetica-Bold")
        .text(totalText, centerX, y + 20, { align: "center" });

      // Finalizar el documento
      doc.end();
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al generar el PDF" });
  }
};

PagosCtrl.eliminarPago = async (req, res) => {
  const { pagoDelete, userId } = req.body;
  try {
    const admin = await Users.findById(userId).lean();
    if (!admin || !admin.admin) {
      return res.status(403).json({ message: "Acceso denegado." });
    }

    // Obtener el cliente antes de eliminarlo
    const pago = await Pagos.findByIdAndDelete(pagoDelete).lean();
    if (!pago) {
      return res.status(404).json({ message: "Pago no encontrado." });
    }
    res.status(200).json({ message: "Pago eliminado correctamente" });
  } catch (error) {
    console.error("Error en Eliminar pago:", error);
    res.status(500).json({ message: "Error en el servidor." });
  }
};

module.exports = PagosCtrl;
