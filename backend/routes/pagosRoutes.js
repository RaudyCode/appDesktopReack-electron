import express from 'express';
import {
  registrarPago,
  obtenerPagos,
  obtenerPagosPorPrestamo,
  obtenerPago,
  eliminarPago,
  generarRecibo,
  generarRecibosRuta
} from '../controllers/pagosController.js';
import protegerRuta from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

// Rutas CRUD para pagos
router.post('/pagos', registrarPago);
router.get('/pagos', obtenerPagos);
router.get('/pagos/prestamo/:prestamoId', obtenerPagosPorPrestamo);
router.get('/pagos/:id', obtenerPago);
router.delete('/pagos/:id', eliminarPago);

// Rutas para generación de recibos
router.get('/recibos/pago/:pagoId', generarRecibo);
router.get('/recibos/ruta/:rutaId', generarRecibosRuta);

export default router; 