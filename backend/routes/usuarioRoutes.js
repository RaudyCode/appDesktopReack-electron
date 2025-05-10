import express from 'express';
import { 
  crearUsuario,
  obtenerUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario
} from '../controllers/usuarioController.js';

const router = express.Router();

router.post('/usuarios', crearUsuario);
router.get('/usuarios', obtenerUsuarios);
router.get('/usuarios/:id', obtenerUsuario);
router.put('/usuarios/:id', actualizarUsuario);
router.delete('/usuarios/:id', eliminarUsuario);

export default router;
