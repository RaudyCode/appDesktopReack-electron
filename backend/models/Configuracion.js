import { DataTypes } from 'sequelize';
import db from '../config/db.js';

const Configuracion = db.define('configuracion', {
    nombreCompania: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telefono1: {
        type: DataTypes.STRING,
        allowNull: true
    },
    telefono2: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

export default Configuracion;