import { DataTypes } from "sequelize";
import db from '../config/db.js';

const Pagos = db.define('pagos', {
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    semana: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    montoAbonado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    },
    totalPagado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    estadoPago: {
        type: DataTypes.ENUM('a tiempo', 'atrasado', 'parcial', 'en mora'),
        allowNull: false,
        defaultValue: 'a tiempo'
    }
})

export default Pagos;