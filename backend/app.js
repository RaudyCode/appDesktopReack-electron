import express from 'express';
import sequelize from './config/db.js';
import usuarioRoutes from './routes/usuarioRoutes.js';
import bodyParser from 'body-parser';

// Inicializamos Express
const app = express();

// Middleware
app.use(bodyParser.json());

// Rutas de usuarios
app.use('/api', usuarioRoutes);

// Conexión a la base de datos y sincronización de modelos
sequelize.sync({ force: false }).then(() => {
  console.log('Base de datos sincronizada');
});

// Iniciar el servidor
app.listen(4000, () => {
  console.log('Servidor corriendo en el puerto 4000');
});
