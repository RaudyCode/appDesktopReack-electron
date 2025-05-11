import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración para obtener el directorio actual con ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Configurar la ruta a la base de datos SQLite
const dbPath = path.join(__dirname, '..', 'database', 'prestamos.sqlite');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath, // Usar una ruta absoluta al archivo de la base de datos
  logging: false,
});

export default sequelize;

