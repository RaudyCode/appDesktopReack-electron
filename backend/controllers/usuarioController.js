import Usuario from '../models/Usuario.js';

// Crear un nuevo usuario
export const crearUsuario = async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const nuevoUsuario = await Usuario.create({ nombre, email, password });
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener todos los usuarios
export const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener un usuario por ID
export const obtenerUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar un usuario
export const actualizarUsuario = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, password } = req.body;
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    usuario.nombre = nombre || usuario.nombre;
    usuario.email = email || usuario.email;
    usuario.password = password || usuario.password;
    await usuario.save();
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Eliminar un usuario
export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    await usuario.destroy();
    res.status(200).json({ message: 'Usuario eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Login de usuario
export const loginUsuario = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    // Verificar si el usuario existe
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(404).json({ error: 'El usuario no existe' });
    }
    
    // Verificar la contraseña
    if (!usuario.veryficarPassword(password)) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    
    // Devolver información del usuario (sin contraseña)
    res.status(200).json({
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
