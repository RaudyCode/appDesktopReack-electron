import Usuario from './Usuario.js';
import Rutas from './Rutas.js';
import Clientes from './Clientes.js';
import Prestamo from './Prestamo.js';
import Pagos from './Pago.js';

// Relaciones entre modelos
// Un usuario puede tener muchas rutas
Usuario.hasMany(Rutas, { foreignKey: 'usuarioId' });
Rutas.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Una ruta puede tener muchos clientes
Rutas.hasMany(Clientes, { foreignKey: 'rutaId' });
Clientes.belongsTo(Rutas, { foreignKey: 'rutaId' });

// Un cliente puede tener muchos préstamos
Clientes.hasMany(Prestamo, { foreignKey: 'clienteId' });
Prestamo.belongsTo(Clientes, { foreignKey: 'clienteId' });

// Un préstamo puede tener muchos pagos
Prestamo.hasMany(Pagos, { foreignKey: 'prestamoId' });
Pagos.belongsTo(Prestamo, { foreignKey: 'prestamoId' });

export {
    Usuario,
    Rutas,
    Clientes,
    Prestamo,
    Pagos
}; 