import express from 'express';
import sequelize from './config/db.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import rutasRoutes from './routes/rutasRoutes.js';
import clientesRoutes from './routes/clientesRoutes.js';
import prestamosRoutes from './routes/prestamosRoutes.js';
import pagosRoutes from './routes/pagosRoutes.js';
import bodyParser from 'body-parser';
import cors from 'cors';
import setupTestUser from './utils/setupTestUser.js';
import Usuario from './models/Usuario.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para obtener el directorio actual con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asegurar que el directorio de la base de datos exista
const dbDir = path.join(__dirname, 'database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('Directorio de base de datos creado:', dbDir);
}

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
// Rutas de clientes
app.use('/api', clientesRoutes);
// Rutas de préstamos
app.use('/api', prestamosRoutes);
// Rutas de pagos
app.use('/api', pagosRoutes);

// Conexión a la base de datos y sincronización de modelos
sequelize.sync({ force: false }).then(async () => {
  console.log('Base de datos sincronizada');
  console.log('Datos almacenados permanentemente en:', path.join(dbDir, 'prestamos.sqlite'));
  
  // Configurar usuario de prueba si no hay usuarios
  await setupTestUser();
  
  // Iniciar el servidor
  app.listen(4000, () => {
    console.log('Servidor corriendo en el puerto 4000');
    console.log('Endpoints disponibles:');
    console.log('- http://localhost:4000/api/login (POST)');
    console.log('- http://localhost:4000/api/usuarios (POST)');
    console.log('- http://localhost:4000/api/rutas (GET, POST)');
    console.log('- http://localhost:4000/api/clientes (GET, POST)');
    console.log('- http://localhost:4000/api/prestamos (GET, POST)');
    console.log('- http://localhost:4000/api/pagos (GET, POST)');
    console.log('- http://localhost:4000/api/recibos/pago/:pagoId (GET)');
    console.log('- http://localhost:4000/api/recibos/ruta/:rutaId (GET)');
    console.log('- http://localhost:4000/api/status (GET)');
    console.log('- http://localhost:4000/api/diagnostico/usuarios (GET)');
  });
});
