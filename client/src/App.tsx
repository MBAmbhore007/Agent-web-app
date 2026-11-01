import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { CustomerView } from './components/CustomerView';
import { AgentView } from './components/AgentView';
import { AgentLoginModal } from './components/AgentLoginModal';
import { WebhookTesterModal } from './components/WebhookTesterModal';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { api, getStoredAgent } from './services/api';
import { AgentUser } from './types';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'customer' | 'agent'>('customer');
  const [agent, setAgent] = useState<AgentUser | null>(getStoredAgent());
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isWebhookOpen, setIsWebhookOpen] = useState(false);
  const [isKbOpen, setIsKbOpen] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await api.getMe();
        if (res.agent) {
          setAgent(res.agent);
        }
      } catch {
        setAgent(null);
      }
    };
    checkAuth();
  }, []);

  const handleLogout = () => {
    api.logout();
    setAgent(null);
  };

  const handleLoginSuccess = (authenticatedAgent: AgentUser) => {
    setAgent(authenticatedAgent);
    setCurrentView('agent');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Navbar
        currentView={currentView}
        onToggleView={(view) => setCurrentView(view)}
        agent={agent}
        onLogout={handleLogout}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenWebhookTester={() => setIsWebhookOpen(true)}
        onOpenKnowledgeBase={() => setIsKbOpen(true)}
      />

      <main className="flex-1">
        {currentView === 'customer' ? (
          <CustomerView />
        ) : (
          <AgentView
            agent={agent}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}
      </main>

      {/* Modals */}
      <AgentLoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onSuccess={handleLoginSuccess}
      />

      <WebhookTesterModal
        isOpen={isWebhookOpen}
        onClose={() => setIsWebhookOpen(false)}
      />

      <KnowledgeBaseModal
        isOpen={isKbOpen}
        onClose={() => setIsKbOpen(false)}
      />
    </div>
  );
};

export default App;

