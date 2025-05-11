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
    // Nuevos campos para manejo de atrasos
    pagosAtrasados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Contador histórico de pagos atrasados
    },
    pagosATiempo: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Contador histórico de pagos realizados a tiempo
    },
    pagosParciales: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Contador histórico de pagos parciales
    },
    atrasosNoPagados: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Número actual de atrasos pendientes de pago
    },
    montoAtrasosNoPagados: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0 // Monto acumulado de atrasos pendientes
    },
    semanasConsecutivasAtraso: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0 // Contador de semanas consecutivas en atraso
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
    fechaUltimoAtraso: {
        type: DataTypes.DATEONLY,
        allowNull: true // Fecha del último atraso registrado
    },
    estado: {
        type: DataTypes.ENUM('activo', 'pagado', 'moroso', 'con pagos parciales'),
        allowNull: false,
        defaultValue: 'activo'
    }
})

export default Prestamo