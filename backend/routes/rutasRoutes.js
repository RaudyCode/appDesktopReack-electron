import express from 'express';
import {
  crearRuta,
  obtenerRutas,
  obtenerRuta,
  actualizarRuta,
  eliminarRuta
} from '../controllers/rutasController.js';
import protegerRuta from '../middleware/authMiddleware.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protegerRuta);

// Rutas CRUD para rutas de cobro
router.post('/rutas', crearRuta);
router.get('/rutas', obtenerRutas);
router.get('/rutas/:id', obtenerRuta);
router.put('/rutas/:id', actualizarRuta);
router.delete('/rutas/:id', eliminarRuta);

export default router; 