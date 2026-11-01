import { Router, Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { requireAgentAuth, AuthenticatedRequest } from '../middleware/auth.middleware';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const result = await authService.authenticateAgent(email, password);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Authentication failed' });
  }
});

router.get('/me', requireAgentAuth, (req: AuthenticatedRequest, res: Response): void => {
  res.json({ agent: req.agent });
});

export default router;

