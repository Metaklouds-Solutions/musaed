import { AppState } from '../types';

export const INITIAL_DATA: AppState = {
  me: { id: 'u1', name: 'Admin User', email: 'admin@agentos.ai', role: 'ADMIN' },
  tenants: [
    {
      id: 't_001',
      name: 'Demo Retailer',
      status: 'ACTIVE',
      plan: 'PRO',
      timezone: 'Asia/Karachi',
      locale: 'en-US',
      createdAt: '2026-01-15T08:00:00Z',
      onboarding: { step: 4, complete: true },
      members: [
        { id: 'm1', email: 'ops@demo.com', role: 'MANAGER' },
        { id: 'm2', email: 'support@demo.com', role: 'AGENT_VIEWER' }
      ],
      agentProfile: {
        name: 'Store Assistant',
        language: 'en',
        persona: 'Helpful retail concierge',
        defaultBehaviors: ['Friendly greeting', 'Product lookup', 'Order tracking']
      },
      policies: {
        piiMasking: true,
        retentionDays: 30,
        allowedChannels: ['phone', 'web']
      },
      quotas: {
        callsPerDay: 200,
        concurrentSessions: 10,
        tokensPerMin: 50000
      },
      tools: [
        { key: 'order_status', name: 'Order Status', enabled: true },
        { key: 'product_search', name: 'Product Search', enabled: true },
        { key: 'inventory_check', name: 'Inventory Check', enabled: false }
      ],
      integrations: [
        { type: 'twilio', status: 'CONNECTED' },
        { type: 'shopify', status: 'DISCONNECTED' },
        { type: 'zendesk', status: 'DISCONNECTED' }
      ]
    },
    {
      id: 't_002',
      name: 'Global Logistics',
      status: 'PENDING',
      plan: 'ENTERPRISE',
      timezone: 'UTC',
      locale: 'en-GB',
      createdAt: '2026-02-10T14:30:00Z',
      onboarding: { step: 2, complete: false },
      members: [
        { id: 'm3', email: 'admin@logistics.com', role: 'ADMIN' }
      ],
      agentProfile: {
        name: 'Logistics Bot',
        language: 'en',
        persona: 'Efficient tracking assistant',
        defaultBehaviors: ['Status updates', 'Route optimization']
      },
      policies: {
        piiMasking: true,
        retentionDays: 90,
        allowedChannels: ['web', 'kiosk']
      },
      quotas: {
        callsPerDay: 1000,
        concurrentSessions: 50,
        tokensPerMin: 200000
      },
      tools: [
        { key: 'track_package', name: 'Track Package', enabled: true },
        { key: 'reschedule_delivery', name: 'Reschedule Delivery', enabled: true }
      ],
      integrations: [
        { type: 'twilio', status: 'DISCONNECTED' },
        { type: 'salesforce', status: 'CONNECTED' }
      ]
    }
  ],
  sessions: [
    {
      id: 's_1001',
      tenantId: 't_001',
      callerPhone: '+1 555-0101',
      patientId: 'p_001',
      intent: 'BOOKING',
      outcome: 'BOOKED',
      duration: 185,
      agentVersion: 'v2.4-flash',
      aiFlags: ['High Confidence'],
      status: 'ENDED',
      startedAt: '2026-02-20T10:10:00Z',
      endedAt: '2026-02-20T10:13:05Z',
      summary: [
        'Patient requested a follow-up appointment.',
        'Verified insurance details.',
        'Booked for next Tuesday at 10 AM.'
      ],
      entities: {
        name: 'John Doe',
        bookingType: 'FOLLOW_UP',
        date: '2026-02-24',
        provider: 'Dr. Smith'
      },
      transcript: [
        { speaker: 'AGENT', text: 'Hello, thank you for calling. How can I help you today?', ts: '10:10:01' },
        { speaker: 'USER', text: 'Hi, I need to book a follow-up with Dr. Smith.', ts: '10:10:05' },
        { speaker: 'AGENT', text: 'I can help with that. Are you looking for next week?', ts: '10:10:10' }
      ]
    },
    {
      id: 's_1002',
      tenantId: 't_001',
      callerPhone: '+1 555-0102',
      intent: 'BOOKING',
      outcome: 'PENDING',
      duration: 45,
      agentVersion: 'v2.4-flash',
      aiFlags: ['Missing Email', 'New Patient'],
      status: 'ACTIVE',
      startedAt: '2026-02-20T13:40:00Z',
      summary: ['New patient inquiry.', 'Capturing demographics.'],
      entities: { name: 'Jane Smith' },
      transcript: [
        { speaker: 'AGENT', text: 'Welcome! Is this your first time visiting us?', ts: '13:40:01' },
        { speaker: 'USER', text: 'Yes, it is. I want to schedule a checkup.', ts: '13:40:05' }
      ]
    }
  ],
  auditLogs: [
    {
      id: 'a1',
      ts: '2026-02-20T09:00:00Z',
      actor: 'Admin User',
      action: 'TENANT_CREATED',
      target: 't_001',
      tenantId: 't_001'
    }
  ],
  patients: [
    {
      id: 'p_001',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+1 555-0101',
      dob: '1985-05-12',
      insurance: 'Blue Cross',
      tags: ['Frequent'],
      createdAt: '2026-01-20T10:00:00Z'
    },
    {
      id: 'p_002',
      name: 'Jane Smith',
      email: 'jane@smith.io',
      phone: '+1 555-0102',
      dob: '1992-11-23',
      tags: ['New Patient'],
      createdAt: '2026-02-01T15:30:00Z'
    }
  ],
  bookings: [
    {
      id: 'b_001',
      tenantId: 't_001',
      patientId: 'p_001',
      type: 'FOLLOW_UP',
      reason: 'Post-op checkup',
      provider: 'Dr. Smith',
      location: 'Downtown Clinic',
      preferredWindow: 'Next Tuesday morning',
      scheduledAt: '2026-02-24T10:00:00Z',
      status: 'CONFIRMED',
      sourceCallId: 's_1001',
      createdAt: '2026-02-20T10:13:05Z'
    }
  ]
};
