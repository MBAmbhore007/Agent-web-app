import { Request, Response, NextFunction } from 'express';
import { authService, AgentPayload } from '../services/auth.service';

export interface AuthenticatedRequest extends Request {
  agent?: AgentPayload;
}

export function requireAgentAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Agent sign-in required. Missing or malformed Authorization header.' });
    return;
  }

  const token = authHeader.substring(7);

  try {
    const agent = authService.verifyToken(token);
    req.agent = agent;
    next();
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Unauthorized' });
  }
}

