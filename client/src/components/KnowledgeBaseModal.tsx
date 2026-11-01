import React from 'react';
import { BookOpen, ShieldCheck } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Badge,
} from './ui';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const POLICIES = [
  {
    topic: 'Shipping',
    policy: 'Orders ship within 24 hours, Monday to Saturday. Delivery takes 3-5 business days in metro cities and 5-8 business days elsewhere in India.',
  },
  {
    topic: 'Address change',
    policy: 'The delivery address can be changed only before the order has shipped, and only if the customer contacts us within 12 hours of placing it. After shipping, the address cannot be changed.',
  },
  {
    topic: 'Cancellation',
    policy: 'An order can be cancelled before it ships. After it ships, the customer can refuse delivery and a refund is issued once the parcel returns to us.',
  },
  {
    topic: 'Returns',
    policy: 'Returns are accepted within 7 days of delivery for unopened, unused products. Opened products are accepted only if damaged or if the wrong item was sent.',
  },
  {
    topic: 'Refunds',
    policy: 'Approved refunds go back to the original payment method within 5-7 business days after we receive the returned parcel.',
  },
  {
    topic: 'Cash on delivery',
    policy: 'Cash on delivery is available for orders under ₹3,000, with a ₹50 fee.',
  },
  {
    topic: 'Ingredients',
    policy: 'All Verdant & Co products are fragrance-free and vegan.',
  },
];

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent onClose={onClose} className="max-w-2xl max-h-[85vh] flex flex-col p-6">
        <DialogHeader className="text-left">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-2xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <DialogTitle className="text-base">Verdant & Co Knowledge Base</DialogTitle>
                <Badge variant="success" size="sm">
                  7 Policies
                </Badge>
              </div>
              <DialogDescription>
                Sole source of truth for all AI-generated suggested replies
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 pr-1 my-2 text-xs">
          {POLICIES.map((item, idx) => (
            <div key={idx} className="py-3.5 first:pt-1">
              <div className="flex items-center space-x-2 mb-1.5">
                <Badge variant="outline" size="sm" className="font-bold text-slate-800 bg-slate-50">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 mr-1" />
                  {item.topic}
                </Badge>
              </div>
              <p className="text-slate-600 leading-relaxed pl-1">{item.policy}</p>
            </div>
          ))}
        </div>

        <DialogFooter className="pt-3">
          <Button variant="default" size="sm" onClick={onClose} className="text-xs font-semibold">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
