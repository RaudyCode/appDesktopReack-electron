import { Pagos, Prestamo, Clientes, Rutas } from '../models/index.js';
import { format, addWeeks } from 'date-fns';
import es from 'date-fns/locale/es/index.js';
import { Op } from 'sequelize';

// Registrar un nuevo pago
export const registrarPago = async (req, res) => {
  try {
    const { prestamoId, monto, fecha, semana, montoAbonado, aplicarAAtraso, esLiquidacionTotal, saldoPendiente } = req.body;
    
    // Debug the received data
    console.log("Datos recibidos en registrarPago:", {
      prestamoId, 
      monto, 
      fecha, 
      semana, 
      montoAbonado,
      tipo_monto: typeof monto,
      tipo_prestamoId: typeof prestamoId,
      tipo_fecha: typeof fecha,
      tipo_semana: typeof semana
    });
    
    // Validar campos obligatorios - mejor validación para cada campo
    if (!prestamoId) {
      return res.status(400).json({ error: 'El ID del préstamo es obligatorio' });
    }
    
    if (monto === undefined || monto === null || monto === '') {
      return res.status(400).json({ error: 'El monto del pago es obligatorio' });
    }
    
    if (!fecha) {
      return res.status(400).json({ error: 'La fecha del pago es obligatoria' });
    }
    
    if (semana === undefined || semana === null) {
      return res.status(400).json({ error: 'La semana del pago es obligatoria' });
    }
    
    // Asegurarse que el monto sea mayor que cero y sea un número válido
    const montoNumerico = Number(monto);
    if (isNaN(montoNumerico) || montoNumerico <= 0) {
      return res.status(400).json({ error: 'El monto debe ser un número mayor que cero' });
    }
    
    // Asegurarse que la semana sea un número válido
    let semanaNumerico;
    try {
      semanaNumerico = Number(semana);
      if (isNaN(semanaNumerico)) {
        throw new Error("La semana no es un número válido");
      }
    } catch (error) {
      console.error("Error al convertir semana a número:", semana, error);
      return res.status(400).json({ error: 'La semana debe ser un número válido' });
    }
    
    if (semanaNumerico <= 0) {
      return res.status(400).json({ error: 'La semana debe ser mayor que cero' });
    }
    
    const usuarioId = req.usuario.id;
    
    // Verificar que el préstamo exista y pertenezca al usuario
    const prestamo = await Prestamo.findOne({
      where: { id: prestamoId },
      include: [{
        model: Clientes,
        include: [{
          model: Rutas,
          where: { usuarioId }
        }]
      }]
    });
    
    if (!prestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }

    // Verificar si es una liquidación total del préstamo
    const totalPagadoActual = parseFloat(prestamo.totalPagado || 0);
    const totalAPagar = parseFloat(prestamo.totalApagar || prestamo.monto * 1.3);
    const montoIngresado = parseFloat(monto) + (montoAbonado ? parseFloat(montoAbonado) : 0);
    
    // Es liquidación si el monto ingresado más lo ya pagado supera o iguala el total a pagar
    const esLiquidacionCompleta = esLiquidacionTotal || (totalPagadoActual + montoIngresado >= totalAPagar);
    
    if (esLiquidacionCompleta) {
      console.log('Procesando liquidación total del préstamo');
      
      // Calcular las semanas restantes desde la semana actual hasta el final del plazo
      const semanasRestantes = prestamo.plazo - prestamo.semana + 1; // +1 para incluir la semana actual
      
      if (semanasRestantes > 0) {
        console.log(`Hay ${semanasRestantes} semanas restantes por registrar`);
        
        // Obtener todos los pagos existentes para no duplicar
        const pagosExistentes = await Pagos.findAll({
          where: { prestamoId },
          attributes: ['semana']
        });
        
        const semanasYaPagadas = pagosExistentes.map(p => p.semana);
        const pagosRegistrados = [];
        
        // Registrar el pago de la semana actual primero
        let fechaPago = new Date(fecha);
        
        // Si la semana actual no está pagada, registrarla
        if (!semanasYaPagadas.includes(semana)) {
          // Calcular total pagado
          const totalPagado = parseFloat(monto) + (montoAbonado ? parseFloat(montoAbonado) : 0);
          
          // Crear el pago para la semana actual
          const nuevoPago = await Pagos.create({
            prestamoId,
            monto: parseFloat(monto),
            fecha: fechaPago,
            semana,
            montoAbonado: montoAbonado ? parseFloat(montoAbonado) : 0,
            totalPagado,
            estadoPago: 'a tiempo',
            esLiquidacionParcial: (semanasRestantes > 1) // Es parte de una liquidación multi-semana
          });
          
          pagosRegistrados.push(nuevoPago);
        }
        
        // Distribuir el saldo pendiente en las semanas restantes
        if (semanasRestantes > 1) { // Si hay más semanas después de la actual
          // Calcular monto por semana para las semanas restantes (después de la actual)
          const montoPorSemanaRestante = Math.round((totalAPagar - totalPagadoActual - montoIngresado) / (semanasRestantes - 1) * 100) / 100;
          
          // Registrar pagos para cada semana restante
          for (let i = 1; i < semanasRestantes; i++) {
            const semanaActual = semana + i;
            
            // Verificar que esta semana no esté ya pagada
            if (!semanasYaPagadas.includes(semanaActual)) {
              // Calcular fecha para esta semana (una semana después de la anterior)
              fechaPago = new Date(fechaPago);
              fechaPago.setDate(fechaPago.getDate() + 7);
              
              // Para la última semana, ajustar el monto para que sume exactamente el total
              let montoSemana = montoPorSemanaRestante;
              if (i === semanasRestantes - 1) {
                // Calcular cuánto falta exactamente para completar el total
                const pagadoHastaAhora = totalPagadoActual + montoIngresado + (montoPorSemanaRestante * (i - 1));
                montoSemana = Math.round((totalAPagar - pagadoHastaAhora) * 100) / 100;
              }
              
              // Crear pago para esta semana
              const pagoCuota = await Pagos.create({
                prestamoId,
                monto: montoSemana,
                fecha: new Date(fechaPago),
                semana: semanaActual,
                montoAbonado: 0,
                totalPagado: montoSemana,
                estadoPago: 'a tiempo',
                esLiquidacionAutomatica: true
              });
              
              pagosRegistrados.push(pagoCuota);
            }
          }
        }
        
        // Actualizar el préstamo
        prestamo.estado = 'pagado';
        prestamo.semana = prestamo.plazo; // Marcar como completado
        prestamo.totalPagado = totalAPagar; // Establecer como pagado completamente
        
        // Incrementar contador de pagos a tiempo por cada pago registrado
        const pagosATiempo = prestamo.pagosATiempo || 0;
        prestamo.pagosATiempo = pagosATiempo + pagosRegistrados.length;
        
        await prestamo.save();
        
        // Actualizar cliente a estado activo si estaba moroso
        const cliente = await Clientes.findByPk(prestamo.clienteId);
        if (cliente && cliente.estado === 'moroso') {
          // Verificar si tiene otros préstamos morosos
          const otrosPrestamos = await Prestamo.findAll({
            where: { 
              clienteId: cliente.id,
              estado: 'moroso',
              id: { [Op.ne]: prestamo.id } // Excluir el préstamo actual
            }
          });
          
          if (otrosPrestamos.length === 0) {
            cliente.estado = 'activo';
            await cliente.save();
          }
        }
        
        // Devolver todos los pagos registrados junto con el préstamo actualizado
        return res.status(201).json({
          mensaje: `Liquidación total registrada. Se generaron ${pagosRegistrados.length} pagos para completar el préstamo.`,
          pagos: pagosRegistrados,
          prestamo,
          esLiquidacionTotal: true
        });
      }
    }
    
    // Si no es liquidación total, continuar con el proceso normal
    // Verificar si se aplica a atrasos primero
    let atrasosLiquidados = 0;
    let atrasosPendientes = prestamo.atrasosNoPagados || 0;
    let montoAplicado = parseFloat(monto);
    let montoRestante = 0;
    
    if (aplicarAAtraso && atrasosPendientes > 0) {
      // Calcular cuántos atrasos se pueden liquidar con el monto pagado
      const montoPorAtraso = parseFloat(prestamo.cuota);
      const cuotasAtrasosAPagar = Math.floor(montoAplicado / montoPorAtraso);
      
      if (cuotasAtrasosAPagar > 0) {
        // Calcular cuántos atrasos se liquidarán
        atrasosLiquidados = Math.min(cuotasAtrasosAPagar, atrasosPendientes);
        atrasosPendientes = atrasosPendientes - atrasosLiquidados;
        
        // Calcular monto aplicado a atrasos y el posible monto restante
        const montoAplicadoAAtrasos = atrasosLiquidados * montoPorAtraso;
        montoRestante = montoAplicado - montoAplicadoAAtrasos;
        
        console.log(`Aplicando ${montoAplicadoAAtrasos} a ${atrasosLiquidados} atrasos. Monto restante: ${montoRestante}`);
        
        // Actualizar contadores de atrasos en el préstamo
        prestamo.atrasosNoPagados = atrasosPendientes;
        
        // Actualizar monto de atrasos pendientes
        if (prestamo.montoAtrasosNoPagados) {
          prestamo.montoAtrasosNoPagados = Math.max(0, prestamo.montoAtrasosNoPagados - montoAplicadoAAtrasos);
        }
        
        // Si todos los atrasos fueron liquidados, resetear contador de semanas consecutivas
        if (atrasosPendientes === 0) {
          prestamo.semanasConsecutivasAtraso = 0;
        }
      }
    }
    
    // Calcular el estado del pago
    let estadoPago = 'a tiempo';
    const fechaPago = new Date(fecha);
    const fechaDebePagar = new Date(prestamo.fechaDeProximoPago);
    
    if (fechaPago > fechaDebePagar) {
      estadoPago = 'atrasado';
    }
    
    // Si el monto es menor que la cuota, es parcial (excepto si es el último pago)
    let esParcial = false;
    if (parseFloat(monto) < parseFloat(prestamo.cuota)) {
      const saldoPendiente = (prestamo.totalApagar || prestamo.monto * 1.3) - (prestamo.totalPagado || 0);
      
      // Si no es liquidación total, marcar como parcial
      if (parseFloat(monto) < saldoPendiente) {
        esParcial = true;
        // Asegurarse de que el estado refleje el pago parcial correctamente
        if (estadoPago === 'atrasado') {
          estadoPago = 'atrasado y parcial';
        } else if (aplicarAAtraso) {
          estadoPago = 'fuera de tiempo y parcial';
        } else {
          estadoPago = 'parcial';
        }
        console.log(`Pago parcial detectado. Estado: ${estadoPago}`);
      }
    }
    
    // Calcular total pagado
    const totalPagado = parseFloat(monto) + (montoAbonado ? parseFloat(montoAbonado) : 0);
    
    // Crear el pago
    console.log("Creando registro de pago con los siguientes datos:");
    console.log("- prestamoId:", prestamoId, typeof prestamoId);
    console.log("- monto:", montoNumerico, typeof montoNumerico);
    console.log("- fecha:", fechaPago, typeof fechaPago);
    console.log("- semana:", semanaNumerico, typeof semanaNumerico);
    console.log("- montoAbonado:", montoAbonado ? Number(montoAbonado) : 0);
    console.log("- estadoPago:", estadoPago);
    
    const nuevoPago = await Pagos.create({
      prestamoId,
      monto: montoNumerico,
      fecha: fechaPago,
      semana: semanaNumerico,
      montoAbonado: montoAbonado ? Number(montoAbonado) : 0,
      totalPagado,
      estadoPago,
      atrasosLiquidados,
      montoRestante
    });
    
    console.log("Pago creado exitosamente:", nuevoPago.id);
    
    // Actualizar el préstamo
    const totalPagadoPrestamo = parseFloat(prestamo.totalPagado || 0) + totalPagado;
    const abonadoPrestamo = parseFloat(prestamo.abonado || 0) + (montoAbonado ? parseFloat(montoAbonado) : 0);
    
    // Calcular la próxima fecha de pago
    const fechaProximoPago = addWeeks(fechaPago, 1);
    
    // Actualizar semana, totalPagado, fechaUltimoPago, fechaProximoPago
    prestamo.semana = prestamo.semana + 1;
    prestamo.totalPagado = totalPagadoPrestamo;
    prestamo.abonado = abonadoPrestamo;
    prestamo.fechaDeUltimoPago = fechaPago;
    prestamo.fechaDeProximoPago = fechaProximoPago;
    
    // Actualizar contadores de pagos según su estado
    if (estadoPago === 'a tiempo') {
      // Incrementar contador de pagos a tiempo
      const pagosATiempo = prestamo.pagosATiempo || 0;
      prestamo.pagosATiempo = pagosATiempo + 1;
    } else if (estadoPago === 'atrasado') {
      // Incrementar contador de pagos atrasados
      const pagosAtrasados = prestamo.pagosAtrasados || 0;
      prestamo.pagosAtrasados = pagosAtrasados + 1;
    }
    
    // Si es un pago parcial, incrementar ese contador independientemente
    if (esParcial) {
      const pagosParciales = prestamo.pagosParciales || 0;
      prestamo.pagosParciales = pagosParciales + 1;
    }
    
    // Actualizar estado del préstamo
    if (totalPagadoPrestamo >= parseFloat(prestamo.totalApagar)) {
      prestamo.estado = 'pagado';
    } else if (atrasosPendientes > 0) {
      // Si todavía hay atrasos pendientes, mantener como moroso
      prestamo.estado = 'moroso';
    } else if (estadoPago === 'atrasado' || estadoPago === 'atrasado y parcial') {
      prestamo.estado = 'moroso';
    } else if (estadoPago === 'parcial') {
      // Si es parcial pero no hay atrasos, marcar como "con pagos parciales"
      prestamo.estado = 'con pagos parciales';
    } else {
      prestamo.estado = 'activo';
    }
    
    // Si pagó a tiempo y no hay atrasos pendientes, actualizar estado del cliente
    if (prestamo.estado === 'activo' || prestamo.estado === 'pagado') {
      const cliente = await Clientes.findByPk(prestamo.clienteId);
      if (cliente && cliente.estado === 'moroso') {
        cliente.estado = 'activo';
        await cliente.save();
      }
    }
    
    await prestamo.save();
    
    res.status(201).json({
      pago: nuevoPago,
      prestamo: prestamo,
      atrasosLiquidados,
      atrasosPendientes
    });
  } catch (error) {
    console.error('Error al registrar pago:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los pagos
export const obtenerPagos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    // Obtener pagos a través de las relaciones
    const pagos = await Pagos.findAll({
      include: [{
        model: Prestamo,
        include: [{
          model: Clientes,
          include: [{
            model: Rutas,
            where: { usuarioId }
          }]
        }]
      }],
      order: [['fecha', 'DESC']]
    });
    
    res.status(200).json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener pagos por préstamo
export const obtenerPagosPorPrestamo = async (req, res) => {
  try {
    const { prestamoId } = req.params;
    const usuarioId = req.usuario.id;
    
    // Verificar que el préstamo pertenezca al usuario
    const prestamo = await Prestamo.findOne({
      where: { id: prestamoId },
      include: [{
        model: Clientes,
        include: [{
          model: Rutas,
          where: { usuarioId }
        }]
      }]
    });
    
    if (!prestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    
    // Obtener los pagos del préstamo
    const pagos = await Pagos.findAll({
      where: { prestamoId },
      order: [['fecha', 'DESC']]
    });
    
    res.status(200).json(pagos);
  } catch (error) {
    console.error('Error al obtener pagos por préstamo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener un pago específico
export const obtenerPago = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Obtener el pago con verificación de pertenencia al usuario
    const pago = await Pagos.findOne({
      where: { id },
      include: [{
        model: Prestamo,
        include: [{
          model: Clientes,
          include: [{
            model: Rutas,
            where: { usuarioId }
          }]
        }]
      }]
    });
    
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    res.status(200).json(pago);
  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un pago
export const eliminarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Obtener el pago con verificación
    const pago = await Pagos.findOne({
      where: { id },
      include: [{
        model: Prestamo,
        include: [{
          model: Clientes,
          include: [{
            model: Rutas,
            where: { usuarioId }
          }]
        }]
      }]
    });
    
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Revertir los cambios en el préstamo
    const prestamo = await Prestamo.findByPk(pago.prestamoId);
    
    // Revertir total pagado y abonado
    prestamo.totalPagado = parseFloat(prestamo.totalPagado) - parseFloat(pago.totalPagado);
    prestamo.abonado = parseFloat(prestamo.abonado) - parseFloat(pago.montoAbonado);
    
    // Decrementar la semana
    prestamo.semana = prestamo.semana - 1;
    
    // Actualizar estado del préstamo
    if (prestamo.totalPagado <= 0) {
      prestamo.estado = 'activo';
    }
    
    await prestamo.save();
    
    // Eliminar el pago
    await pago.destroy();
    
    res.status(200).json({ mensaje: 'Pago eliminado correctamente', prestamo });
  } catch (error) {
    console.error('Error al eliminar pago:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generar un recibo para un pago específico
export const generarRecibo = async (req, res) => {
  try {
    const { pagoId } = req.params;
    const usuarioId = req.usuario.id;
    
    // Obtener el pago con todas las relaciones
    const pago = await Pagos.findOne({
      where: { id: pagoId },
      include: [{
        model: Prestamo,
        include: [{
          model: Clientes,
          include: [{
            model: Rutas,
            where: { usuarioId }
          }]
        }]
      }]
    });
    
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Formatear la fecha
    const fechaFormateada = format(new Date(pago.fecha), 'dd/MM/yyyy', { locale: es });
    
    // Crear objeto de recibo con toda la información necesaria
    const recibo = {
      numeroRecibo: `REC-${pago.id}`,
      fecha: fechaFormateada,
      cliente: {
        nombre: pago.Prestamo.Cliente.nombre,
        cedula: pago.Prestamo.Cliente.cedula,
        direccion: pago.Prestamo.Cliente.direccion
      },
      prestamo: {
        id: pago.Prestamo.id,
        monto: pago.Prestamo.monto,
        plazo: pago.Prestamo.plazo,
        cuota: pago.Prestamo.cuota,
        totalApagar: pago.Prestamo.totalApagar
      },
      pago: {
        monto: pago.monto,
        montoAbonado: pago.montoAbonado,
        totalPagado: pago.totalPagado,
        semana: pago.semana,
        estadoPago: pago.estadoPago
      },
      ruta: {
        nombre: pago.Prestamo.Cliente.Ruta.nombre
      }
    };
    
    res.status(200).json(recibo);
  } catch (error) {
    console.error('Error al generar recibo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Generar recibos para todos los pagos de una ruta en una fecha específica
export const generarRecibosRuta = async (req, res) => {
  try {
    const { rutaId } = req.params;
    const { fecha } = req.query;
    const usuarioId = req.usuario.id;
    
    // Verificar que la ruta pertenezca al usuario
    const ruta = await Rutas.findOne({
      where: { id: rutaId, usuarioId }
    });
    
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    // Preparar el filtro de fecha
    let fechaInicio, fechaFin;
    
    if (fecha) {
      fechaInicio = new Date(fecha);
      fechaFin = new Date(fecha);
      fechaFin.setHours(23, 59, 59, 999);
    } else {
      // Por defecto, usar la fecha actual
      fechaInicio = new Date();
      fechaInicio.setHours(0, 0, 0, 0);
      fechaFin = new Date();
      fechaFin.setHours(23, 59, 59, 999);
    }
    
    // Obtener todos los pagos de los clientes de la ruta en esa fecha
    const pagos = await Pagos.findAll({
      where: {
        fecha: {
          [Op.between]: [fechaInicio, fechaFin]
        }
      },
      include: [{
        model: Prestamo,
        include: [{
          model: Clientes,
          where: { rutaId },
          include: [{ model: Rutas }]
        }]
      }],
      order: [['fecha', 'DESC']]
    });
    
    // Formatear los recibos
    const recibos = pagos.map(pago => {
      const fechaFormateada = format(new Date(pago.fecha), 'dd/MM/yyyy', { locale: es });
      
      return {
        numeroRecibo: `REC-${pago.id}`,
        fecha: fechaFormateada,
        cliente: {
          nombre: pago.Prestamo.Cliente.nombre,
          cedula: pago.Prestamo.Cliente.cedula,
          direccion: pago.Prestamo.Cliente.direccion
        },
        prestamo: {
          id: pago.Prestamo.id,
          monto: pago.Prestamo.monto,
          plazo: pago.Prestamo.plazo,
          cuota: pago.Prestamo.cuota,
          totalApagar: pago.Prestamo.totalApagar
        },
        pago: {
          monto: pago.monto,
          montoAbonado: pago.montoAbonado,
          totalPagado: pago.totalPagado,
          semana: pago.semana,
          estadoPago: pago.estadoPago
        },
        ruta: {
          nombre: pago.Prestamo.Cliente.Ruta.nombre
        }
      };
    });
    
    res.status(200).json(recibos);
  } catch (error) {
    console.error('Error al generar recibos de ruta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Registrar un atraso (pago no realizado)
export const registrarAtraso = async (req, res) => {
  try {
    const { prestamoId, fecha, semana, fechaEsperada } = req.body;
    
    // Validar campos obligatorios
    if (!prestamoId || !fecha || !semana) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    const usuarioId = req.usuario.id;
    
    // Verificar que el préstamo exista y pertenezca al usuario
    const prestamo = await Prestamo.findOne({
      where: { id: prestamoId },
      include: [{
        model: Clientes,
        include: [{
          model: Rutas,
          where: { usuarioId }
        }]
      }]
    });
    
    if (!prestamo) {
      return res.status(404).json({ error: 'Préstamo no encontrado' });
    }
    
    // Verificar si ya existe un pago o atraso para esta semana
    const pagoExistente = await Pagos.findOne({
      where: { 
        prestamoId,
        semana
      }
    });
    
    if (pagoExistente) {
      return res.status(400).json({ 
        error: 'Ya existe un registro para esta semana',
        pago: pagoExistente
      });
    }
    
    // Crear el registro de atraso (pago de monto cero marcado como atrasado)
    const nuevoAtraso = await Pagos.create({
      prestamoId,
      monto: 0,
      fecha: new Date(fecha),
      semana,
      montoAbonado: 0,
      totalPagado: 0,
      estadoPago: 'atrasado',
      fechaEsperada: fechaEsperada ? new Date(fechaEsperada) : null,
      esRegistroAtraso: true
    });
    
    // Actualizar el préstamo con todos los parámetros relacionados con atrasos
    
    // 1. Incrementar contador de pagos atrasados (total acumulado histórico)
    const pagosAtrasados = prestamo.pagosAtrasados || 0;
    prestamo.pagosAtrasados = pagosAtrasados + 1;
    
    // 2. Incrementar contador de atrasos no pagados (atrasos actuales pendientes)
    const atrasosNoPagados = prestamo.atrasosNoPagados || 0;
    prestamo.atrasosNoPagados = atrasosNoPagados + 1;
    
    // 3. Calcular monto total de atrasos pendientes
    const cuota = parseFloat(prestamo.cuota);
    const montoAtrasosNoPagados = prestamo.montoAtrasosNoPagados || 0;
    prestamo.montoAtrasosNoPagados = montoAtrasosNoPagados + cuota;
    
    // 4. Actualizar semana actual
    prestamo.semana = prestamo.semana + 1;
    
    // 5. Mantener seguimiento de semanas consecutivas de atraso
    if (!prestamo.semanasConsecutivasAtraso) {
      prestamo.semanasConsecutivasAtraso = 1;
    } else {
      prestamo.semanasConsecutivasAtraso += 1;
    }
    
    // 6. Calcular la próxima fecha de pago
    const fechaProximoPago = addWeeks(new Date(fecha), 1);
    prestamo.fechaDeProximoPago = fechaProximoPago;
    
    // 7. Actualizar fecha del último registro de atraso
    prestamo.fechaUltimoAtraso = new Date(fecha);
    
    // 8. Marcar el préstamo como moroso
    prestamo.estado = 'moroso';
    
    // También actualizar el estado del cliente a moroso
    const cliente = await Clientes.findByPk(prestamo.clienteId);
    if (cliente) {
      cliente.estado = 'moroso';
      await cliente.save();
    }
    
    await prestamo.save();
    
    // Obtener el préstamo actualizado para asegurar que devolvemos los datos más recientes
    const prestamoActualizado = await Prestamo.findByPk(prestamo.id);
    
    // Log de verificación para el valor correcto de los contadores
    console.log('Préstamo actualizado:', {
      id: prestamoActualizado.id,
      pagosAtrasados: prestamoActualizado.pagosAtrasados,
      atrasosNoPagados: prestamoActualizado.atrasosNoPagados, 
      pagosATiempo: prestamoActualizado.pagosATiempo,
      montoAtrasosNoPagados: prestamoActualizado.montoAtrasosNoPagados,
      cuota: prestamoActualizado.cuota,
      estado: prestamoActualizado.estado
    });
    
    res.status(201).json({
      atraso: nuevoAtraso,
      prestamo: prestamoActualizado,
      mensaje: 'Atraso registrado correctamente'
    });
  } catch (error) {
    console.error('Error al registrar atraso:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un pago existente (especialmente útil para convertir atrasos en pagos)
export const actualizarPago = async (req, res) => {
  try {
    const { id } = req.params;
    const { monto, fecha, montoAbonado, estadoPago, actualizandoAtraso } = req.body;
    
    const usuarioId = req.usuario.id;
    
    // Verificar que el pago exista y pertenezca al usuario
    const pago = await Pagos.findOne({
      where: { id },
      include: [{
        model: Prestamo,
        include: [{
          model: Clientes,
          include: [{
            model: Rutas,
            where: { usuarioId }
          }]
        }]
      }]
    });
    
    if (!pago) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }
    
    // Obtener el préstamo asociado
    const prestamo = await Prestamo.findByPk(pago.prestamoId);
    
    // Si estamos actualizando un atraso a un pago normal
    if (actualizandoAtraso && pago.estadoPago === 'atrasado' && pago.monto === 0) {
      console.log(`Actualizando atraso a pago normal: ${id}`);
      
      // Calcular la diferencia en el total pagado
      const nuevoMonto = parseFloat(monto);
      const nuevoMontoAbonado = montoAbonado ? parseFloat(montoAbonado) : 0;
      const totalPagadoNuevo = nuevoMonto + nuevoMontoAbonado;
      
      // Actualizar el pago
      pago.monto = nuevoMonto;
      pago.fecha = new Date(fecha);
      pago.montoAbonado = nuevoMontoAbonado;
      pago.totalPagado = totalPagadoNuevo;
      pago.estadoPago = estadoPago || 'fuera de tiempo'; // Asegurarnos que sea 'fuera de tiempo'
      
      // Actualizar el préstamo
      const totalPagadoPrestamo = parseFloat(prestamo.totalPagado || 0) + totalPagadoNuevo;
      const abonadoPrestamo = parseFloat(prestamo.abonado || 0) + nuevoMontoAbonado;
      
      // Actualizar contadores en el préstamo
      prestamo.totalPagado = totalPagadoPrestamo;
      prestamo.abonado = abonadoPrestamo;
      
      // Decrementar atrasosNoPagados si estaba marcado como atraso
      if (prestamo.atrasosNoPagados && prestamo.atrasosNoPagados > 0) {
        prestamo.atrasosNoPagados -= 1;
      }
      
      // Actualizar montoAtrasosNoPagados
      if (prestamo.montoAtrasosNoPagados && prestamo.montoAtrasosNoPagados > 0) {
        prestamo.montoAtrasosNoPagados = Math.max(0, prestamo.montoAtrasosNoPagados - prestamo.cuota);
      }
      
      // Actualizar contadores de tipo de pago
      const pagosParciales = prestamo.pagosParciales || 0;
      if (nuevoMonto < prestamo.cuota) {
        // Es un pago parcial
        prestamo.pagosParciales = pagosParciales + 1;
      }
      
      // Actualizar estado del préstamo según el monto total pagado
      if (totalPagadoPrestamo >= parseFloat(prestamo.totalApagar)) {
        prestamo.estado = 'pagado';
      } else if (prestamo.atrasosNoPagados > 0) {
        // Si todavía hay atrasos pendientes, mantener como moroso
        prestamo.estado = 'moroso';
      } else {
        prestamo.estado = 'activo';
      }
      
      // Si ya no hay atrasos pendientes, actualizar estado del cliente
      if (prestamo.atrasosNoPagados === 0 && prestamo.estado !== 'moroso') {
        const cliente = await Clientes.findByPk(prestamo.clienteId);
        if (cliente && cliente.estado === 'moroso') {
          // Verificar si tiene otros préstamos morosos
          const otrosPrestamos = await Prestamo.findAll({
            where: { 
              clienteId: cliente.id,
              estado: 'moroso'
            }
          });
          
          if (otrosPrestamos.length === 0) {
            cliente.estado = 'activo';
            await cliente.save();
          }
        }
      }
      
      // Guardar los cambios
      await pago.save();
      await prestamo.save();
      
      res.status(200).json({ 
        mensaje: 'Pago actualizado correctamente',
        pago,
        prestamo
      });
    } else {
      // Actualización general de un pago
      pago.monto = parseFloat(monto);
      pago.fecha = new Date(fecha);
      pago.montoAbonado = montoAbonado ? parseFloat(montoAbonado) : 0;
      pago.totalPagado = parseFloat(monto) + (montoAbonado ? parseFloat(montoAbonado) : 0);
      pago.estadoPago = estadoPago || pago.estadoPago;
      
      await pago.save();
      
      res.status(200).json({ 
        mensaje: 'Pago actualizado correctamente',
        pago,
        prestamo
      });
    }
  } catch (error) {
    console.error('Error al actualizar pago:', error);
    res.status(500).json({ error: error.message });
  }
}; 