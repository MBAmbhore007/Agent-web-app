import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client';
import { config } from '../config';

export interface AgentPayload {
  id: string;
  email: string;
  name: string;
  role: string;
}

export class AuthService {
  async authenticateAgent(email: string, password: string) {
    const agent = await prisma.agent.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!agent) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, agent.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    const payload: AgentPayload = {
      id: agent.id,
      email: agent.email,
      name: agent.name,
      role: agent.role,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '7d' });

    return {
      token,
      agent: payload,
    };
  }

  verifyToken(token: string): AgentPayload {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as AgentPayload;
      return decoded;
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }
}

export const authService = new AuthService();

