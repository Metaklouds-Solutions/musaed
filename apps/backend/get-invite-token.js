const mongoose = require('mongoose');
const email = process.argv[2];
async function run() {
  await mongoose.connect('mongodb://localhost:27017/musaed');
  const users = mongoose.connection.db.collection('users');
  const user = await users.findOne({ email });
  if (!user) { console.log('NO_USER'); await mongoose.disconnect(); return; }
  const tokens = mongoose.connection.db.collection('invite_tokens');
  const t = await tokens.findOne({ userId: user._id, type: 'invite', usedAt: null }, { sort: { createdAt: -1 } });
  if (t) { console.log(t.token); } else { console.log('NO_TOKEN'); }
  await mongoose.disconnect();
}
run();
