import { Router, Response } from 'express';
import { verifyWebhookSignature, RequestWithRawBody } from '../middleware/verifyWebhookSignature';
import { conversationService } from '../services/conversation.service';

const router = Router();

/**
 * POST /webhook
 * Receives incoming customer messages from chat webhook or external test tools.
 * Verifies HMAC-SHA256 signature and persists customer, conversation, message, and AI draft.
 */
router.post('/', verifyWebhookSignature, async (req: RequestWithRawBody, res: Response): Promise<void> => {
  try {
    const { event_id, type, brand_id, customer, message } = req.body;

    // Validate payload shape per assessment specification
    if (!customer || !customer.id || !customer.name || !customer.phone) {
      res.status(400).json({
        error: 'Invalid payload: customer object with id, name, and phone is required',
      });
      return;
    }

    if (!message || !message.text) {
      res.status(400).json({
        error: 'Invalid payload: message object with text is required',
      });
      return;
    }

    const result = await conversationService.processCustomerMessage(
      {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
      },
      {
        id: message.id,
        text: message.text,
        rawPayload: req.body,
      }
    );

    res.status(200).json({
      success: true,
      event_id: event_id || null,
      brand_id: brand_id || 'verdant-co',
      type: type || 'message.received',
      conversation_id: result.conversation.id,
      message_id: result.message.id,
      draft_id: result.draft?.id,
      draft_status: result.draft?.status,
    });
  } catch (error: any) {
    console.error('❌ Error handling webhook:', error);
    res.status(500).json({
      error: 'Internal server error while processing webhook',
      message: error?.message || 'Unknown error',
    });
  }
});

export default router;

