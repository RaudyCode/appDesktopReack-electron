import { DataTypes } from "sequelize";
import db from '../config/db.js';

const Prestamo = db.define('prestamos', {
    monto: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    plazo: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    semana: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    cuota: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    abonado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue:0
    },
    totalApagar: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    totalPagado: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue:0
    },
    retraso: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0 // Inicialmente no hay retrasos
    },
    semanasAtrasadas: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Inicialmente no hay semanas atrasadas
    },
    fechaInicio: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fechaDeCaducidad: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    fechaDeUltimoPago: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    fechaDeProximoPago: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    estado: {
        type: DataTypes.ENUM('activo', 'pagado', 'moroso'),
        allowNull: false,
        defaultValue: 'activo'
    }

})

export default Prestamo