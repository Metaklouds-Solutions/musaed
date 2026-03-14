require('dotenv').config();
const mongoose = require('mongoose');

const email = process.argv[2];
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI env var is required. Set it in .env or export it.');
  process.exit(1);
}

async function run() {
  await mongoose.connect(uri);
  const users = mongoose.connection.db.collection('users');
  const user = await users.findOne({ email });
  if (!user) { console.log('NO_USER'); await mongoose.disconnect(); return; }
  const tokens = mongoose.connection.db.collection('invite_tokens');
  const t = await tokens.findOne({ userId: user._id, type: 'invite', usedAt: null }, { sort: { createdAt: -1 } });
  if (t) { console.log(t.token); } else { console.log('NO_TOKEN'); }
  await mongoose.disconnect();
}
run().catch((err) => {
  console.error('get-invite-token failed:', err.message ?? err);
  process.exit(1);
});
