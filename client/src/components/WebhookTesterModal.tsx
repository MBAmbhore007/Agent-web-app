import React, { useState } from 'react';
import { Terminal, Play, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import { api } from '../services/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Badge,
} from './ui';

interface WebhookTesterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookTesterModal: React.FC<WebhookTesterModalProps> = ({ isOpen, onClose }) => {
  const defaultSecret = 'verdant-demo-secret-2026';
  const defaultPayload = {
    event_id: 'evt_' + Math.random().toString(36).substring(2, 10),
    type: 'message.received',
    brand_id: 'verdant-co',
    timestamp: new Date().toISOString(),
    customer: {
      id: 'cust_1042',
      name: 'Aisha Khan',
      phone: '+919800000001',
    },
    message: {
      id: 'msg_' + Math.random().toString(36).substring(2, 9),
      type: 'text',
      text: "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?",
    },
  };

  const [payloadText, setPayloadText] = useState(JSON.stringify(defaultPayload, null, 2));
  const [secret, setSecret] = useState(defaultSecret);
  const [testInvalidSignature, setTestInvalidSignature] = useState(false);
  const [sending, setSending] = useState(false);
  const [responseResult, setResponseResult] = useState<any>(null);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Browser HMAC-SHA256 implementation
  const computeHmacSha256 = async (keyText: string, messageText: string): Promise<string> => {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(keyText),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const signature = await crypto.subtle.sign('HMAC', key, enc.encode(messageText));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleSendWebhook = async () => {
    setSending(true);
    setResponseResult(null);

    try {
      const parsed = JSON.parse(payloadText);
      const rawBody = JSON.stringify(parsed);
      let hexSignature = await computeHmacSha256(secret, rawBody);

      if (testInvalidSignature) {
        hexSignature = '0000000000000000000000000000000000000000000000000000000000000000';
      }

      const sigHeader = `sha256=${hexSignature}`;
      const result = await api.sendWebhook(parsed, sigHeader);
      setResponseResult(result);
    } catch (err: any) {
      setResponseResult({
        ok: false,
        status: 400,
        data: { error: err.message || 'Failed to process JSON payload' },
      });
    } finally {
      setSending(false);
    }
  };

  const generateCurlCommand = () => {
    return `curl -X POST http://localhost:5000/webhook \\
  -H "Content-Type: application/json" \\
  -H "X-Signature: sha256=<HMAC_HEX>" \\
  -d '${payloadText.replace(/'/g, "'\\''")}'`;
  };

  const copyCurl = () => {
    navigator.clipboard.writeText(generateCurlCommand());
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[90vh] flex flex-col p-6">
        <DialogHeader className="text-left">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shadow-2xs">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-base">Interactive Webhook Simulator</DialogTitle>
              <DialogDescription>
                Test POST /webhook with real HMAC-SHA256 signature verification
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 pr-1 my-2">
          {/* Secret configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Webhook Secret Key</label>
              <Input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="font-mono text-xs"
              />
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center space-x-2 text-slate-700 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={testInvalidSignature}
                  onChange={(e) => setTestInvalidSignature(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
                <span className="text-xs font-semibold">Test invalid signature (Expect 401)</span>
              </label>
            </div>
          </div>

          {/* JSON Payload Editor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">JSON Payload</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyCurl}
                leftIcon={copiedCurl ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                className="text-xs h-7 text-blue-600 hover:text-blue-800"
              >
                {copiedCurl ? 'Copied curl!' : 'Copy curl'}
              </Button>
            </div>
            <Textarea
              rows={8}
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="font-mono text-xs bg-slate-900 text-emerald-400 border-slate-800 focus-visible:ring-blue-500"
            />
          </div>

          {/* Response Box */}
          {responseResult && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center space-x-2">
                {responseResult.ok ? (
                  <Badge variant="success" size="sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Status {responseResult.status} OK
                  </Badge>
                ) : (
                  <Badge variant="destructive" size="sm">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Status {responseResult.status} Rejected
                  </Badge>
                )}
                <span className="text-xs font-bold text-slate-700">
                  {responseResult.ok ? 'Webhook processed successfully' : 'Signature or validation error'}
                </span>
              </div>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-lg text-xs font-mono overflow-x-auto leading-relaxed">
                {JSON.stringify(responseResult.data, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Close
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSendWebhook}
            loading={sending}
            leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
            className="text-xs bg-blue-600 hover:bg-blue-700 font-semibold"
          >
            Send Signed Webhook
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
