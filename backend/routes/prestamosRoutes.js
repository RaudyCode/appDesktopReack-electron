import express from 'express';
import {
  crearPrestamo,
  obtenerPrestamos,
  obtenerPrestamosPorCliente,
  obtenerPrestamo,
  actualizarPrestamo,
  eliminarPrestamo
} from '../controllers/prestamosController.js';
import protegerRuta from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

// Rutas CRUD para préstamos
router.post('/prestamos', crearPrestamo);
router.get('/prestamos', obtenerPrestamos);
router.get('/prestamos/cliente/:clienteId', obtenerPrestamosPorCliente);
router.get('/prestamos/:id', obtenerPrestamo);
router.put('/prestamos/:id', actualizarPrestamo);
router.delete('/prestamos/:id', eliminarPrestamo);

export default router; 