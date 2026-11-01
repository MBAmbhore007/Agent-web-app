import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  webhookSecret: process.env.WEBHOOK_SECRET || 'verdant-demo-secret-2026',
  jwtSecret: process.env.JWT_SECRET || 'verdant-jwt-secret-dev-2026',
  databaseUrl: process.env.DATABASE_URL || '',

  // LLM Configurations
  llmProvider: process.env.LLM_PROVIDER || 'auto', // 'openai' | 'groq' | 'gemini' | 'auto'
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  openaiBaseUrl: process.env.OPENAI_BASE_URL || '', // Can be used for OpenRouter or DeepInfra

  groqApiKey: process.env.GROQ_API_KEY || '',
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',

  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-1.5-flash',

  // Brand and Knowledge Base
  brand: {
    id: 'verdant-co',
    name: 'Verdant & Co',
    industry: 'Online Skincare',
  },
  knowledgeBase: [
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
  ],
};

