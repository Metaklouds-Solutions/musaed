/**
 * Migrates agent_templates to exactly three canonical templates:
 * - Single Prompt
 * - Clinic Voice Template (Arabic)
 * - Matthew Mendez Assistant (English)
 *
 * Safe deletion: skips templates still referenced by agent_instances (logs only).
 *
 * Usage (from apps/backend):
 *   node scripts/migrate-agent-templates.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { MongoClient } = require('mongodb');

const KEEP_SLUGS = new Set([
  'single-prompt-agent',
  'clinics-voice-template',
  'matthew-mendez-assistant-voice-en',
]);

const FINAL_NAMES = {
  'single-prompt-agent': 'Single Prompt',
  'clinics-voice-template': 'Clinic Voice Template',
  'matthew-mendez-assistant-voice-en': 'Matthew Mendez Assistant (English)',
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI is not set');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const templates = db.collection('agent_templates');
  const instances = db.collection('agent_instances');

  const deleted = [];
  const skipped = [];

  /** 1) Normalize names for canonical slugs */
  for (const [slug, name] of Object.entries(FINAL_NAMES)) {
    const r = await templates.updateMany(
      { slug, deletedAt: null },
      { $set: { name } },
    );
    if (r.matchedCount > 0) {
      console.log(
        `Renamed template slug=${slug} -> name="${name}" (${r.modifiedCount} updated)`,
      );
    }
  }

  /** 2) Collect keep _ids */
  const keepDocs = await templates
    .find({
      slug: { $in: [...KEEP_SLUGS] },
      deletedAt: null,
    })
    .project({ _id: 1, slug: 1, name: 1 })
    .toArray();

  const keepIds = new Set(keepDocs.map((d) => d._id.toString()));

  if (keepIds.size !== 3) {
    console.warn(
      `Expected 3 kept templates by slug, found ${keepIds.size}. Slugs present:`,
      keepDocs.map((d) => d.slug),
    );
  }

  /** 3) Delete others (only if unreferenced) */
  const all = await templates
    .find({ deletedAt: null })
    .project({ _id: 1, name: 1, slug: 1 })
    .toArray();

  for (const doc of all) {
    const idStr = doc._id.toString();
    if (keepIds.has(idStr)) continue;

    const refCount = await instances.countDocuments({
      templateId: doc._id,
      status: { $ne: 'deleted' },
    });

    if (refCount > 0) {
      skipped.push({
        id: idStr,
        name: doc.name,
        slug: doc.slug ?? null,
        agentInstances: refCount,
      });
      console.warn(
        `SKIP delete (referenced by ${refCount} agent_instance(s)): ${doc.name} (${idStr})`,
      );
      continue;
    }

    const del = await templates.deleteOne({ _id: doc._id });
    if (del.deletedCount === 1) {
      deleted.push({ id: idStr, name: doc.name, slug: doc.slug ?? null });
      console.log(`Deleted template: ${doc.name} (${idStr})`);
    }
  }

  /** 4) Validation */
  const final = await templates
    .find({ deletedAt: null })
    .project({ name: 1, slug: 1 })
    .sort({ name: 1 })
    .toArray();

  console.log('\n--- FINAL TEMPLATES ---');
  for (const f of final) {
    console.log(` - ${f.name} [slug=${f.slug}]`);
  }
  console.log(`Count: ${final.length}`);

  const expected = [
    'Clinic Voice Template',
    'Matthew Mendez Assistant (English)',
    'Single Prompt',
  ];
  const names = final.map((f) => f.name).sort();
  const ok =
    final.length === 3 && expected.every((n) => names.includes(n));

  if (!ok) {
    console.warn(
      '\nValidation warning: final names/count do not match expected exactly.',
      { names, expected },
    );
  } else {
    console.log('\nValidation OK: 3 templates with expected names.');
  }

  console.log('\n--- SUMMARY ---');
  console.log('Deleted:', JSON.stringify(deleted, null, 2));
  console.log('Skipped (referenced):', JSON.stringify(skipped, null, 2));

  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
