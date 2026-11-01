import React from 'react';
import { User, Headphones, LogOut, Terminal, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentUser } from '../types';
import { Button, Badge } from './ui';

interface NavbarProps {
  currentView: 'customer' | 'agent';
  onToggleView: (view: 'customer' | 'agent') => void;
  agent: AgentUser | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  onOpenWebhookTester: () => void;
  onOpenKnowledgeBase: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onToggleView,
  agent,
  onLogout,
  onOpenLogin,
  onOpenWebhookTester,
  onOpenKnowledgeBase,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-green-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20 ring-1 ring-emerald-500/20">
              🌿
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">Verdant & Co</span>
                <Badge variant="success" size="sm" className="font-semibold shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                  AI Co-pilot
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">Customer Support & AI Drafting Platform</p>
            </div>
          </div>

          {/* Center: View Switcher (Customer vs Agent) */}
          <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => onToggleView('customer')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentView === 'customer'
                  ? 'bg-white text-slate-900 shadow-xs ring-1 ring-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer View</span>
            </button>
            <button
              onClick={() => onToggleView('agent')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentView === 'agent'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Agent View</span>
              {agent && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse ml-0.5" />}
            </button>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-2">
            {/* Knowledge Base Modal Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenKnowledgeBase}
              leftIcon={<BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs hidden sm:inline-flex"
            >
              Policies
            </Button>

            {/* Interactive Webhook Simulator Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWebhookTester}
              leftIcon={<Terminal className="w-3.5 h-3.5 text-blue-600" />}
              className="text-xs hidden sm:inline-flex"
            >
              Webhook Test
            </Button>

            {/* Agent Auth Actions */}
            {agent ? (
              <div className="flex items-center pl-2 border-l border-slate-200 space-x-2.5">
                <div className="hidden md:block text-right">
                  <p className="text-xs font-bold text-slate-800 leading-tight">{agent.name}</p>
                  <p className="text-[10px] text-slate-500 flex items-center justify-end font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 mr-0.5" />
                    Agent Logged In
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onLogout}
                  title="Sign out of Agent Account"
                  className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="subtle"
                size="sm"
                onClick={onOpenLogin}
                className="text-xs font-semibold"
              >
                Agent Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
