export interface Customer {
  id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface AIDraft {
  id: string;
  messageId: string;
  conversationId: string;
  draftText: string;
  status: 'PENDING' | 'APPROVED' | 'EDITED' | 'DISCARDED' | 'FAILED';
  errorMessage?: string | null;
  modelUsed?: string | null;
  approvedAt?: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId?: string;
  senderType: 'CUSTOMER' | 'AGENT';
  text: string;
  createdAt: string;
  aiDraft?: AIDraft | null;
}

export interface ConversationSummary {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  status: string;
  lastActivityAt: string;
  latestMessage: {
    id: string;
    senderType: 'CUSTOMER' | 'AGENT';
    text: string;
    createdAt: string;
  } | null;
  pendingDraft: AIDraft | null;
}

export interface ConversationDetail {
  id: string;
  customerId: string;
  customer: Customer;
  status: string;
  lastActivityAt: string;
  createdAt: string;
  messages: Message[];
}

export interface AgentUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

