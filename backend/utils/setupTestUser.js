import Usuario from '../models/Usuario.js';
import bcrypt from 'bcrypt';

// Función para crear un usuario de prueba si no hay usuarios en la base de datos
const setupTestUser = async () => {
  try {
    // Contar el número de usuarios
    const count = await Usuario.count();
    console.log(`Número de usuarios en la base de datos: ${count}`);
    
    // Si no hay usuarios, crear uno de prueba
    if (count === 0) {
      console.log('No se encontraron usuarios. Creando usuario de prueba...');
      
      // Generar hash de la contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456', salt);
      
      // Crear usuario de prueba
      const testUser = await Usuario.create({
        nombre: 'Usuario Prueba',
        email: 'test@example.com',
        password: hashedPassword
      });
      
      console.log(`Usuario de prueba creado con ID: ${testUser.id}`);
      console.log('Credenciales: email=test@example.com, password=123456');
      return testUser;
    } else {
      console.log('La base de datos ya contiene usuarios.');
      return null;
    }
  } catch (error) {
    console.error('Error al configurar usuario de prueba:', error);
    throw error;
  }
};

export default setupTestUser; 