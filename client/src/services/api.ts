import { AgentUser, ConversationDetail, ConversationSummary, Customer } from '../types';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('verdant_agent_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('verdant_agent_token', token);
  } else {
    localStorage.removeItem('verdant_agent_token');
  }
}

export function getStoredAgent(): AgentUser | null {
  const data = localStorage.getItem('verdant_agent_user');
  return data ? JSON.parse(data) : null;
}

export function setStoredAgent(agent: AgentUser | null) {
  if (agent) {
    localStorage.setItem('verdant_agent_user', JSON.stringify(agent));
  } else {
    localStorage.removeItem('verdant_agent_user');
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  headers.set('Content-Type', 'application/json');

  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    setStoredToken(null);
    setStoredAgent(null);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ token: string; agent: AgentUser }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Login failed');
    }
    setStoredToken(data.token);
    setStoredAgent(data.agent);
    return data;
  },

  logout() {
    setStoredToken(null);
    setStoredAgent(null);
  },

  async getMe(): Promise<{ agent: AgentUser }> {
    return fetchWithAuth(`${API_BASE}/auth/me`);
  },

  // Agent Endpoints
  async getAgentConversations(): Promise<ConversationSummary[]> {
    const data = await fetchWithAuth(`${API_BASE}/agent/conversations`);
    return data.conversations;
  },

  async getConversationDetail(id: string): Promise<ConversationDetail> {
    const data = await fetchWithAuth(`${API_BASE}/agent/conversations/${id}`);
    return data.conversation;
  },

  async approveDraft(conversationId: string, draftId: string, replyText: string) {
    return fetchWithAuth(`${API_BASE}/agent/conversations/${conversationId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ draftId, replyText }),
    });
  },

  async sendAgentReply(conversationId: string, text: string) {
    return fetchWithAuth(`${API_BASE}/agent/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  async regenerateDraft(messageId: string) {
    return fetchWithAuth(`${API_BASE}/agent/messages/${messageId}/regenerate`, {
      method: 'POST',
    });
  },

  // Customer Endpoints
  async getCustomers(): Promise<Customer[]> {
    const res = await fetch(`${API_BASE}/customer/customers`);
    const data = await res.json();
    return data.customers || [];
  },

  async getCustomerConversation(customerId: string): Promise<{ conversation: any; messages: any[] }> {
    const res = await fetch(`${API_BASE}/customer/conversations/${customerId}`);
    const data = await res.json();
    return data;
  },

  async sendCustomerMessage(customerId: string, customerName: string, customerPhone: string, text: string) {
    const res = await fetch(`${API_BASE}/customer/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customerId, customerName, customerPhone, text }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to send message');
    }
    return data;
  },

  // Send test webhook directly
  async sendWebhook(payload: any, signature: string) {
    const res = await fetch('/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { status: res.status, ok: res.ok, data };
  },
};

