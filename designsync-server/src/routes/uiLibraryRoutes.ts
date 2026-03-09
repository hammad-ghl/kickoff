import { Router } from 'express';
import {
  createUILibrary,
  getAllUILibraries,
  getUILibrary,
  updateUILibrary,
  deleteUILibrary,
  syncUILibrary,
} from '../controllers/uiLibraryController';

const router = Router();

router.post('/', createUILibrary);
router.get('/', getAllUILibraries);
router.get('/:id', getUILibrary);
router.put('/:id', updateUILibrary);
router.delete('/:id', deleteUILibrary);
router.post('/:id/sync', syncUILibrary);

export default router;
