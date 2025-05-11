import express from 'express';
import {
  crearCliente,
  obtenerClientes,
  obtenerClientesPorRuta,
  obtenerCliente,
  actualizarCliente,
  eliminarCliente
} from '../controllers/clientesController.js';
import protegerRuta from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

// Rutas CRUD para clientes
router.post('/clientes', crearCliente);
router.get('/clientes', obtenerClientes);
router.get('/clientes/ruta/:rutaId', obtenerClientesPorRuta);
router.get('/clientes/:id', obtenerCliente);
router.put('/clientes/:id', actualizarCliente);
router.delete('/clientes/:id', eliminarCliente);

export default router; 