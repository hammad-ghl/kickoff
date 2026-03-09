import { Router } from 'express';
import {
  initiateOAuth,
  handleCallback,
  getSession,
  logout,
  listRepos,
  listBranches,
  listDirectories,
  syncComponents,
} from '../controllers/authController';

const router = Router();

router.get('/github', initiateOAuth);
router.get('/github/callback', handleCallback);
router.get('/session', getSession);
router.post('/logout', logout);

router.get('/repos', listRepos);
router.get('/repos/:owner/:repo/branches', listBranches);
router.get('/repos/:owner/:repo/directories', listDirectories);
router.post('/sync-components', syncComponents);

export default router;
