import {
  createRepository,
  deleteRepository,
  getAllRepositories,
  getRepository,
  getRepositoryClusters,
  reindexRepositoryHandler,
  searchRepository,
  updateRepository,
} from '../controllers/repositoryController';

import { Router } from 'express';

const router = Router();

router.post('/', createRepository);
router.get('/', getAllRepositories);
router.get('/:id', getRepository);
router.get('/:id/clusters', getRepositoryClusters);
router.put('/:id', updateRepository);
router.delete('/:id', deleteRepository);
router.post('/:id/reindex', reindexRepositoryHandler);
router.post('/:id/search', searchRepository);

export default router;
