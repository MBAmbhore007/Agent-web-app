import React, { useState } from 'react';
import { Lock, Mail, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { AgentUser } from '../types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Alert,
  AlertDescription,
} from './ui';

interface AgentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (agent: AgentUser) => void;
}

export const AgentLoginModal: React.FC<AgentLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('agent@verdant.co');
  const [password, setPassword] = useState('verdant2026');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email, password);
      onSuccess(res.agent);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-md">
        <DialogHeader className="text-center sm:text-center items-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-emerald-100 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl">Support Agent Sign-In</DialogTitle>
          <DialogDescription>
            Enter your credentials to review queues and approve AI suggestions
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Agent Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              placeholder="agent@verdant.co"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-600 font-mono">
            <span className="font-sans font-semibold text-slate-700">Pre-seeded Test Credentials:</span>
            <div className="mt-1 flex items-center justify-between text-slate-800">
              <span>agent@verdant.co</span>
              <span>verdant2026</span>
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="submit"
              variant="default"
              size="lg"
              loading={loading}
              className="w-full text-sm font-semibold"
            >
              Sign In to Agent Portal
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
