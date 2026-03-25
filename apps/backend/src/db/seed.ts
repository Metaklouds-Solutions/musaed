import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env file
const result = dotenv.config({ path: path.resolve(__dirname, '../../.env') });
if (result.error) {
  console.warn(
    '⚠️  Warning: .env file not found, falling back to system environment variables',
  );
}

// Validate MONGODB_URI
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined. Add it to your .env file.');
  console.error(
    '   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/musaed?retryWrites=true&w=majority&appName=mosaed',
  );
  process.exit(1);
}

// Validate seed passwords — never fall back to weak defaults
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`❌ ${name} environment variable is required for seeding.`);
    process.exit(1);
  }
  return value;
}

const ADMIN_SEED_PASSWORD: string = requireEnv('ADMIN_SEED_PASSWORD');
const OWNER_SEED_PASSWORD: string = requireEnv('OWNER_SEED_PASSWORD');

// Ensure DB name is present (MongoDB URIs with multiple hosts fail new URL() parsing)
const dbPathMatch = MONGODB_URI.match(/\/[a-zA-Z0-9_-]+(\?|$)/);
if (!dbPathMatch || dbPathMatch[0] === '/?' || dbPathMatch[0] === '/') {
  console.error('❌ MONGODB_URI is missing the database name (e.g. /musaed).');
  process.exit(1);
}

// ─── Schemas ────────────────────────────────────────────────────────────────

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: String,
    stripeProductId: String,
    stripePriceId: String,
    monthlyPriceCents: Number,
    maxVoiceAgents: Number,
    maxChatAgents: Number,
    maxEmailAgents: Number,
    maxStaff: Number,
    features: mongoose.Schema.Types.Mixed,
    isActive: Boolean,
  },
  { timestamps: true, collection: 'subscription_plans' },
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, default: null },
    name: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['ADMIN', 'TENANT_OWNER', 'STAFF'],
    },
    status: {
      type: String,
      default: 'active',
      enum: ['pending', 'active', 'disabled'],
    },
    avatarUrl: String,
    lastLoginAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, collection: 'users' },
);

const tenantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    status: { type: String, default: 'ACTIVE' },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    timezone: { type: String, default: 'Asia/Riyadh' },
    locale: { type: String, default: 'ar' },
    onboardingStep: { type: Number, default: 4 },
    onboardingComplete: { type: Boolean, default: true },
    settings: { type: Object, default: {} },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'tenants' },
);

const tenantStaffSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: true,
    },
    roleSlug: { type: String, required: true },
    status: { type: String, required: true },
    invitedAt: { type: Date, default: null },
    joinedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'tenant_staff' },
);

const agentTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: false },
    description: { type: String, default: '' },
    category: { type: String, default: '' },
    channel: { type: String, enum: ['voice', 'chat', 'email'], required: true },
    supportedChannels: [{ type: String, enum: ['voice', 'chat', 'email'] }],
    capabilityLevel: { type: String, default: 'L1' },
    flowTemplate: { type: Object, default: {} },
    version: { type: Number, default: 1 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true, collection: 'agent_templates' },
);

// ─── Models ─────────────────────────────────────────────────────────────────

const SubscriptionPlan = mongoose.model(
  'SubscriptionPlan',
  subscriptionPlanSchema,
);
const User = mongoose.model('User', userSchema);
const Tenant = mongoose.model('Tenant', tenantSchema);
const TenantStaff = mongoose.model('TenantStaff', tenantStaffSchema);
const AgentTemplate = mongoose.model('AgentTemplate', agentTemplateSchema);

// ─── Seed Data ───────────────────────────────────────────────────────────────

const PLANS = [
  {
    name: 'Starter',
    stripeProductId: null,
    stripePriceId: null,
    monthlyPriceCents: 0,
    maxVoiceAgents: 1,
    maxChatAgents: 1,
    maxEmailAgents: 0,
    maxStaff: 3,
    features: { support: 'email' },
    isActive: true,
  },
  {
    name: 'Professional',
    stripeProductId: null,
    stripePriceId: null,
    monthlyPriceCents: 4900,
    maxVoiceAgents: 5,
    maxChatAgents: 5,
    maxEmailAgents: 2,
    maxStaff: 15,
    features: { support: 'priority', analytics: true },
    isActive: true,
  },
  {
    name: 'Enterprise',
    stripeProductId: null,
    stripePriceId: null,
    monthlyPriceCents: 19900,
    maxVoiceAgents: -1,
    maxChatAgents: -1,
    maxEmailAgents: -1,
    maxStaff: -1,
    features: { support: 'dedicated', analytics: true, sso: true },
    isActive: true,
  },
];

// ─── Seed Function ───────────────────────────────────────────────────────────

async function seed() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI as string, {
      appName: 'mosaed',
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 10_000,
      socketTimeoutMS: 45_000,
      directConnection: false,
      family: 4,
    });
    console.log('✅ Connected to MongoDB\n');

    // ── Subscription Plans ──
    console.log('📦 Seeding subscription plans...');
    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans === 0) {
      await SubscriptionPlan.insertMany(PLANS);
      console.log('   ✅ Seeded: Starter, Professional, Enterprise\n');
    } else {
      console.log('   ⏭️  Subscription plans already exist, skipping\n');
    }

    // ── Admin User ──
    console.log('👤 Seeding admin user...');
    const adminEmail = 'admin@musaed.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const adminPassword = ADMIN_SEED_PASSWORD;
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      await User.create({
        email: adminEmail,
        passwordHash,
        name: 'Admin',
        role: 'ADMIN',
        status: 'active',
      });
      console.log('   ✅ Seeded admin user: admin@musaed.com\n');
    } else {
      console.log('   ⏭️  Admin user already exists, skipping\n');
    }

    // ── Tenant Owner ──
    console.log('🏢 Seeding tenant owner...');
    const tenantOwnerEmail = 'owner@democlinic.com';
    let tenantOwner = await User.findOne({ email: tenantOwnerEmail });
    if (!tenantOwner) {
      const ownerPassword = OWNER_SEED_PASSWORD;
      const passwordHash = await bcrypt.hash(ownerPassword, 10);
      tenantOwner = await User.create({
        email: tenantOwnerEmail,
        passwordHash,
        name: 'Demo Owner',
        role: 'TENANT_OWNER',
        status: 'active',
      });
      console.log('   ✅ Seeded tenant owner: owner@democlinic.com\n');
    } else {
      console.log('   ⏭️  Tenant owner already exists, skipping\n');
    }

    // ── Demo Tenant ──
    console.log('🏥 Seeding demo tenant...');
    let tenant = await Tenant.findOne({ slug: 'demo-clinic' });
    if (!tenant) {
      tenant = await Tenant.create({
        name: 'Demo Clinic',
        slug: 'demo-clinic',
        status: 'ACTIVE',
        ownerId: tenantOwner._id,
        onboardingStep: 4,
        onboardingComplete: true,
      });
      console.log('   ✅ Seeded tenant: Demo Clinic\n');
    } else {
      console.log('   ⏭️  Demo tenant already exists, skipping\n');
    }

    // ── Tenant Staff Link ──
    console.log('🔗 Seeding tenant staff membership...');
    const existingStaff = await TenantStaff.findOne({
      userId: tenantOwner._id,
      tenantId: tenant._id,
    });
    if (!existingStaff) {
      await TenantStaff.create({
        userId: tenantOwner._id,
        tenantId: tenant._id,
        roleSlug: 'clinic_admin',
        status: 'active',
        joinedAt: new Date(),
      });
      console.log('   ✅ Seeded tenant staff membership\n');
    } else {
      console.log('   ⏭️  Tenant staff membership already exists, skipping\n');
    }

    // ── Clinic Voice Template (Arabic clinic reception) ──
    console.log('🤖 Seeding Clinic Voice Template...');
    const clinicsTemplatePath = path.resolve(
      process.cwd(),
      'templates',
      'clinics-voice-template.json',
    );
    let clinicsFlow: Record<string, unknown> | null = null;
    try {
      const raw = await import('node:fs/promises').then((fs) =>
        fs.readFile(clinicsTemplatePath, 'utf8'),
      );
      clinicsFlow = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      clinicsFlow = null;
    }

    if (clinicsFlow && clinicsFlow.conversationFlow && clinicsFlow.voice_id) {
      const existingClinicsTemplate = await AgentTemplate.findOne({
        slug: 'clinics-voice-template',
        deletedAt: null,
      });
      if (existingClinicsTemplate) {
        existingClinicsTemplate.flowTemplate = clinicsFlow;
        existingClinicsTemplate.name = 'Clinic Voice Template';
        existingClinicsTemplate.version =
          (existingClinicsTemplate.version ?? 0) + 1;
        await existingClinicsTemplate.save();
        console.log(
          `   🔄 Updated Clinic Voice Template (v${String(existingClinicsTemplate.version)})\n`,
        );
      } else {
        await AgentTemplate.create({
          name: 'Clinic Voice Template',
          slug: 'clinics-voice-template',
          description:
            'Arabic clinic reception voice agent: booking, patient info, knowledge base Q&A',
          category: 'clinics',
          channel: 'voice',
          supportedChannels: ['voice'],
          capabilityLevel: 'L3',
          flowTemplate: clinicsFlow,
          version: 1,
        });
        console.log('   ✅ Seeded Clinic Voice Template\n');
      }
    } else {
      console.log(
        '   ⚠️  templates/clinics-voice-template.json not found or invalid, skipping\n',
      );
    }

    // ── Matthew Mendez Assistant (English clinic voice) ──
    console.log('🤖 Seeding Matthew Mendez Assistant (English)...');
    const matthewTemplatePath = path.resolve(
      process.cwd(),
      'templates',
      'matthew-mendez-assistant-voice-en.json',
    );
    let matthewFlow: Record<string, unknown> | null = null;
    try {
      const rawMatthew = await import('node:fs/promises').then((fs) =>
        fs.readFile(matthewTemplatePath, 'utf8'),
      );
      matthewFlow = JSON.parse(rawMatthew) as Record<string, unknown>;
    } catch {
      matthewFlow = null;
    }

    if (matthewFlow && matthewFlow.conversationFlow && matthewFlow.voice_id) {
      const existingMatthewTemplate = await AgentTemplate.findOne({
        slug: 'matthew-mendez-assistant-voice-en',
        deletedAt: null,
      });
      if (existingMatthewTemplate) {
        existingMatthewTemplate.flowTemplate = matthewFlow;
        existingMatthewTemplate.name = 'Matthew Mendez Assistant (English)';
        existingMatthewTemplate.version =
          (existingMatthewTemplate.version ?? 0) + 1;
        await existingMatthewTemplate.save();
        console.log(
          `   🔄 Updated Matthew Mendez Assistant English (v${String(existingMatthewTemplate.version)})\n`,
        );
      } else {
        await AgentTemplate.create({
          name: 'Matthew Mendez Assistant (English)',
          slug: 'matthew-mendez-assistant-voice-en',
          description:
            'English clinic reception voice agent: booking, patient info, knowledge base Q&A',
          category: 'clinics',
          channel: 'voice',
          supportedChannels: ['voice'],
          capabilityLevel: 'L3',
          flowTemplate: matthewFlow,
          version: 1,
        });
        console.log('   ✅ Seeded Matthew Mendez Assistant (English)\n');
      }
    } else {
      console.log(
        '   ⚠️  templates/matthew-mendez-assistant-voice-en.json not found or invalid, skipping\n',
      );
    }

    // ── Single Prompt (barber / single-LLM voice) ──
    console.log('🤖 Seeding Single Prompt template...');
    const singlePromptPath = path.resolve(
      process.cwd(),
      'templates',
      'single-prompt-agent.json',
    );
    let singlePromptFlow: Record<string, unknown> | null = null;
    try {
      const raw = await import('node:fs/promises').then((fs) =>
        fs.readFile(singlePromptPath, 'utf8'),
      );
      singlePromptFlow = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      singlePromptFlow = null;
    }

    if (
      singlePromptFlow &&
      singlePromptFlow.response_engine &&
      singlePromptFlow.retellLlmData
    ) {
      const existingSinglePromptTemplate = await AgentTemplate.findOne({
        slug: 'single-prompt-agent',
        deletedAt: null,
      });
      if (existingSinglePromptTemplate) {
        existingSinglePromptTemplate.flowTemplate = singlePromptFlow;
        existingSinglePromptTemplate.name = 'Single Prompt';
        existingSinglePromptTemplate.version =
          (existingSinglePromptTemplate.version ?? 0) + 1;
        await existingSinglePromptTemplate.save();
        console.log(
          `   🔄 Updated Single Prompt (v${String(existingSinglePromptTemplate.version)})\n`,
        );
      } else {
        await AgentTemplate.create({
          name: 'Single Prompt',
          slug: 'single-prompt-agent',
          description:
            'Iron & Blade barber shop booking assistant: appointments, reschedule, cancel, FAQ',
          category: 'booking',
          channel: 'voice',
          supportedChannels: ['voice'],
          capabilityLevel: 'L3',
          flowTemplate: singlePromptFlow,
          version: 1,
        });
        console.log('   ✅ Seeded Single Prompt\n');
      }
    } else {
      console.log(
        '   ⚠️  templates/single-prompt-agent.json not found or invalid, skipping\n',
      );
    }

    console.log('🎉 Seed complete!');
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

seed();
