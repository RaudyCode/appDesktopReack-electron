import db from '../config/db.js';
import { DataTypes } from 'sequelize';
import { Pagos } from '../models/index.js';

const updatePagosEstado = async () => {
  try {
    console.log('Iniciando migración para actualizar el campo estadoPago en la tabla pagos...');
    
    // SQLite no permite alterar directamente el tipo de columna, debemos crear una nueva tabla
    // Primero obtenemos una referencia al modelo actual
    console.log('Actualizando modelo Pagos con nuevos valores para estadoPago...');
    
    // Actualizar el modelo en memoria para reflejar los nuevos valores ENUM
    await db.query(`PRAGMA foreign_keys = OFF;`);
    
    // En SQLite, no podemos modificar directamente el tipo ENUM, pero podemos usar CHECK para validar
    console.log('Agregando nuevos valores permitidos a la restricción CHECK...');
    
    try {
      // Opción 1: Crear tabla temporal, copiar datos, renombrar
      await db.query(`
        CREATE TABLE pagos_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          monto DECIMAL(10, 2) NOT NULL,
          fecha DATE NOT NULL,
          semana INTEGER NOT NULL,
          montoAbonado DECIMAL(10, 2) NOT NULL DEFAULT 0,
          totalPagado DECIMAL(10, 2) NOT NULL,
          estadoPago TEXT NOT NULL CHECK (
            estadoPago IN (
              'a tiempo', 
              'atrasado', 
              'parcial', 
              'atrasado y parcial',
              'fuera de tiempo',
              'fuera de tiempo y parcial',
              'en mora'
            )
          ) DEFAULT 'a tiempo',
          createdAt DATETIME,
          updatedAt DATETIME,
          prestamoId INTEGER,
          FOREIGN KEY (prestamoId) REFERENCES prestamos(id) ON DELETE CASCADE
        );
        
        INSERT INTO pagos_new 
        SELECT * FROM pagos;
        
        DROP TABLE pagos;
        
        ALTER TABLE pagos_new RENAME TO pagos;
      `);
      
      console.log('Tabla pagos actualizada exitosamente.');
    } catch (err) {
      console.error('Error al recrear la tabla pagos:', err);
      
      // Opción 2: Solo actualizar la CHECK constraint si la recreación falla
      console.log('Intentando actualizar solo la restricción CHECK...');
      
      // Eliminamos restricciones existentes en estadoPago
      await db.query(`
        CREATE TEMPORARY TABLE pagos_backup(
          id, monto, fecha, semana, montoAbonado, totalPagado, estadoPago, 
          createdAt, updatedAt, prestamoId
        );
        
        INSERT INTO pagos_backup 
        SELECT id, monto, fecha, semana, montoAbonado, totalPagado, estadoPago,
               createdAt, updatedAt, prestamoId
        FROM pagos;
        
        DROP TABLE pagos;
        
        CREATE TABLE pagos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          monto DECIMAL(10, 2) NOT NULL,
          fecha DATE NOT NULL,
          semana INTEGER NOT NULL,
          montoAbonado DECIMAL(10, 2) NOT NULL DEFAULT 0,
          totalPagado DECIMAL(10, 2) NOT NULL,
          estadoPago TEXT NOT NULL CHECK (
            estadoPago IN (
              'a tiempo', 
              'atrasado', 
              'parcial', 
              'atrasado y parcial',
              'fuera de tiempo',
              'fuera de tiempo y parcial',
              'en mora'
            )
          ) DEFAULT 'a tiempo',
          createdAt DATETIME,
          updatedAt DATETIME,
          prestamoId INTEGER,
          FOREIGN KEY (prestamoId) REFERENCES prestamos(id) ON DELETE CASCADE
        );
        
        INSERT INTO pagos 
        SELECT id, monto, fecha, semana, montoAbonado, totalPagado, estadoPago,
               createdAt, updatedAt, prestamoId
        FROM pagos_backup;
        
        DROP TABLE pagos_backup;
      `);
    }
    
    await db.query(`PRAGMA foreign_keys = ON;`);
    
    console.log('Migración completada exitosamente');
    process.exit(0);
  } catch (error) {
    console.error('Error en la migración:', error);
    process.exit(1);
  }
};

updatePagosEstado(); 