import { Clientes, Prestamo, Rutas } from '../models/index.js';
import sequelize from '../config/db.js';
import { addWeeks, format } from 'date-fns';

/**
 * Script para generar datos de prueba masivos
 * Crea 100 clientes con 3 préstamos cada uno en la ruta especificada
 */

const generateTestData = async (rutaId) => {
  try {
    console.log('Iniciando generación de datos de prueba...');
    
    if (!rutaId) {
      console.error('Error: Se requiere un ID de ruta válido.');
      console.log('Uso: npm run seed-create [ID_DE_RUTA]');
      console.log('Ejemplo: npm run seed-create 1');
      process.exit(1);
    }
    
    // Verificar si la ruta existe
    const ruta = await Rutas.findByPk(rutaId);
    if (!ruta) {
      console.error(`Error: No se encontró la ruta con ID ${rutaId}`);
      process.exit(1);
    }
    
    console.log(`Generando datos para la ruta: ${ruta.nombre}`);
    
    // Generar nombres aleatorios
    const nombres = [
      'Juan', 'María', 'Carlos', 'Ana', 'Pedro', 'Laura', 'José', 'Sofia', 'Miguel', 'Lucía',
      'David', 'Patricia', 'Fernando', 'Carmen', 'Javier', 'Isabel', 'Antonio', 'Rosa', 'Francisco', 'Marta'
    ];
    
    const apellidos = [
      'Pérez', 'García', 'Rodríguez', 'López', 'Martínez', 'González', 'Hernández', 'Sánchez', 'Ramírez', 'Torres',
      'Díaz', 'Flores', 'Rivera', 'Gómez', 'Morales', 'Reyes', 'Cruz', 'Ortiz', 'Núñez', 'Jiménez'
    ];
    
    // Contadores
    let clientesCreados = 0;
    let prestamosCreados = 0;
    
    // Crear 100 clientes
    for (let i = 1; i <= 100; i++) {
      // Generar datos aleatorios para el cliente
      const nombreIndex = Math.floor(Math.random() * nombres.length);
      const apellido1Index = Math.floor(Math.random() * apellidos.length);
      const apellido2Index = Math.floor(Math.random() * apellidos.length);
      
      const nombre = `${nombres[nombreIndex]} ${apellidos[apellido1Index]} ${apellidos[apellido2Index]}`;
      const idCliente = `TEST-${i.toString().padStart(3, '0')}`;
      const cedula = Math.floor(10000000000 + Math.random() * 90000000000).toString();
      const telefono = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(1000000 + Math.random() * 9000000)}`;
      
      // Crear cliente
      const cliente = await Clientes.create({
        idCliente,
        nombre,
        cedula,
        telefono,
        email: `${nombre.toLowerCase().replace(/\s/g, '.')}@ejemplo.com`,
        direccion: `Calle ${Math.floor(1 + Math.random() * 100)}, Sector ${Math.floor(1 + Math.random() * 20)}`,
        rutaId,
        estado: 'activo'
      });
      
      clientesCreados++;
      
      // Crear 3 préstamos para cada cliente
      for (let j = 1; j <= 3; j++) {
        // Generar datos aleatorios para el préstamo
        const montoBase = Math.floor(5000 + Math.random() * 45000); // Monto entre 5,000 y 50,000
        const monto = Math.round(montoBase / 1000) * 1000; // Redondear a miles
        const plazo = 13; // Plazo fijo de 13 semanas
        const totalApagar = monto * 1.3; // 30% de interés
        const cuota = Math.round((totalApagar / plazo) * 100) / 100; // Redondear a 2 decimales
        
        // Fecha de inicio: aleatoria entre hace 1 y 12 semanas
        const semanasTranscurridas = Math.floor(1 + Math.random() * 12);
        const fechaInicio = new Date();
        fechaInicio.setDate(fechaInicio.getDate() - (semanasTranscurridas * 7));
        
        // Calcular fecha del próximo pago
        const semanaActual = Math.min(semanasTranscurridas + 1, plazo);
        const fechaProximoPago = addWeeks(fechaInicio, semanaActual);
        
        // Calcular fecha de caducidad (fecha inicio + plazo semanas)
        const fechaCaducidad = addWeeks(fechaInicio, plazo);
        
        // Calcular pagos realizados (semana actual - 1)
        const pagosRealizados = semanaActual - 1;
        const totalPagado = pagosRealizados * cuota;
        
        // Estado según progreso
        let estado = 'activo';
        if (Math.random() < 0.1) { // 10% de chance de ser moroso
          estado = 'moroso';
        }
        
        // Crear préstamo
        const prestamo = await Prestamo.create({
          clienteId: cliente.id,
          monto,
          plazo,
          cuota,
          fechaInicio: format(fechaInicio, 'yyyy-MM-dd'),
          fechaDeCaducidad: format(fechaCaducidad, 'yyyy-MM-dd'),
          semana:1,
          estado,
          totalApagar,
          totalPagado:0,
          fechaDeProximoPago: format(fechaProximoPago, 'yyyy-MM-dd'),
          pagosATiempo: 0,
          pagosAtrasados: 0,
          atrasosNoPagados: 0,
          montoAtrasosNoPagados: 0,
          pagosParciales: 0
        });
        
        prestamosCreados++;
      }
      
      // Mostrar progreso
      if (i % 10 === 0) {
        console.log(`Progreso: ${i}% completado`);
      }
    }
    
    console.log('Generación de datos completada:');
    console.log(`- ${clientesCreados} clientes creados`);
    console.log(`- ${prestamosCreados} préstamos creados`);
    
  } catch (error) {
    console.error('Error al generar datos de prueba:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
};

// Eliminar datos de prueba
const removeTestData = async () => {
  try {
    console.log('Eliminando datos de prueba...');
    
    // Encontrar clientes de prueba (con ID que comienza con TEST-)
    const clientesTest = await Clientes.findAll({
      where: {
        idCliente: {
          [sequelize.Sequelize.Op.like]: 'TEST-%'
        }
      },
      attributes: ['id']
    });
    
    const clienteIds = clientesTest.map(c => c.id);
    
    if (clienteIds.length === 0) {
      console.log('No se encontraron datos de prueba para eliminar.');
      return;
    }
    
    // Eliminar préstamos asociados a estos clientes
    const resultPrestamos = await Prestamo.destroy({
      where: {
        clienteId: {
          [sequelize.Sequelize.Op.in]: clienteIds
        }
      }
    });
    
    // Eliminar los clientes
    const resultClientes = await Clientes.destroy({
      where: {
        id: {
          [sequelize.Sequelize.Op.in]: clienteIds
        }
      }
    });
    
    console.log(`Eliminación completada: ${resultClientes} clientes y ${resultPrestamos} préstamos eliminados.`);
    
  } catch (error) {
    console.error('Error al eliminar datos de prueba:', error);
  } finally {
    // Cerrar la conexión
    await sequelize.close();
  }
};

// Verificar argumentos de línea de comandos
const args = process.argv.slice(2);
const action = args[0];
// Buscar argumentos de línea de comandos o de npm
const rutaId = args[1] || process.env.npm_config_id || process.env.npm_package_config_rutaId;

if (action === 'create') {
  generateTestData(rutaId);
} else if (action === 'remove') {
  removeTestData();
} else {
  console.log('Uso:');
  console.log('npm run seed-create [ID_DE_RUTA] - Crear datos de prueba');
  console.log('npm run seed-remove - Eliminar datos de prueba');
} 