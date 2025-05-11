import { Pagos, Prestamo, Clientes, Rutas } from '../models/index.js';
import { format, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { Op } from 'sequelize';

// Registrar un nuevo pago
export const registrarPago = async (req, res) => {
  try {
    const { prestamoId, monto, fecha, semana, montoAbonado } = req.body;
    
    // Validar campos obligatorios
    if (!prestamoId || !monto || !fecha || !semana) {
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
    
    // Calcular el estado del pago
    let estadoPago = 'a tiempo';
    const fechaPago = new Date(fecha);
    const fechaDebePagar = new Date(prestamo.fechaDeProximoPago);
    
    if (fechaPago > fechaDebePagar) {
      estadoPago = 'atrasado';
    }
    
    if (parseFloat(monto) < parseFloat(prestamo.cuota)) {
      estadoPago = 'parcial';
    }
    
    // Calcular total pagado
    const totalPagado = parseFloat(monto) + (montoAbonado ? parseFloat(montoAbonado) : 0);
    
    // Crear el pago
    const nuevoPago = await Pagos.create({
      prestamoId,
      monto,
      fecha: fechaPago,
      semana,
      montoAbonado: montoAbonado || 0,
      totalPagado,
      estadoPago
    });
    
    // Actualizar el préstamo
    const totalPagadoPrestamo = parseFloat(prestamo.totalPagado) + totalPagado;
    const abonadoPrestamo = parseFloat(prestamo.abonado) + (montoAbonado ? parseFloat(montoAbonado) : 0);
    
    // Calcular la próxima fecha de pago
    const fechaProximoPago = addWeeks(fechaPago, 1);
    
    // Actualizar semana, totalPagado, fechaUltimoPago, fechaProximoPago
    prestamo.semana = prestamo.semana + 1;
    prestamo.totalPagado = totalPagadoPrestamo;
    prestamo.abonado = abonadoPrestamo;
    prestamo.fechaDeUltimoPago = fechaPago;
    prestamo.fechaDeProximoPago = fechaProximoPago;
    
    // Actualizar estado del préstamo si ya está pagado
    if (totalPagadoPrestamo >= parseFloat(prestamo.totalApagar)) {
      prestamo.estado = 'pagado';
    } else if (estadoPago === 'atrasado' || estadoPago === 'parcial') {
      prestamo.estado = 'moroso';
    } else {
      prestamo.estado = 'activo';
    }
    
    await prestamo.save();
    
    res.status(201).json({
      pago: nuevoPago,
      prestamo: prestamo
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