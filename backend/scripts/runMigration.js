import { Sequelize } from 'sequelize';
import db from '../config/db.js';
import { Prestamo, Pagos } from '../models/index.js';

// Función para ejecutar manualmente la migración y actualizar datos existentes
async function runMigration() {
  try {
    console.log('Iniciando migración y actualización de datos...');
    
    // 1. Verificar conexión a la base de datos
    await db.authenticate();
    console.log('Conexión a la base de datos establecida correctamente.');
    
    // 2. Agregar columnas a la tabla prestamos si no existen
    const queryInterface = db.getQueryInterface();
    
    // Lista de columnas a agregar
    const columnas = [
      {
        nombre: 'pagosAtrasados',
        definicion: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        nombre: 'atrasosNoPagados',
        definicion: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        nombre: 'montoAtrasosNoPagados',
        definicion: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        nombre: 'semanasConsecutivasAtraso',
        definicion: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        nombre: 'fechaUltimoAtraso',
        definicion: {
          type: Sequelize.DATEONLY,
          allowNull: true
        }
      },
      {
        nombre: 'pagosATiempo',
        definicion: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      },
      {
        nombre: 'pagosParciales',
        definicion: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0
        }
      }
    ];
    
    // Agregar cada columna si no existe
    for (const columna of columnas) {
      try {
        await queryInterface.addColumn('prestamos', columna.nombre, columna.definicion);
        console.log(`Columna ${columna.nombre} agregada correctamente.`);
      } catch (error) {
        // Si la columna ya existe, seguir adelante
        console.log(`La columna ${columna.nombre} ya existe o hubo un error: ${error.message}`);
      }
    }
    
    // 3. Actualizar ENUM para incluir 'con pagos parciales' si no existe
    try {
      await db.query(`ALTER TYPE enum_prestamos_estado ADD VALUE IF NOT EXISTS 'con pagos parciales'`);
      console.log('Tipo ENUM actualizado correctamente.');
    } catch (error) {
      console.log(`Error al actualizar ENUM o ya existe el valor: ${error.message}`);
    }
    
    // 4. Actualizar datos de préstamos existentes
    const prestamos = await Prestamo.findAll();
    console.log(`Encontrados ${prestamos.length} préstamos para actualizar.`);
    
    for (const prestamo of prestamos) {
      // Obtener pagos atrasados para este préstamo
      const pagosAtrasados = await Pagos.count({
        where: {
          prestamoId: prestamo.id,
          estadoPago: {
            [Sequelize.Op.or]: ['atrasado', 'atrasado y parcial']
          }
        }
      });
      
      // Obtener pagos a tiempo para este préstamo
      const pagosATiempo = await Pagos.count({
        where: {
          prestamoId: prestamo.id,
          estadoPago: 'a tiempo'
        }
      });
      
      // Obtener pagos parciales para este préstamo
      const pagosParciales = await Pagos.count({
        where: {
          prestamoId: prestamo.id,
          estadoPago: {
            [Sequelize.Op.or]: ['parcial', 'atrasado y parcial']
          }
        }
      });
      
      // Obtener el último pago atrasado
      const ultimoAtraso = await Pagos.findOne({
        where: {
          prestamoId: prestamo.id,
          estadoPago: {
            [Sequelize.Op.or]: ['atrasado', 'atrasado y parcial']
          }
        },
        order: [['fecha', 'DESC']]
      });
      
      // Actualizar valores
      prestamo.pagosAtrasados = pagosAtrasados;
      prestamo.pagosATiempo = pagosATiempo;
      prestamo.pagosParciales = pagosParciales;
      
      // Si está moroso, asumir que hay atrasos no pagados
      if (prestamo.estado === 'moroso') {
        prestamo.atrasosNoPagados = prestamo.atrasosNoPagados || 1;
        prestamo.montoAtrasosNoPagados = prestamo.cuota * prestamo.atrasosNoPagados;
        prestamo.semanasConsecutivasAtraso = prestamo.semanasConsecutivasAtraso || 1;
      }
      
      // Si hay un último atraso, registrar su fecha
      if (ultimoAtraso) {
        prestamo.fechaUltimoAtraso = ultimoAtraso.fecha;
      }
      
      await prestamo.save();
      console.log(`Préstamo ID ${prestamo.id} actualizado correctamente.`);
    }
    
    console.log('Migración y actualización de datos completada con éxito.');
    process.exit(0);
    
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  }
}

// Ejecutar la migración
runMigration(); 