import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
      {/* Customer Switcher Card */}
      <Card className="mb-4 overflow-hidden border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <Avatar size="lg" className="ring-2 ring-emerald-500/20">
              <AvatarFallback className="bg-emerald-600 text-white font-bold text-sm">
                {selectedCustomer.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <span className="font-bold text-slate-900 text-sm sm:text-base tracking-tight">
                  {selectedCustomer.name}
                </span>
                <Badge variant="outline" size="sm" className="font-mono text-slate-600 bg-slate-50 border-slate-200">
                  <Phone className="w-2.5 h-2.5 mr-1 text-slate-400" />
                  {selectedCustomer.phone}
                </Badge>
                <Badge variant="success" size="sm" className="font-mono text-[10px]">
                  ID: {selectedCustomer.id}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Simulating customer WhatsApp channel. Messages trigger webhook ingestion & AI reply drafting.
              </p>
            </div>
          </div>

          {/* Customer Selection Pills */}
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs text-slate-400 mr-1 font-medium">Switch User:</span>
            {SAMPLE_CUSTOMERS.map((cust) => {
              const isSelected = selectedCustomer.id === cust.id;
              return (
                <button
                  key={cust.id}
                  onClick={() => {
                    setSelectedCustomer(cust);
                    setIsCreatingCustom(false);
                  }}
                  className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all duration-150 select-none ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs ring-1 ring-emerald-700/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80 active:scale-95'
                  }`}
                >
                  {cust.name}
                </button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreatingCustom(!isCreatingCustom)}
              leftIcon={<UserPlus className="w-3 h-3 text-slate-500" />}
              className="text-xs border-dashed rounded-xl"
            >
              + New
            </Button>
          </div>
        </div>

        {/* Custom Customer Creator Expandable */}
        <AnimatePresence>
          {isCreatingCustom && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleCreateCustomCustomer}
              className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-200/80 flex flex-wrap items-center gap-2.5 overflow-hidden"
            >
              <Input
                type="text"
                placeholder="Name (e.g. Maya Roy)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="max-w-xs text-xs h-8"
                required
              />
              <Input
                type="text"
                placeholder="Phone (e.g. +919876543210)"
                value={customPhone}
                onChange={(e) => setCustomPhone(e.target.value)}
                className="max-w-xs text-xs h-8"
                required
              />
              <Button type="submit" size="sm" variant="default" className="text-xs h-8 font-semibold">
                Use Profile
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </Card>

      {/* Main Chat Interface */}
      <Card className="overflow-hidden shadow-sm flex flex-col h-[570px] border-slate-200/90 ring-1 ring-slate-200/50">
        {/* Chat Window Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm text-white shadow-sm ring-2 ring-emerald-400/40">
                🌿
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wide">Verdant & Co Care</p>
              <p className="text-[11px] text-emerald-300/90 font-medium">
                Official Support • Grounded in Brand Knowledge Base
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
        <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-gradient-to-b from-slate-50/80 to-slate-100/50">
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
                title="Start a conversation"
                description="Type a question below or click one of the quick test queries to test the AI drafting flow."
              />
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                const isCustomer = msg.senderType === 'CUSTOMER';
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isCustomer ? 'justify-end' : 'justify-start'}`}
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
                          <Badge variant="success" size="sm" className="text-[9px] py-0 font-semibold">
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
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Sample Questions (Core Test requirement) */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-200/80">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold text-slate-500 flex items-center shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-600 mr-1" />
              Quick Tests:
            </span>
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
              {SAMPLE_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  disabled={sending}
                  title={q}
                  className="px-3 py-1 text-xs bg-slate-50 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-slate-700 font-medium rounded-xl border border-slate-200/90 shrink-0 max-w-xs truncate transition-all duration-150 shadow-2xs active:scale-[0.98]"
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
          className="p-3 bg-white border-t border-slate-200/80 flex items-center space-x-2"
        >
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message Verdant & Co as ${selectedCustomer.name}...`}
            className="flex-1 text-xs sm:text-sm h-10 rounded-xl"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || sending}
            loading={sending}
            size="default"
            variant="default"
            className="shrink-0 px-4 h-10 rounded-xl font-semibold"
          >
            <Send className="w-4 h-4 mr-1.5" />
            <span>Send</span>
          </Button>
        </form>
      </Card>

      {/* Helpful Hint */}
      <div className="mt-3.5 text-center">
        <p className="text-xs text-slate-500 font-medium">
          💡 <strong>Reviewer Tip:</strong> Send a message here, then switch to <strong>Agent View</strong> at the top to see the AI's generated reply draft, review or edit it, and click <strong>Approve & Send</strong>!
        </p>
      </div>
    </div>
  );
};
