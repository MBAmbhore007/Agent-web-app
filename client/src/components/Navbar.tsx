import React from 'react';
import { User, Headphones, LogOut, Terminal, BookOpen, ShieldCheck, Sparkles } from 'lucide-react';
import { AgentUser } from '../types';
import { Button, Badge, AnimatedTabs } from './ui';

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
  const tabs = [
    {
      id: 'customer',
      label: 'Customer View',
      icon: <User className="w-3.5 h-3.5 text-emerald-600" />,
    },
    {
      id: 'agent',
      label: 'Agent View',
      icon: <Headphones className="w-3.5 h-3.5 text-slate-700" />,
      badge: agent ? (
        <span className="relative flex h-2 w-2 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      ) : undefined,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-2xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Presentation */}
          <div className="flex items-center space-x-3.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 via-emerald-600 to-green-500 flex items-center justify-center text-white font-bold shadow-sm shadow-emerald-700/20 ring-1 ring-emerald-500/20 select-none">
              <span className="text-base sm:text-lg">🌿</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                  Verdant & Co
                </span>
                <Badge variant="success" size="sm" className="hidden sm:inline-flex font-semibold shadow-2xs">
                  <Sparkles className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                  AI Co-pilot
                </Badge>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block font-medium">
                Customer Support & AI Response Platform
              </p>
            </div>
          </div>

          {/* Center: Animated Watermelon UI View Toggle */}
          <div className="flex items-center">
            <AnimatedTabs
              tabs={tabs}
              activeTab={currentView}
              onChange={(id) => onToggleView(id as 'customer' | 'agent')}
              size="md"
            />
          </div>

          {/* Right Tools & Authentication Controls */}
          <div className="flex items-center space-x-2">
            {/* Knowledge Base Modal */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenKnowledgeBase}
              leftIcon={<BookOpen className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs hidden md:inline-flex border-slate-200/90 hover:border-emerald-200 hover:bg-emerald-50/50"
            >
              Policies
            </Button>

            {/* Webhook Tester Simulator */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenWebhookTester}
              leftIcon={<Terminal className="w-3.5 h-3.5 text-blue-600" />}
              className="text-xs hidden sm:inline-flex border-slate-200/90 hover:border-blue-200 hover:bg-blue-50/50"
            >
              Webhook Test
            </Button>

            {/* Agent Auth Status */}
            {agent ? (
              <div className="flex items-center pl-2 border-l border-slate-200 space-x-2.5">
                <div className="hidden lg:block text-right">
                  <p className="text-xs font-bold text-slate-900 leading-tight">{agent.name}</p>
                  <p className="text-[10px] text-emerald-700 flex items-center justify-end font-medium">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 mr-0.5" />
                    Agent Active
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
