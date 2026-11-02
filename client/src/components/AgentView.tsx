import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  MessageSquare,
  Send,
  AlertTriangle,
  Clock,
  Shield,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../services/api';
import { AgentUser, ConversationDetail, ConversationSummary } from '../types';
import {
  Button,
  Badge,
  Card,
  Input,
  Textarea,
  Alert,
  AlertTitle,
  AlertDescription,
  Skeleton,
  EmptyState,
  Avatar,
  AvatarFallback,
} from './ui';

interface AgentViewProps {
  agent: AgentUser | null;
  onOpenLogin: () => void;
}

export const AgentView: React.FC<AgentViewProps> = ({ agent, onOpenLogin }) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<ConversationDetail | null>(null);
  const [draftEdits, setDraftEdits] = useState<{ [draftId: string]: string }>({});
  const [manualReplyText, setManualReplyText] = useState('');

  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [initialListLoaded, setInitialListLoaded] = useState(false);
  const [approving, setApproving] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sendingManual, setSendingManual] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile responsive state: allows toggling between list and detail on small screens
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  // 1. Fetch conversation list
  const fetchConversations = async (silent = false) => {
    if (!agent) return;
    if (!silent) setLoadingList(true);
    try {
      const list = await api.getAgentConversations();
      setConversations(list);

      // Auto-select first conversation if none selected
      if (!selectedConvId && list.length > 0) {
        setSelectedConvId(list[0].id);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      if (!silent) {
        setLoadingList(false);
        setInitialListLoaded(true);
      }
    }
  };

  // 2. Fetch selected conversation details
  const fetchConversationDetail = async (id: string, silent = false) => {
    if (!agent || !id) return;
    if (!silent) setLoadingDetail(true);
    try {
      const conv = await api.getConversationDetail(id);
      setActiveConversation(conv);

      // Pre-populate draft edits for any pending drafts
      conv.messages.forEach((msg) => {
        if (msg.aiDraft && msg.aiDraft.status === 'PENDING') {
          setDraftEdits((prev) => ({
            ...prev,
            [msg.aiDraft!.id]: prev[msg.aiDraft!.id] !== undefined ? prev[msg.aiDraft!.id] : msg.aiDraft!.draftText,
          }));
        }
      });
    } catch (err) {
      console.error('Error fetching conversation detail:', err);
    } finally {
      if (!silent) setLoadingDetail(false);
    }
  };

  // Poll conversation list & active conversation
  useEffect(() => {
    if (agent) {
      fetchConversations();
      const interval = setInterval(() => {
        fetchConversations(true);
        if (selectedConvId) {
          fetchConversationDetail(selectedConvId, true);
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [agent, selectedConvId]);

  useEffect(() => {
    if (selectedConvId && agent) {
      fetchConversationDetail(selectedConvId);
    }
  }, [selectedConvId]);

  // Handle Approve Draft
  const handleApprove = async (draftId: string) => {
    if (!selectedConvId || approving) return;
    const textToApprove = draftEdits[draftId];
    if (!textToApprove || !textToApprove.trim()) {
      alert('Draft text cannot be empty');
      return;
    }

    setApproving(true);
    try {
      await api.approveDraft(selectedConvId, draftId, textToApprove);
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversations(true);
    } catch (err: any) {
      alert(`Failed to approve draft: ${err.message}`);
    } finally {
      setApproving(false);
    }
  };

  // Handle Regenerate Draft
  const handleRegenerate = async (messageId: string, draftId: string) => {
    if (regenerating) return;
    setRegenerating(true);
    try {
      const res = await api.regenerateDraft(messageId);
      if (res.draft) {
        setDraftEdits((prev) => ({
          ...prev,
          [draftId]: res.draft.draftText,
        }));
      }
      if (selectedConvId) {
        await fetchConversationDetail(selectedConvId, true);
      }
    } catch (err: any) {
      alert(`Failed to regenerate draft: ${err.message}`);
    } finally {
      setRegenerating(false);
    }
  };

  // Handle Manual Agent Reply
  const handleSendManualReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !manualReplyText.trim() || sendingManual) return;

    setSendingManual(true);
    try {
      await api.sendAgentReply(selectedConvId, manualReplyText.trim());
      setManualReplyText('');
      await fetchConversationDetail(selectedConvId, true);
      await fetchConversations(true);
    } catch (err: any) {
      alert(`Failed to send agent reply: ${err.message}`);
    } finally {
      setSendingManual(false);
    }
  };

  // Unauthenticated view
  if (!agent) {
    return (
      <div className="max-w-md mx-auto my-16 px-4">
        <Card className="text-center p-8 border-slate-200/90 shadow-md">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-100 shadow-2xs">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">Agent Sign-In Required</h2>
          <p className="text-xs text-slate-600 mb-6 leading-relaxed">
            The Agent workspace is restricted to authorized Verdant & Co agents to review conversations, inspect customer inquiries, and approve AI draft suggestions.
          </p>
          <Button
            onClick={onOpenLogin}
            variant="default"
            size="lg"
            className="w-full text-sm font-semibold"
          >
            Sign In to Agent Portal
          </Button>
          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 font-mono">
            Default: <span className="font-semibold text-slate-800">agent@verdant.co</span> / <span className="font-semibold text-slate-800">verdant2026</span>
          </div>
        </Card>
      </div>
    );
  }

  // Filter conversations
  const filteredConversations = conversations.filter((c) =>
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.customerPhone.includes(searchQuery) ||
    (c.latestMessage?.text || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[720px]">
        {/* Left Column: Customer Conversations Queue (4 cols) */}
        <Card
          className={`lg:col-span-5 xl:col-span-4 flex flex-col overflow-hidden border-slate-200/90 shadow-2xs ${
            showMobileDetail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Queue Header */}
          <div className="p-4 border-b border-slate-200/80 bg-slate-50/70">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <h2 className="font-bold text-slate-900 text-sm tracking-tight">Inbox Queue</h2>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="success" size="sm" className="font-mono font-semibold">
                  {conversations.length} active
                </Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => fetchConversations()}
                  title="Refresh conversation queue"
                  className="text-slate-400 hover:text-slate-700"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5" />}
              className="text-xs h-8 bg-white"
            />
          </div>

          {/* Conversation Queue Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {!initialListLoaded && loadingList ? (
              <div className="p-4 space-y-3">
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8">
                <EmptyState
                  icon={<MessageSquare className="w-5 h-5" />}
                  title="No conversations found"
                  description="New customer messages from WhatsApp or webhooks will appear here."
                />
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = conv.id === selectedConvId;
                const hasPendingDraft = conv.pendingDraft !== null;
                const isLastFromCustomer = conv.latestMessage?.senderType === 'CUSTOMER';

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConvId(conv.id);
                      setShowMobileDetail(true);
                    }}
                    className={`p-3.5 cursor-pointer transition-all duration-150 select-none ${
                      isSelected
                        ? 'bg-emerald-50/80 border-l-4 border-emerald-600 shadow-2xs'
                        : 'hover:bg-slate-50/90'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <Avatar size="sm">
                          <AvatarFallback className="text-[11px] font-bold bg-slate-200 text-slate-700">
                            {conv.customerName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-bold text-xs text-slate-900 truncate max-w-[140px]">
                          {conv.customerName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono font-medium">
                        {new Date(conv.lastActivityAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-1 mb-2 font-normal pl-9">
                      {isLastFromCustomer && <span className="font-bold text-emerald-800">Customer: </span>}
                      {conv.latestMessage ? conv.latestMessage.text : 'No messages'}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pl-9">
                      <span className="text-slate-400 font-mono">{conv.customerPhone}</span>
                      {hasPendingDraft ? (
                        <Badge variant="success" size="sm" className="font-semibold shadow-2xs">
                          <Sparkles className="w-2.5 h-2.5 mr-1 text-emerald-600" />
                          Draft Ready
                        </Badge>
                      ) : isLastFromCustomer ? (
                        <Badge variant="warning" size="sm" className="font-medium">
                          <Clock className="w-2.5 h-2.5 mr-1" />
                          Needs Reply
                        </Badge>
                      ) : (
                        <Badge variant="secondary" size="sm" className="font-medium text-slate-500">
                          <Check className="w-2.5 h-2.5 mr-1 text-slate-400" />
                          Replied
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Column: Conversation Details & AI Suggested Reply Workspace (8 cols) */}
        <Card
          className={`lg:col-span-7 xl:col-span-8 flex flex-col overflow-hidden border-slate-200/90 shadow-2xs ${
            !showMobileDetail ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {activeConversation ? (
            <>
              {/* Conversation Top Header */}
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mobile Back Button */}
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowMobileDetail(false)}
                    className="lg:hidden text-slate-500 mr-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Avatar size="md" className="ring-1 ring-slate-200">
                    <AvatarFallback className="bg-emerald-600 text-white font-bold text-xs">
                      {activeConversation.customer.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="font-bold text-slate-900 text-sm tracking-tight">
                        {activeConversation.customer.name}
                      </h3>
                      <Badge variant="outline" size="sm" className="font-mono text-slate-600 bg-white">
                        {activeConversation.customer.phone}
                      </Badge>
                      <Badge variant="success" size="sm" className="font-mono text-[10px]">
                        ID: {activeConversation.customer.id}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Conversation ID: <span className="font-mono text-slate-600">{activeConversation.id}</span>
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => fetchConversationDetail(activeConversation.id)}
                  title="Refresh Conversation"
                  className="text-slate-500 hover:text-slate-800"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDetail ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              {/* Message History & AI Draft Review Area */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-gradient-to-b from-slate-50/40 to-slate-100/40">
                {activeConversation.messages.map((msg) => {
                  const isCustomer = msg.senderType === 'CUSTOMER';
                  const draft = msg.aiDraft;

                  return (
                    <div key={msg.id} className="space-y-3">
                      {/* Chat Bubble */}
                      <div className={`flex ${isCustomer ? 'justify-start' : 'justify-end'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-2xs leading-relaxed transition-all ${
                            isCustomer
                              ? 'bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs'
                              : 'bg-emerald-600 text-white rounded-tr-xs'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] mb-1 font-semibold">
                            <span className={isCustomer ? 'text-slate-700' : 'text-emerald-100'}>
                              {isCustomer ? activeConversation.customer.name : 'Verdant Support Agent'}
                            </span>
                            <span className={isCustomer ? 'text-slate-400 text-[10px]' : 'text-emerald-200 text-[10px]'}>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>

                      {/* AI Suggested Reply Panel (Critical Component) */}
                      {draft && draft.status === 'PENDING' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.25 }}
                          className="mx-1 sm:mx-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/90 via-teal-50/40 to-white border border-emerald-300 shadow-sm ring-1 ring-emerald-400/20"
                        >
                          {/* Panel Header */}
                          <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center space-x-2">
                              <span className="p-1.5 bg-emerald-600 text-white rounded-xl shadow-2xs">
                                <Sparkles className="w-3.5 h-3.5" />
                              </span>
                              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                                AI Suggested Reply
                              </span>
                              {draft.modelUsed && (
                                <Badge variant="outline" size="sm" className="bg-white/80 border-emerald-200 text-emerald-900 font-mono text-[10px]">
                                  {draft.modelUsed}
                                </Badge>
                              )}
                            </div>
                            <Badge variant="success" size="sm" className="font-semibold shadow-2xs">
                              Review Required
                            </Badge>
                          </div>

                          <p className="text-xs text-slate-600 mb-2.5 leading-relaxed">
                            Review and edit the AI-generated reply below. Once approved, it will be delivered directly to the customer.
                          </p>

                          {/* Editable AI Response Textarea */}
                          <Textarea
                            rows={3}
                            value={draftEdits[draft.id] !== undefined ? draftEdits[draft.id] : draft.draftText}
                            onChange={(e) =>
                              setDraftEdits({
                                ...draftEdits,
                                [draft.id]: e.target.value,
                              })
                            }
                            className="w-full text-xs sm:text-sm bg-white border-emerald-300 focus-visible:ring-emerald-500 shadow-2xs leading-relaxed rounded-xl font-normal"
                            placeholder="Edit suggested reply..."
                          />

                          {/* Action Buttons: Regenerate & Approve & Send */}
                          <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-emerald-200/60">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRegenerate(msg.id, draft.id)}
                              loading={regenerating}
                              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
                              className="text-xs bg-white text-slate-700 hover:bg-slate-100 rounded-xl"
                            >
                              Regenerate
                            </Button>

                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleApprove(draft.id)}
                              loading={approving}
                              leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="text-xs font-bold px-4 rounded-xl shadow-xs"
                            >
                              Approve & Send
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {/* AI Draft Failed State (Handling 2 a.m. System Failure Scenario) */}
                      {draft && draft.status === 'FAILED' && (
                        <Alert variant="warning" className="mx-1 sm:mx-3 rounded-2xl">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>AI Draft Generation Failed</AlertTitle>
                          <AlertDescription>
                            {draft.errorMessage || 'System error or LLM timeout while drafting response.'}
                            <div className="mt-2.5 flex items-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRegenerate(msg.id, draft.id)}
                                loading={regenerating}
                                className="text-xs bg-white border-amber-300 text-amber-900 hover:bg-amber-100/50 rounded-xl"
                              >
                                Retry AI Draft
                              </Button>
                              <span className="text-[11px] text-amber-700 font-medium">or send a manual reply below.</span>
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Display already approved indicator */}
                      {draft && (draft.status === 'APPROVED' || draft.status === 'EDITED') && (
                        <div className="ml-4 text-[11px] text-emerald-700 font-medium flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                          AI Draft was approved and delivered at{' '}
                          {draft.approvedAt ? new Date(draft.approvedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'earlier'}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Bottom Manual Agent Reply Box */}
              <form
                onSubmit={handleSendManualReply}
                className="p-3 bg-white border-t border-slate-200/90 flex items-center space-x-2"
              >
                <Input
                  placeholder="Type a custom message as agent..."
                  value={manualReplyText}
                  onChange={(e) => setManualReplyText(e.target.value)}
                  className="flex-1 text-xs sm:text-sm h-10 rounded-xl"
                  disabled={sendingManual}
                />
                <Button
                  type="submit"
                  disabled={!manualReplyText.trim() || sendingManual}
                  loading={sendingManual}
                  size="default"
                  variant="secondary"
                  className="text-xs font-semibold px-4 h-10 rounded-xl"
                >
                  <Send className="w-3.5 h-3.5 mr-1" />
                  <span>Send</span>
                </Button>
              </form>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <EmptyState
                icon={<MessageSquare className="w-6 h-6" />}
                title="Select a conversation"
                description="Choose a customer thread from the inbox queue on the left to review messages and approve AI drafts."
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
