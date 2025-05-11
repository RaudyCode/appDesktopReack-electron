import { DataTypes } from "sequelize";
import db from '../config/db.js';

const Clientes = db.define('clientes', {
    idCliente: {
        type: DataTypes.STRING(10),
        allowNull: false,
    },
    nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
    },
    cedula: {
        type: DataTypes.STRING(11),
        unique: true,
        allowNull: false,
    },
    telefono: {
        type: DataTypes.STRING(15),
        allowNull: false,
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: true,
        validate: {
            isEmail: true,
        }
    },
    direccion: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    fecha_registro: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        allowNull: false,
    },
    estado: {
        type: DataTypes.ENUM('activo', 'moroso', 'inactivo'),
        defaultValue: 'activo',
        allowNull: false,
    },
}, {
    tableName: 'clientes',
    timestamps: false,
});

export default Clientes; 