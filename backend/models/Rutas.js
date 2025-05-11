import { DataTypes } from "sequelize";
import db from '../config/db.js';

const Rutas = db.define('rutas',{
    nombre: {
        type: DataTypes.STRING,
        allowNull:false
    },
    diaCobro: { 
        type: DataTypes.STRING,
        allowNull: false
    }
});

export default Rutas; 