import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageCircle, RefreshCw, UserPlus, Phone, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Customer, Message } from '../types';
import {
  Button,
  Input,
  Badge,
  Card,
  Avatar,
  AvatarFallback,
  Skeleton,
  EmptyState,
} from './ui';

const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'cust_1042', name: 'Aisha Khan', phone: '+919800000001' },
  { id: 'cust_1043', name: 'Rohan Sharma', phone: '+919800000002' },
  { id: 'cust_1044', name: 'Priya Patel', phone: '+919800000003' },
];

const SAMPLE_QUESTIONS = [
  "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?",
  "What is your return policy?",
  "Do you deliver to Dubai?",
  "Is cash on delivery available for a ₹3,500 order?",
  "I think I'm allergic to the serum I bought. What should I do?",
];

export const CustomerView: React.FC = () => {
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(SAMPLE_CUSTOMERS[0]);
  const [customName, setCustomName] = useState('');
  const [customPhone, setCustomPhone] = useState('');
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Poll conversation messages every 2.5 seconds
  const fetchMessages = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await api.getCustomerConversation(selectedCustomer.id);
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to load customer conversation:', err);
    } finally {
      if (!silent) {
        setLoading(false);
        setInitialLoaded(true);
      }
    }
  };

  useEffect(() => {
    setInitialLoaded(false);
    fetchMessages();
    const interval = setInterval(() => {
      fetchMessages(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [selectedCustomer.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim() || sending) return;

    setSending(true);
    try {
      await api.sendCustomerMessage(
        selectedCustomer.id,
        selectedCustomer.name,
        selectedCustomer.phone,
        text
      );
      if (!textToSend) setInputText('');
      await fetchMessages(true);
    } catch (err: any) {
      alert(`Error sending message: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleCreateCustomCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim() || !customPhone.trim()) return;
    const newCust: Customer = {
      id: `cust_${Math.floor(1000 + Math.random() * 9000)}`,
      name: customName.trim(),
      phone: customPhone.trim(),
    };
    setSelectedCustomer(newCust);
    setIsCreatingCustom(false);
    setCustomName('');
    setCustomPhone('');
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6">
      {/* Customer Selector Card */}
      <Card className="mb-4 overflow-hidden border-slate-200 shadow-xs">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Avatar size="lg">
              <AvatarFallback>{selectedCustomer.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base">{selectedCustomer.name}</span>
                <Badge variant="outline" size="sm" className="font-mono text-slate-600">
                  <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                  {selectedCustomer.phone}
                </Badge>
                <Badge variant="success" size="sm" className="font-mono">
                  {selectedCustomer.id}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Simulating customer WhatsApp view. Messages trigger webhook pipeline & AI drafting.
              </p>
            </div>
          </div>

          {/* Customer Switcher Pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs text-slate-400 mr-1 font-medium">Customer:</span>
            {SAMPLE_CUSTOMERS.map((cust) => (
              <Button
                key={cust.id}
                variant={selectedCustomer.id === cust.id ? 'default' : 'secondary'}
                size="sm"
                onClick={() => {
                  setSelectedCustomer(cust);
                  setIsCreatingCustom(false);
                }}
                className="text-xs"
              >
                {cust.name}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingCustom(!isCreatingCustom)}
              leftIcon={<UserPlus className="w-3 h-3 text-slate-500" />}
              className="text-xs border-dashed"
            >
              Custom
            </Button>
          </div>
        </div>

        {/* Custom Customer Creator Expandable */}
        {isCreatingCustom && (
          <form
            onSubmit={handleCreateCustomCustomer}
            className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-2.5"
          >
            <Input
              type="text"
              placeholder="Name (e.g. Maya Roy)"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="max-w-xs text-xs"
              required
            />
            <Input
              type="text"
              placeholder="Phone (e.g. +919876543210)"
              value={customPhone}
              onChange={(e) => setCustomPhone(e.target.value)}
              className="max-w-xs text-xs"
              required
            />
            <Button type="submit" size="sm" variant="default" className="text-xs">
              Use Profile
            </Button>
          </form>
        )}
      </Card>

      {/* Main Chat Interface */}
      <Card className="overflow-hidden shadow-sm flex flex-col h-[570px] border-slate-200">
        {/* Chat Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-sm text-white shadow-sm ring-2 ring-emerald-400/30">
              🌿
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">Verdant & Co Support</p>
              <p className="text-[11px] text-emerald-300 flex items-center font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                Online | Grounded in Knowledge Base
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => fetchMessages()}
            title="Refresh Conversation"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Message Thread Area */}
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#f8fafc]/90">
          {!initialLoaded && loading ? (
            <div className="space-y-4 p-4">
              <Skeleton className="h-12 w-3/4 ml-auto rounded-2xl" />
              <Skeleton className="h-14 w-2/3 rounded-2xl" />
              <Skeleton className="h-10 w-1/2 ml-auto rounded-2xl" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <EmptyState
                icon={<MessageCircle className="w-6 h-6 text-slate-400" />}
                title="No messages yet"
                description="Send a message below or pick one of the test questions to trigger the AI drafting flow."
              />
            </div>
          ) : (
            messages.map((msg) => {
              const isCustomer = msg.senderType === 'CUSTOMER';
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} animate-in fade-in-50 duration-200`}
                >
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-2xs leading-relaxed transition-all ${
                      isCustomer
                        ? 'bg-emerald-600 text-white rounded-br-xs'
                        : 'bg-white text-slate-900 border border-slate-200/90 rounded-bl-xs'
                    }`}
                  >
                    {!isCustomer && (
                      <div className="flex items-center space-x-1.5 mb-1.5">
                        <span className="text-[11px] font-bold text-emerald-800">Verdant Care Agent</span>
                        <Badge variant="success" size="sm" className="text-[9px] py-0">
                          <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                          Approved
                        </Badge>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`text-[10px] mt-1.5 text-right font-medium ${
                        isCustomer ? 'text-emerald-100/80' : 'text-slate-400'
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Questions (Core Test requirement) */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200/80">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-600 mr-1" />
              Quick Tests:
            </span>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={sending}
                  title={q}
                  className="px-2.5 py-1 text-xs bg-white hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 text-slate-700 rounded-lg border border-slate-200 shrink-0 max-w-xs truncate transition-all duration-150 shadow-2xs active:scale-[0.98]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Message Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center space-x-2"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message Verdant & Co as ${selectedCustomer.name}...`}
            className="flex-1"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || sending}
            loading={sending}
            size="default"
            variant="default"
            className="shrink-0 px-4"
          >
            <Send className="w-4 h-4 mr-1" />
            <span>Send</span>
          </Button>
        </form>
      </Card>

      {/* Helpful Hint */}
      <div className="mt-3.5 text-center">
        <p className="text-xs text-slate-500 font-medium">
          💡 <strong>Reviewer Tip:</strong> Send a message here, then switch to <strong>Agent View</strong> at the top to see the AI's generated reply draft, review or edit it, and click <strong>Approve</strong>!
        </p>
      </div>
    </div>
  );
};
