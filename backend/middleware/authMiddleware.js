import Usuario from '../models/Usuario.js';

// Middleware para verificar que el usuario esté autenticado
const protegerRuta = async (req, res, next) => {
  // Verificar si hay token o ID en el header
  const userId = req.headers['x-user-id'];
  
  console.log('Headers recibidos:', req.headers);
  console.log('User ID del header:', userId);
  
  if (!userId) {
    console.log('No se proporcionó ID de usuario en header');
    return res.status(401).json({ error: 'No autorizado - No se ha proporcionado ID de usuario' });
  }
  
  try {
    // Buscar el usuario por su ID
    const usuario = await Usuario.findByPk(userId);
    
    if (!usuario) {
      console.log(`Usuario con ID ${userId} no encontrado`);
      
      // Listar todos los usuarios en la base de datos para diagnóstico
      const todosUsuarios = await Usuario.findAll({ attributes: ['id', 'nombre', 'email'] });
      console.log('Usuarios disponibles en la base de datos:', JSON.stringify(todosUsuarios, null, 2));
      
      return res.status(401).json({ 
        error: 'No autorizado - Usuario no encontrado',
        mensaje: `El usuario con ID ${userId} no existe en la base de datos`,
        sugerencia: 'Por favor cierre sesión y regístrese de nuevo'
      });
    }
    
    console.log(`Usuario autenticado: ${usuario.nombre} (ID: ${usuario.id})`);
    
    // Almacenar el usuario en el objeto request para su uso posterior
    req.usuario = usuario;
    
    next();
  } catch (error) {
    console.error('Error en middleware de autenticación:', error);
    return res.status(401).json({ error: 'No autorizado - Error en la verificación' });
  }
};

export default protegerRuta; 