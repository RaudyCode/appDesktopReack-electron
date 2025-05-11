import Usuario from './Usuario.js';
import Rutas from './Rutas.js';
import Clientes from './Clientes.js';

// Relaciones entre modelos
// Un usuario puede tener muchas rutas
Usuario.hasMany(Rutas, { foreignKey: 'usuarioId' });
Rutas.belongsTo(Usuario, { foreignKey: 'usuarioId' });

// Una ruta puede tener muchos clientes
Rutas.hasMany(Clientes, { foreignKey: 'rutaId' });
Clientes.belongsTo(Rutas, { foreignKey: 'rutaId' });

export {
    Usuario,
    Rutas,
    Clientes
}; 