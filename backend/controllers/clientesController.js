import { Clientes, Rutas, Prestamo } from '../models/index.js';
import sequelize from '../config/db.js';

// Crear un nuevo cliente
export const crearCliente = async (req, res) => {
  try {
    const { idCliente, nombre, cedula, telefono, email, direccion, rutaId } = req.body;
    
    // Validar campos obligatorios
    if (!idCliente || !nombre || !cedula || !telefono || !direccion || !rutaId) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios excepto el email' });
    }
    
    // Verificar que la ruta exista y pertenezca al usuario
    const usuarioId = req.usuario.id;
    const ruta = await Rutas.findOne({
      where: { id: rutaId, usuarioId }
    });
    
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    // Verificar si ya existe un cliente con la misma cédula
    const clienteExistente = await Clientes.findOne({
      where: { cedula }
    });
    
    if (clienteExistente) {
      return res.status(400).json({ error: 'Ya existe un cliente con esa cédula' });
    }
    
    // Crear el cliente
    const nuevoCliente = await Clientes.create({
      idCliente,
      nombre,
      cedula,
      telefono,
      email,
      direccion,
      rutaId,
      fecha_registro: new Date(),
      estado: 'activo'
    });
    
    res.status(201).json(nuevoCliente);
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los clientes del usuario
export const obtenerClientes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    
    // Obtener todas las rutas del usuario
    const rutas = await Rutas.findAll({
      where: { usuarioId },
      attributes: ['id']
    });
    
    const rutasIds = rutas.map(ruta => ruta.id);
    
    // Obtener todos los clientes de esas rutas
    const clientes = await Clientes.findAll({
      where: { rutaId: rutasIds },
      include: [{ model: Rutas, attributes: ['nombre', 'diaCobro'] }],
      order: [['nombre', 'ASC']]
    });
    
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener clientes por ruta
export const obtenerClientesPorRuta = async (req, res) => {
  try {
    const { rutaId } = req.params;
    const usuarioId = req.usuario.id;
    
    // Verificar que la ruta pertenezca al usuario
    const ruta = await Rutas.findOne({
      where: { id: rutaId, usuarioId }
    });
    
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    // Obtener clientes de la ruta
    const clientes = await Clientes.findAll({
      where: { rutaId },
      order: [['nombre', 'ASC']]
    });
    
    res.status(200).json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes por ruta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener un cliente específico
export const obtenerCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Verificar que el cliente pertenezca a una ruta del usuario
    const cliente = await Clientes.findOne({
      where: { id },
      include: [{
        model: Rutas,
        where: { usuarioId }
      }]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un cliente
export const actualizarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, telefono, email, direccion, estado, rutaId } = req.body;
    const usuarioId = req.usuario.id;
    
    // Encontrar el cliente y verificar que pertenece al usuario
    const cliente = await Clientes.findOne({
      where: { id },
      include: [{
        model: Rutas,
        where: { usuarioId }
      }]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Si se está cambiando la ruta, verificar que la nueva ruta pertenezca al usuario
    if (rutaId && rutaId !== cliente.rutaId) {
      const nuevaRuta = await Rutas.findOne({
        where: { id: rutaId, usuarioId }
      });
      
      if (!nuevaRuta) {
        return res.status(404).json({ error: 'Ruta no encontrada' });
      }
    }
    
    // Actualizar los campos
    if (nombre) cliente.nombre = nombre;
    if (telefono) cliente.telefono = telefono;
    if (email !== undefined) cliente.email = email;
    if (direccion) cliente.direccion = direccion;
    if (estado) cliente.estado = estado;
    if (rutaId) cliente.rutaId = rutaId;
    
    await cliente.save();
    
    res.status(200).json(cliente);
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un cliente
export const eliminarCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Encontrar el cliente y verificar que pertenece al usuario
    const cliente = await Clientes.findOne({
      where: { id },
      include: [{
        model: Rutas,
        where: { usuarioId }
      }]
    });
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    
    // Verificar si el cliente tiene préstamos activos
    const prestamosActivos = await Prestamo.count({
      where: { 
        clienteId: id,
        estado: ['activo', 'moroso']
      }
    });
    
    if (prestamosActivos > 0) {
      return res.status(400).json({
        error: 'Este cliente tiene préstamos activos. Para eliminar este cliente, debe cerrar sus préstamos primero.',
        prestamosActivos
      });
    }
    
    // Eliminar el cliente
    await cliente.destroy();
    
    res.status(200).json({ mensaje: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: error.message });
  }
};

// Filtrar clientes con múltiples criterios
export const filtrarClientes = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;
    const { 
      nombre, 
      idCliente, 
      cedula, 
      rutaId, 
      estado, 
      esPrueba, // true/false para filtrar clientes de prueba (TEST-)
      orderBy = 'nombre', // campo para ordenar
      orderDir = 'ASC', // dirección del ordenamiento (ASC/DESC)
      limit = 100, // límite de resultados
      offset = 0 // desplazamiento para paginación
    } = req.query;
    
    // Obtener todas las rutas del usuario
    const rutas = await Rutas.findAll({
      where: { usuarioId },
      attributes: ['id']
    });
    
    const rutasIds = rutas.map(ruta => ruta.id);
    
    // Construir la consulta
    const whereClause = { rutaId: rutasIds };
    
    // Filtrar por nombre
    if (nombre) {
      whereClause.nombre = {
        [sequelize.Sequelize.Op.like]: `%${nombre}%`
      };
    }
    
    // Filtrar por ID de cliente
    if (idCliente) {
      whereClause.idCliente = {
        [sequelize.Sequelize.Op.like]: `%${idCliente}%`
      };
    }
    
    // Filtrar por cédula
    if (cedula) {
      whereClause.cedula = {
        [sequelize.Sequelize.Op.like]: `%${cedula}%`
      };
    }
    
    // Filtrar por ruta específica
    if (rutaId) {
      // Verificar que la ruta pertenezca al usuario
      const rutaExiste = rutasIds.includes(parseInt(rutaId, 10));
      if (rutaExiste) {
        whereClause.rutaId = rutaId;
      } else {
        return res.status(404).json({ error: 'Ruta no encontrada o no pertenece al usuario' });
      }
    }
    
    // Filtrar por estado
    if (estado) {
      whereClause.estado = estado;
    }
    
    // Filtrar clientes de prueba
    if (esPrueba === 'true') {
      whereClause.idCliente = {
        [sequelize.Sequelize.Op.like]: 'TEST-%'
      };
    } else if (esPrueba === 'false') {
      whereClause.idCliente = {
        [sequelize.Sequelize.Op.notLike]: 'TEST-%'
      };
    }
    
    // Validar campo de ordenamiento
    const validOrderFields = ['nombre', 'idCliente', 'cedula', 'telefono', 'fecha_registro', 'estado'];
    const sortField = validOrderFields.includes(orderBy) ? orderBy : 'nombre';
    
    // Validar dirección de ordenamiento
    const sortDir = ['ASC', 'DESC'].includes(orderDir.toUpperCase()) ? orderDir.toUpperCase() : 'ASC';
    
    // Ejecutar la consulta
    const { count, rows: clientes } = await Clientes.findAndCountAll({
      where: whereClause,
      include: [{ model: Rutas, attributes: ['nombre', 'diaCobro'] }],
      order: [[sortField, sortDir]],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10)
    });
    
    // Retornar resultados con metadata para paginación
    res.status(200).json({
      total: count,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      clientes
    });
    
  } catch (error) {
    console.error('Error al filtrar clientes:', error);
    res.status(500).json({ error: error.message });
  }
}; 