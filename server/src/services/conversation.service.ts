import { prisma } from '../db/client';
import { llmService, ChatMessageContext } from './llm.service';

export interface CustomerInput {
  id: string;
  name: string;
  phone: string;
}

export interface MessageInput {
  id?: string;
  text: string;
  rawPayload?: any;
}

export class ConversationService {
  /**
   * Processes an incoming customer message:
   * 1. Upserts customer
   * 2. Finds or creates open conversation
   * 3. Stores customer message
   * 4. Asynchronously/synchronously generates AI draft using Knowledge Base
   */
  async processCustomerMessage(customerData: CustomerInput, messageData: MessageInput) {
    // 1. Upsert Customer
    const customer = await prisma.customer.upsert({
      where: { id: customerData.id },
      update: {
        name: customerData.name,
        phone: customerData.phone,
      },
      create: {
        id: customerData.id,
        name: customerData.name,
        phone: customerData.phone,
      },
    });

    // 2. Find or create single open conversation for this customer
    let conversation = await prisma.conversation.findFirst({
      where: {
        customerId: customer.id,
        status: 'OPEN',
      },
      orderBy: {
        lastActivityAt: 'desc',
      },
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          customerId: customer.id,
          status: 'OPEN',
          lastActivityAt: new Date(),
        },
      });
    } else {
      // Update lastActivityAt
      conversation = await prisma.conversation.update({
        where: { id: conversation.id },
        data: { lastActivityAt: new Date() },
      });
    }

    // 3. Create customer message
    const messageId = messageData.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Check if message already processed (idempotency check for webhooks)
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
      include: { aiDraft: true },
    });

    if (existingMessage) {
      console.log(`ℹ️ Message ${messageId} already exists (idempotent replay).`);
      return {
        customer,
        conversation,
        message: existingMessage,
        draft: existingMessage.aiDraft,
      };
    }

    const message = await prisma.message.create({
      data: {
        id: messageId,
        conversationId: conversation.id,
        senderType: 'CUSTOMER',
        text: messageData.text,
        rawPayload: messageData.rawPayload || null,
        createdAt: new Date(),
      },
    });

    // 4. Fetch recent conversation history for LLM context
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
      take: 6,
    });

    const historyContext: ChatMessageContext[] = recentMessages.map((m) => ({
      senderType: m.senderType as 'CUSTOMER' | 'AGENT',
      text: m.text,
    }));

    // 5. Generate AI draft
    let draftResult;
    try {
      draftResult = await llmService.generateReply(
        customer.name,
        message.text,
        historyContext
      );
    } catch (llmError: any) {
      console.error('❌ Failed to generate AI draft:', llmError);
      draftResult = {
        draftText: '',
        modelUsed: 'unknown',
        success: false,
        error: llmError?.message || 'Error communicating with LLM service',
      };
    }

    // 6. Save AI draft associated with message
    const aiDraft = await prisma.aIDraft.create({
      data: {
        messageId: message.id,
        conversationId: conversation.id,
        draftText: draftResult.draftText || '',
        status: draftResult.success ? 'PENDING' : 'FAILED',
        errorMessage: draftResult.error || null,
        modelUsed: draftResult.modelUsed || null,
      },
    });

    return {
      customer,
      conversation,
      message,
      draft: aiDraft,
    };
  }

  /**
   * Retrieves all conversations for the Agent view, sorted by newest activity first.
   */
  async getConversations() {
    const conversations = await prisma.conversation.findMany({
      orderBy: { lastActivityAt: 'desc' },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { aiDraft: true },
        },
      },
    });

    return conversations.map((conv) => {
      const latestMessage = conv.messages[0] || null;
      return {
        id: conv.id,
        customerId: conv.customerId,
        customerName: conv.customer.name,
        customerPhone: conv.customer.phone,
        status: conv.status,
        lastActivityAt: conv.lastActivityAt,
        latestMessage: latestMessage
          ? {
              id: latestMessage.id,
              senderType: latestMessage.senderType,
              text: latestMessage.text,
              createdAt: latestMessage.createdAt,
            }
          : null,
        pendingDraft: latestMessage?.aiDraft?.status === 'PENDING' ? latestMessage.aiDraft : null,
      };
    });
  }

  /**
   * Retrieves conversation by ID with all messages and AI drafts (for Agent View).
   */
  async getConversationById(conversationId: string) {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            aiDraft: true,
          },
        },
      },
    });

    return conversation;
  }

  /**
   * Approves an AI draft (or edited version), saving it as an agent reply message.
   */
  async approveDraft(conversationId: string, draftId: string, approvedText: string) {
    const draft = await prisma.aIDraft.findUnique({
      where: { id: draftId },
    });

    if (!draft) {
      throw new Error('Draft not found');
    }

    if (draft.conversationId !== conversationId) {
      throw new Error('Draft does not belong to this conversation');
    }

    // 1. Mark draft as APPROVED / EDITED
    const wasEdited = draft.draftText.trim() !== approvedText.trim();
    const updatedDraft = await prisma.aIDraft.update({
      where: { id: draftId },
      data: {
        draftText: approvedText,
        status: wasEdited ? 'EDITED' : 'APPROVED',
        approvedAt: new Date(),
      },
    });

    // 2. Insert Agent Message in the conversation
    const agentMessageId = `msg_agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const agentMessage = await prisma.message.create({
      data: {
        id: agentMessageId,
        conversationId,
        senderType: 'AGENT',
        text: approvedText,
        createdAt: new Date(),
      },
    });

    // 3. Update conversation last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date() },
    });

    return {
      approvedDraft: updatedDraft,
      agentMessage,
    };
  }

  /**
   * Sends a manual Agent reply message.
   */
  async sendManualAgentReply(conversationId: string, text: string) {
    const agentMessageId = `msg_agent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const agentMessage = await prisma.message.create({
      data: {
        id: agentMessageId,
        conversationId,
        senderType: 'AGENT',
        text,
        createdAt: new Date(),
      },
    });

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date() },
    });

    return agentMessage;
  }

  /**
   * Re-triggers AI draft generation for a specific message (e.g. if it failed or agent wants a refresh).
   */
  async regenerateDraft(messageId: string) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: {
          include: { customer: true },
        },
        aiDraft: true,
      },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Fetch context
    const recentMessages = await prisma.message.findMany({
      where: { conversationId: message.conversationId },
      orderBy: { createdAt: 'asc' },
      take: 6,
    });

    const historyContext: ChatMessageContext[] = recentMessages.map((m) => ({
      senderType: m.senderType as 'CUSTOMER' | 'AGENT',
      text: m.text,
    }));

    const draftResult = await llmService.generateReply(
      message.conversation.customer.name,
      message.text,
      historyContext
    );

    let updatedDraft;
    if (message.aiDraft) {
      updatedDraft = await prisma.aIDraft.update({
        where: { id: message.aiDraft.id },
        data: {
          draftText: draftResult.draftText,
          status: draftResult.success ? 'PENDING' : 'FAILED',
          errorMessage: draftResult.error || null,
          modelUsed: draftResult.modelUsed,
        },
      });
    } else {
      updatedDraft = await prisma.aIDraft.create({
        data: {
          messageId: message.id,
          conversationId: message.conversationId,
          draftText: draftResult.draftText,
          status: draftResult.success ? 'PENDING' : 'FAILED',
          errorMessage: draftResult.error || null,
          modelUsed: draftResult.modelUsed,
        },
      });
    }

    return updatedDraft;
  }

  /**
   * Retrieves conversation for Customer View.
   * STRICT SECURITY & SPEC RULE: Customer only sees their conversation and approved agent replies.
   * CUSTOMERS NEVER SEE DRAFTS!
   */
  async getCustomerConversation(customerId: string) {
    const conversation = await prisma.conversation.findFirst({
      where: { customerId, status: 'OPEN' },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          // Notice: aiDraft is deliberately omitted so customer never receives draft data!
          select: {
            id: true,
            senderType: true,
            text: true,
            createdAt: true,
          },
        },
      },
    });

    return conversation;
  }
}

export const conversationService = new ConversationService();

