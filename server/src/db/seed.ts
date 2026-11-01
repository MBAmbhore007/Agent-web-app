import bcrypt from 'bcryptjs';
import { prisma } from './client';
import { llmService } from '../services/llm.service';

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create or update Default Agent
  const passwordHash = await bcrypt.hash('verdant2026', 10);
  const agent = await prisma.agent.upsert({
    where: { email: 'agent@verdant.co' },
    update: {
      passwordHash,
      name: 'Verdant Support Agent',
    },
    create: {
      email: 'agent@verdant.co',
      passwordHash,
      name: 'Verdant Support Agent',
      role: 'AGENT',
    },
  });
  console.log(`✅ Agent seeded: ${agent.email} (Password: verdant2026)`);

  // 2. Seed Test Customers
  const customers = [
    {
      id: 'cust_1042',
      name: 'Aisha Khan',
      phone: '+919800000001',
    },
    {
      id: 'cust_1043',
      name: 'Rohan Sharma',
      phone: '+919800000002',
    },
    {
      id: 'cust_1044',
      name: 'Priya Patel',
      phone: '+919800000003',
    },
  ];

  for (const c of customers) {
    await prisma.customer.upsert({
      where: { id: c.id },
      update: { name: c.name, phone: c.phone },
      create: c,
    });
  }
  console.log(`✅ Seeded ${customers.length} test customers.`);

  // 3. Seed the assessment scenario for Aisha Khan
  // "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?"
  const aishaConv = await prisma.conversation.upsert({
    where: { id: 'conv_aisha_demo_01' },
    update: { lastActivityAt: new Date() },
    create: {
      id: 'conv_aisha_demo_01',
      customerId: 'cust_1042',
      status: 'OPEN',
      lastActivityAt: new Date(),
    },
  });

  const msgId = 'msg_88213';
  const existingMsg = await prisma.message.findUnique({ where: { id: msgId } });

  if (!existingMsg) {
    const aishaMsg = await prisma.message.create({
      data: {
        id: msgId,
        conversationId: aishaConv.id,
        senderType: 'CUSTOMER',
        text: "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?",
        rawPayload: {
          event_id: 'evt_7f3a91c2',
          type: 'message.received',
          brand_id: 'verdant-co',
          timestamp: '2026-11-03T10:15:22Z',
          customer: {
            id: 'cust_1042',
            name: 'Aisha Khan',
            phone: '+919800000001',
          },
          message: {
            id: 'msg_88213',
            type: 'text',
            text: "Hi, my order #4471 hasn't arrived yet. Can I change the delivery address?",
          },
        },
        createdAt: new Date(),
      },
    });

    // Generate initial AI draft for Aisha
    const draftResult = await llmService.generateReply(
      'Aisha Khan',
      aishaMsg.text,
      []
    );

    await prisma.aIDraft.create({
      data: {
        messageId: aishaMsg.id,
        conversationId: aishaConv.id,
        draftText: draftResult.draftText,
        status: 'PENDING',
        modelUsed: draftResult.modelUsed,
      },
    });

    console.log(`✅ Seeded demo conversation & AI draft for Aisha Khan.`);
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

