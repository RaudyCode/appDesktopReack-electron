import { Prestamo, Clientes, Rutas, Pagos } from '../models/index.js';
import { add, format } from 'date-fns';

// Crear un nuevo préstamo
export const crearPrestamo = async (req, res) => {
  try {
    const { 
      clienteId, 
      monto, 
      plazo, 
      fechaInicio,
      cuota
    } = req.body;
    
    // Validar campos obligatorios
    if (!clienteId || !monto || !plazo || !fechaInicio || !cuota) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Verificar que el cliente exista y pertenezca al usuario
    const usuarioId = req.usuario.id;
    const cliente = await Clientes.findOne({
      where: { id: clienteId },
      include: [{
        model: Rutas,
        where: { usuarioId }
      }]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Calcula la fecha de caducidad (fecha final del préstamo)
    const fechaInicioDate = new Date(fechaInicio);
    const fechaDeCaducidad = add(fechaInicioDate, { weeks: plazo });
    
    // Calcular total a pagar (monto * porcentaje de interés basado en plazo)
    // Esto es un ejemplo, ajustar según la lógica de negocio
    const totalApagar = parseFloat(monto) + (parseFloat(cuota) * plazo - parseFloat(monto));
    
    // Crear el préstamo
    const nuevoPrestamo = await Prestamo.create({
      clienteId,
      monto,
      plazo,
      cuota,
      semana: 1, // Inicia en la semana 1
      abonado: 0,
      totalApagar,
      totalPagado: 0,
      fechaInicio: fechaInicioDate,
      fechaDeCaducidad,
      fechaDeProximoPago: add(fechaInicioDate, { weeks: 1 }), // Primera cuota es una semana después
      estado: 'activo'
    });
    
    // Actualizar el estado del cliente si es necesario
    if (cliente.estado !== 'activo') {
      cliente.estado = 'activo';
      await cliente.save();
    }
    
    res.status(201).json(nuevoPrestamo);
  } catch (error) {
    console.error('Error al crear préstamo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los préstamos de los clientes del usuario
export const obtenerPrestamos = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    // Obtener préstamos a través de las relaciones
    const prestamos = await Prestamo.findAll({
      include: [{
        model: Clientes,
        attributes: ['id', 'nombre', 'cedula', 'telefono'],
        include: [{
          model: Rutas,
          where: { usuarioId },
          attributes: ['id', 'nombre']
        }]
      }],
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener préstamos por cliente
export const obtenerPrestamosPorCliente = async (req, res) => {
  try {
    const { clienteId } = req.params;
    const usuarioId = req.usuario.id;
    
    // Verificar que el cliente pertenezca al usuario
    const cliente = await Clientes.findOne({
      where: { id: clienteId },
      include: [{
        model: Rutas,
        where: { usuarioId }
      }]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Obtener los préstamos del cliente
    const prestamos = await Prestamo.findAll({
      where: { clienteId },
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json(prestamos);
  } catch (error) {
    console.error('Error al obtener préstamos por cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener un préstamo específico
export const obtenerPrestamo = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Obtener el préstamo con verificación de pertenencia al usuario
    const prestamo = await Prestamo.findOne({
      where: { id },
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
    
    res.status(200).json(prestamo);
  } catch (error) {
    console.error('Error al obtener préstamo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un préstamo
export const actualizarPrestamo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // Solo permitimos actualizar el estado por ahora
    const usuarioId = req.usuario.id;
    
    // Obtener el préstamo con verificación
    const prestamo = await Prestamo.findOne({
      where: { id },
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
    
    // Validar que el estado sea válido
    if (estado && !['activo', 'pagado', 'moroso'].includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }
    
    // Actualizar el estado si se proporciona
    if (estado) {
      prestamo.estado = estado;
      await prestamo.save();
    }
    
    res.status(200).json(prestamo);
  } catch (error) {
    console.error('Error al actualizar préstamo:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un préstamo
export const eliminarPrestamo = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Obtener el préstamo con verificación
    const prestamo = await Prestamo.findOne({
      where: { id },
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
    
    // Verificar si el préstamo tiene pagos asociados
    const pagosAsociados = await Pagos.count({
      where: { prestamoId: id }
    });
    
    if (pagosAsociados > 0) {
      return res.status(400).json({
        error: 'Este préstamo tiene pagos registrados. Para eliminar este préstamo, debe eliminar sus pagos primero.',
        pagosAsociados
      });
    }
    
    // Eliminar el préstamo
    await prestamo.destroy();
    
    res.status(200).json({ mensaje: 'Préstamo eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar préstamo:', error);
    res.status(500).json({ error: error.message });
  }
}; 