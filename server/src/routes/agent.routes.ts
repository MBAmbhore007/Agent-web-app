import { Router, Response } from 'express';
import { requireAgentAuth, AuthenticatedRequest } from '../middleware/auth.middleware';
import { conversationService } from '../services/conversation.service';

const router = Router();

// All agent routes require agent authentication
router.use(requireAgentAuth);

/**
 * GET /api/agent/conversations
 * List of conversations for agent dashboard, sorted by newest activity first.
 */
router.get('/conversations', async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const list = await conversationService.getConversations();
    res.json({ conversations: list });
  } catch (error: any) {
    console.error('❌ Error fetching agent conversations:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversations' });
  }
});

/**
 * GET /api/agent/conversations/:id
 * Detailed conversation history with all messages and AI drafts.
 */
router.get('/conversations/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const convId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const conversation = await conversationService.getConversationById(convId);
    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found' });
      return;
    }
    res.json({ conversation });
  } catch (error: any) {
    console.error('❌ Error fetching conversation detail:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch conversation' });
  }
});

/**
 * POST /api/agent/conversations/:id/approve
 * Approves (and optionally edits) the AI draft.
 * Saves the text as an agent reply message in the conversation thread and marks draft as approved.
 */
router.post('/conversations/:id/approve', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { draftId, replyText } = req.body;

    if (!draftId || !replyText || !replyText.trim()) {
      res.status(400).json({ error: 'draftId and replyText are required' });
      return;
    }

    const convId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const result = await conversationService.approveDraft(
      convId,
      draftId,
      replyText.trim()
    );

    res.json({
      success: true,
      message: 'Draft approved and agent reply sent successfully',
      data: result,
    });
  } catch (error: any) {
    console.error('❌ Error approving draft:', error);
    res.status(500).json({ error: error.message || 'Failed to approve draft' });
  }
});

/**
 * POST /api/agent/conversations/:id/reply
 * Allows agent to send a manual reply directly into the conversation.
 */
router.post('/conversations/:id/reply', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Reply text is required' });
      return;
    }

    const convId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const agentMessage = await conversationService.sendManualAgentReply(
      convId,
      text.trim()
    );

    res.json({
      success: true,
      message: 'Agent reply sent successfully',
      agentMessage,
    });
  } catch (error: any) {
    console.error('❌ Error sending agent reply:', error);
    res.status(500).json({ error: error.message || 'Failed to send reply' });
  }
});

/**
 * POST /api/agent/messages/:messageId/regenerate
 * Re-triggers AI draft generation for a specific message (e.g. if it previously failed or was edited).
 */
router.post('/messages/:messageId/regenerate', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const msgId = Array.isArray(req.params.messageId) ? req.params.messageId[0] : req.params.messageId;
    const updatedDraft = await conversationService.regenerateDraft(msgId);
    res.json({
      success: true,
      draft: updatedDraft,
    });
  } catch (error: any) {
    console.error('❌ Error regenerating draft:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate draft' });
  }
});

export default router;

