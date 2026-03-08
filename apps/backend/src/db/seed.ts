import * as mongoose from 'mongoose';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/musaed';

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
    role: { type: String, required: true, enum: ['ADMIN', 'TENANT_OWNER', 'STAFF'] },
    status: { type: String, default: 'active', enum: ['pending', 'active', 'disabled'] },
    avatarUrl: String,
    lastLoginAt: Date,
    deletedAt: Date,
  },
  { timestamps: true, collection: 'users' },
);

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
const User = mongoose.model('User', userSchema);

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

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingPlans = await SubscriptionPlan.countDocuments();
    if (existingPlans === 0) {
      await SubscriptionPlan.insertMany(PLANS);
      console.log('Seeded subscription plans: Starter, Professional, Enterprise');
    } else {
      console.log('Subscription plans already exist, skipping');
    }

    const adminEmail = 'admin@musaed.com';
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('Admin123!', 10);
      await User.create({
        email: adminEmail,
        passwordHash,
        name: 'Admin',
        role: 'ADMIN',
        status: 'active',
      });
      console.log('Seeded admin user: admin@musaed.com / Admin123!');
    } else {
      console.log('Admin user already exists, skipping');
    }

    console.log('Seed complete');
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
