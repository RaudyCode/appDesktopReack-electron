import express from 'express';
import sequelize from './config/db.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import rutasRoutes from './routes/rutasRoutes.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import setupTestUser from './utils/setupTestUser.js';
import Usuario from './models/Usuario.js';

// Inicializamos Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Endpoint de diagnóstico para verificar el estado del servidor
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de diagnóstico para verificar usuarios
app.get('/api/diagnostico/usuarios', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id', 'nombre', 'email', 'createdAt']
    });
    
    res.json({
      total: usuarios.length,
      usuarios
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Rutas de usuarios
app.use('/api', usuarioRoutes);
// Rutas de cobro
app.use('/api', rutasRoutes);

// Conexión a la base de datos y sincronización de modelos
sequelize.sync({ force: false }).then(async () => {
  console.log('Base de datos sincronizada');
  
  // Configurar usuario de prueba si no hay usuarios
  await setupTestUser();
  
  // Iniciar el servidor
  app.listen(4000, () => {
    console.log('Servidor corriendo en el puerto 4000');
    console.log('Endpoints disponibles:');
    console.log('- http://localhost:4000/api/login (POST)');
    console.log('- http://localhost:4000/api/usuarios (POST)');
    console.log('- http://localhost:4000/api/rutas (GET, POST)');
    console.log('- http://localhost:4000/api/status (GET)');
    console.log('- http://localhost:4000/api/diagnostico/usuarios (GET)');
  });
});
