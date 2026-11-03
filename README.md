# Verdant & Co — AI Support Co-pilot

A full-stack AI customer support co-pilot built for **Verdant & Co**, a fictional online skincare brand. The system receives incoming customer messages via an authenticated webhook, uses an LLM grounded strictly in Verdant & Co's knowledge base to draft suggested replies, and provides an agent web application where human support agents review, edit, and approve replies before they are added to the conversation.

Built for the **Datastraw Technologies Software Engineer (AI & Product Engineering)** Take-Home Assessment.

---

## Features

- **Authenticated Webhook (`POST /webhook`)**:
  - Securely receives customer messages formatted per specification.
  - Verifies cryptographic HMAC-SHA256 signatures (`X-Signature: sha256=<hex>`) using the shared secret `verdant-demo-secret-2026` via constant-time buffer comparison (`crypto.timingSafeEqual`).
  - Idempotent: duplicate webhook events/messages are gracefully deduplicated.
- **AI Suggested Reply Engine**:
  - Grounded strictly in the **Verdant & Co Knowledge Base** (Shipping, Address Changes, Cancellations, Returns, Refunds, COD, Ingredients).
  - Multi-provider support: **Groq** (`llama-3.3-70b`), **OpenAI** (`gpt-4o-mini`), **Google Gemini** (`gemini-1.5-flash`), and an **Intelligent Knowledge Base Rule Engine fallback** (100% reliable offline testing without API keys).
  - Drafts are suggestions only — never automatically delivered to customers.
- **Agent Web Application**:
  - **Secure Sign-in**: Only authenticated agents can access conversation lists and draft approvals.
  - **Real-Time Conversation Queue**: Chronologically sorted with newest activity first, showing customer details, message previews, and review status.
  - **Review & Approval Interface**: Displays message history, the AI-drafted reply in an editable card, and a one-click **"Approve & Send"** button.
  - **Manual Reply & Regeneration**: Agents can edit drafts, regenerate them on-demand, or type manual replies.
- **Customer & Agent Toggle**:
  - Top switch seamlessly flips between **Customer View** and **Agent View** to test and demonstrate both sides of the WhatsApp conversation in real time.
  - Test customer selector (Aisha Khan, Rohan Sharma, Priya Patel, or Custom Customers).
  - Quick-test prompt buttons for all 5 sample queries from the assessment.
  - **Strict Security**: The Customer view _never_ sees or receives draft suggestions; only approved agent messages appear.
- **Built-in Webhook Simulator**:
  - Interactive browser modal to craft custom JSON payloads, compute HMAC signatures with Web Crypto, and test valid/invalid signatures directly against `/webhook`.

---

## Tech Stack

- **Backend**: TypeScript, Node.js, Express, Prisma ORM
- **Database**: PostgreSQL (compatible with Neon, Supabase, Railway, Docker, or local PostgreSQL)
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, **Watermelon UI Design System (`ui.watermelon.sh`)**, Lucide Icons
- **AI / LLM**: Groq / OpenAI / Google Gemini API + Deterministic Fallback Engine
- **Auth**: JWT & bcryptjs password hashing

---

## Watermelon UI Modernization

The user interface was modernized using the **Watermelon UI** component ecosystem (`ui.watermelon.sh`):

- **Component Library (`client/src/components/ui/`)**:
  - `Button`: Clean interactive buttons with variant states (primary, secondary, outline, ghost, destructive) and loading spinners.
  - `Card`: Elevated containers with translucent glassmorphic surfaces, subtle borders, and header/content/footer partitions.
  - `Badge` & `AnimatedBadge`: Status pills for conversation priority, review status, and LLM provider tags with glowing accent pulses.
  - `AnimatedTabs`: Segmented controls with sliding backdrop indicator for seamless switching between Customer and Agent views.
  - `Dialog`: Accessible modal overlays for Knowledge Base browsing, Agent Login, and Webhook Testing.
  - `Input` & `Textarea`: Polished input fields with focused emerald ring accents and disabled state styling.
  - `Avatar`: Initials and photo avatars with status indicator rings.
  - `Skeleton`: Smooth pulsing placeholders for conversation lists and message threads during loading.
  - `EmptyState`: Contextual empty states with icons, clean typography, and action triggers.
- **Brand Palette**:
  - Deep Navy background (`#020617` / `#0B132B`)
  - Verdant Emerald accents (`#10B981` / `#059669`)
  - Subtle borders and high-contrast readable typography conforming to WCAG AA guidelines.

---

## How to Run the Project Locally

### 1. Prerequisites

- **Node.js** (v18 or higher recommended; developed on Node v22)
- **PostgreSQL Database** (a local Postgres server or a free cloud instance such as [Neon](https://neon.tech) or [Supabase](https://supabase.com))

### 2. Clone and Install Dependencies

```bash
git clone <your-repo-url>
cd "Data Straw"

# Install root dependencies
npm install

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
cd ..
```

### 3. Configure Environment Variables

Create `.env` in the `server/` directory:

```bash
cp server/.env.example server/.env
```

Edit `server/.env` with your PostgreSQL connection string and optional LLM keys:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection String (Neon, Supabase, local Postgres)
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/verdant_support?schema=public"

# Webhook Secret from assessment spec
WEBHOOK_SECRET="verdant-demo-secret-2026"

# Agent JWT Secret
JWT_SECRET="verdant-jwt-secret-dev-2026"

# Optional: LLM Providers (If omitted, system uses built-in Knowledge Base fallback)
GROQ_API_KEY=""
OPENAI_API_KEY=""
GEMINI_API_KEY=""
```

### 4. Push Database Schema & Seed Data

Run Prisma db push to generate tables in PostgreSQL, then seed test data:

```bash
cd server
npx prisma db push
npx ts-node src/db/seed.ts
cd ..
```

_The seed script populates the default agent account (`agent@verdant.co` / `verdant2026`), test customers (Aisha Khan, Rohan Sharma, Priya Patel), and seeds the Aisha Khan assessment conversation with a pending AI draft ready for review._

### 5. Start the Application

You can start both backend and frontend concurrently from the root directory:

```bash
npm run dev
```

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Webhook Endpoint**: [http://localhost:5000/webhook](http://localhost:5000/webhook)

---

## 🧪 Testing the Webhook Directly

### Option A: Using the CLI Test Script

Run our built-in test script that generates the valid HMAC-SHA256 signature and sends the payload:

```bash
cd server
npx ts-node ../scripts/test-webhook.ts "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?"
```

### Option B: Using cURL

Calculate HMAC-SHA256 of the raw body using secret `verdant-demo-secret-2026` and pass it in the `X-Signature` header:

```bash
curl -X POST http://localhost:5000/webhook \
  -H "Content-Type: application/json" \
  -H "X-Signature: sha256=<COMPUTED_HEX>" \
  -d '{
    "event_id": "evt_7f3a91c2",
    "type": "message.received",
    "brand_id": "verdant-co",
    "timestamp": "2026-11-03T10:15:22Z",
    "customer": {
      "id": "cust_1042",
      "name": "Aisha Khan",
      "phone": "+919800000001"
    },
    "message": {
      "id": "msg_88213",
      "type": "text",
      "text": "Hi, my order #4471 hasn\x27t arrived yet. Can I change the delivery address?"
    }
  }'
```

### Option C: Using the Browser Webhook Simulator

Click the **"Webhook Test"** button in the top navigation bar of the web app. It lets you send valid or intentionally invalid signatures with one click and see the raw response immediately.

---

## Decisions Made & What Was Left Out

### Key Technical Decisions:

1. **Full-Prompt Ingestion vs Vector Database**:
   - For a focused 7-topic knowledge base, injecting the policies directly into the system prompt is strictly superior to vector embeddings. It incurs zero embedding latency, avoids chunk boundary truncation, guarantees 100% retrieval recall, and eliminates vector database hosting overhead.
2. **Raw Body Buffer Capture for HMAC Validation**:
   - Signature verification fails if computed over `JSON.stringify(req.body)` because JSON serialization does not preserve original key order or spacing. We configured Express to capture the raw incoming buffer (`req.rawBody`) and validated with `crypto.timingSafeEqual` to prevent timing attacks.
3. **Multi-Provider LLM with Built-in Fallback Engine**:
   - Supports Groq, OpenAI, and Gemini, but includes a deterministic Knowledge Base rule engine so the reviewer can run the app immediately without requiring an external API key.
4. **Strict Customer Data Boundary**:
   - The `/api/customer/conversations/:id` endpoint explicitly strips draft information at the database projection level. Customers can never inspect network payloads to view unapproved drafts.

### What Was Left Out Due to Time Constraints:

1. **Real-time WebSockets / SSE**: Replaced with clean 2.5–3 second client polling to minimize connection state complexity while keeping the UI responsive.
2. **Multi-Tenant Brand Partitioning**: The schema currently targets the Verdant & Co brand (`verdant-co`).
3. **Agent Collision Locking**: In a high-volume team, two agents could open Aisha's draft simultaneously. A production system would implement Redis-based distributed locks or presence indicators.
4. **WhatsApp Cloud API Adapter**: Instead of Meta Graph API webhooks, we used the simplified JSON specification provided in the assessment.

---

## Where AI Helped, and Where It Got Something Wrong

### Where AI Helped:

- Accelerating the initial scaffolding of TypeScript types, Prisma schema models, and Tailwind styling components.
- Formulating precise few-shot prompt guidelines for empathetic skincare tone and handling out-of-boundary questions (like allergy reactions or international shipping).

### Where It Got Something Wrong:

- When implementing HMAC-SHA256 signature verification in Express, standard AI code generated `crypto.createHmac('sha256', secret).update(JSON.stringify(req.body)).digest('hex')`.
- **The bug**: `JSON.stringify(req.body)` changes key ordering, removes whitespace, and fails cryptographic verification when a client sends formatted JSON with newlines or different key ordering. We resolved this by tapping into `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })` to ensure byte-perfect cryptographic parity.

---

## Answers to the Two Short Questions

### Question 1:

> _A customer message arrives at 2 a.m. and something in your system fails. What does the agent see the next morning, and how would you find out what went wrong?_

**What the agent sees**:
The customer’s message is securely stored in the database and displayed at the top of the conversation list marked with an amber **"AI Draft Failed"** badge. When the agent opens the conversation, they see the customer's message, an inline alert card stating the draft failed to generate with the error reason, an active **"Retry AI Draft"** button, and an open manual response box so they can immediately type and send a reply without blocking customer service.

**How we find out what went wrong**:
The webhook handler logs failures with structured JSON containing the `event_id`, `conversation_id`, timestamp (2 a.m.), error stack, and HTTP status. Using centralized logging (e.g., Datadog, AWS CloudWatch, or Sentry), we search for `level=error` and timestamps around 2:00 a.m. to pinpoint the exact failure point — whether it was an LLM provider rate limit (429), an API timeout (504), a database connection pool exhaustion, or an invalid webhook payload.

---

### Question 2:

> _This now has to serve 20 brands, each with its own knowledge base and agents. What would you change first, and why?_

**What to change first, and why**:
The first change is the data architecture: introduce a first-class `Brand` entity and add a `brand_id` foreign key with composite indices to `conversations`, `messages`, `ai_drafts`, `knowledge_bases`, and `agents` (or an `agent_brands` relation table).

**Why**:
Multi-tenant data isolation and security are foundational boundaries that must be enforced at the database and routing layers before adding any other feature. An agent assigned to Brand A must never see Brand B’s customer inquiries or private policies, and incoming webhooks must dynamically look up Brand B's unique HMAC secret (`brand.webhook_secret`) and Brand B's scoped knowledge base. Once brand-level data isolation is established, brand-specific prompt routing, vector embeddings, and agent RBAC cleanly build upon it without risk of cross-tenant data leaks.

---
