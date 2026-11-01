import { Router, Request, Response } from 'express';
import { conversationService } from '../services/conversation.service';
import { prisma } from '../db/client';

const router = Router();

/**
 * GET /api/customer/customers
 * Returns pre-seeded or existing customers so the user can easily select one in the test tool.
 */
router.get('/customers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json({ customers });
  } catch (error: any) {
    console.error('❌ Error fetching test customers:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch test customers' });
  }
});

/**
 * GET /api/customer/conversations/:customerId
 * Customer view conversation thread.
 * STRICT: Returns only customer messages and agent replies. Drafts are omitted.
 */
router.get('/conversations/:customerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const custId = Array.isArray(req.params.customerId) ? req.params.customerId[0] : req.params.customerId;
    const conversation = await conversationService.getCustomerConversation(custId);

    if (!conversation) {
      res.json({ conversation: null, messages: [] });
      return;
    }

    res.json({ conversation, messages: conversation.messages });
  } catch (error: any) {
    console.error('❌ Error fetching customer conversation:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversation' });
  }
});

/**
 * POST /api/customer/messages
 * Sends message from the Customer view.
 * Handles it identically to the webhook endpoint (same database saving, same AI draft generation).
 */
router.post('/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { customerId, customerName, customerPhone, text } = req.body;

    if (!customerId || !customerName || !customerPhone || !text || !text.trim()) {
      res.status(400).json({
        error: 'customerId, customerName, customerPhone, and text are required',
      });
      return;
    }

    const result = await conversationService.processCustomerMessage(
      {
        id: customerId,
        name: customerName,
        phone: customerPhone,
      },
      {
        text: text.trim(),
        rawPayload: { source: 'customer_view', ...req.body },
      }
    );

    res.status(201).json({
      success: true,
      conversationId: result.conversation.id,
      message: {
        id: result.message.id,
        senderType: result.message.senderType,
        text: result.message.text,
        createdAt: result.message.createdAt,
      },
    });
  } catch (error: any) {
    console.error('❌ Error processing customer message:', error);
    res.status(500).json({ error: error.message || 'Failed to process message' });
  }
});

export default router;

