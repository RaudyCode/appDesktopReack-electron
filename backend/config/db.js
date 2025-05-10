import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.DB_NAME, // Usar el nombre de la base de datos desde .env
  logging: false,
});

export default sequelize;

