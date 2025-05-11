import { Rutas, Clientes } from '../models/index.js';

// Crear una nueva ruta
export const crearRuta = async (req, res) => {
  try {
    console.log('Body recibido:', req.body);
    const { nombre, diaCobro } = req.body;
    
    // Validar campos obligatorios
    if (!nombre || !diaCobro) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    
    // Obtener el ID del usuario desde el token o la sesión
    const usuarioId = req.usuario.id;
    console.log('Usuario ID para crear ruta:', usuarioId);
    
    // Crear la ruta asociada al usuario
    const nuevaRuta = await Rutas.create({
      nombre,
      diaCobro,
      usuarioId
    });
    
    console.log('Ruta creada:', nuevaRuta);
    res.status(201).json(nuevaRuta);
  } catch (error) {
    console.error('Error al crear ruta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener todas las rutas del usuario autenticado
export const obtenerRutas = async (req, res) => {
  try {
    console.log('Obteniendo rutas para usuario:', req.usuario.id);
    
    const usuarioId = req.usuario.id;
    
    const rutas = await Rutas.findAll({
      where: { usuarioId },
      order: [['createdAt', 'DESC']]
    });
    
    console.log(`Se encontraron ${rutas.length} rutas`);
    res.status(200).json(rutas);
  } catch (error) {
    console.error('Error al obtener rutas:', error);
    res.status(500).json({ error: error.message });
  }
};

// Obtener una ruta específica por ID
export const obtenerRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    const ruta = await Rutas.findOne({
      where: { id, usuarioId }
    });
    
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    res.status(200).json(ruta);
  } catch (error) {
    console.error('Error al obtener ruta específica:', error);
    res.status(500).json({ error: error.message });
  }
};

// Actualizar una ruta
export const actualizarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, diaCobro } = req.body;
    const usuarioId = req.usuario.id;
    
    // Validar campos
    if (!nombre && !diaCobro) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
    }
    
    // Buscar la ruta
    const ruta = await Rutas.findOne({
      where: { id, usuarioId }
    });
    
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    // Actualizar campos
    if (nombre) ruta.nombre = nombre;
    if (diaCobro) ruta.diaCobro = diaCobro;
    
    await ruta.save();
    
    res.status(200).json(ruta);
  } catch (error) {
    console.error('Error al actualizar ruta:', error);
    res.status(500).json({ error: error.message });
  }
};

// Eliminar una ruta
export const eliminarRuta = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.usuario.id;
    
    // Verificar si la ruta existe
    const ruta = await Rutas.findOne({
      where: { id, usuarioId }
    });
    
    if (!ruta) {
      return res.status(404).json({ error: 'Ruta no encontrada' });
    }
    
    // Verificar si tiene clientes asociados
    const clientesAsociados = await Clientes.count({
      where: { rutaId: id }
    });
    
    if (clientesAsociados > 0) {
      return res.status(400).json({ 
        error: 'Esta ruta cuenta con clientes activos. Para eliminar esta ruta, debe eliminar a sus clientes primero.',
        clientesAsociados
      });
    }
    
    // Eliminar la ruta
    await ruta.destroy();
    
    res.status(200).json({ mensaje: 'Ruta eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar ruta:', error);
    res.status(500).json({ error: error.message });
  }
}; 