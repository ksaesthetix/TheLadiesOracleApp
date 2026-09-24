// @ts-nocheck — a dev script run with tsx; kept out of the app's type-check.
/**
 * One-off: create profiles/{uid} for every existing users/{uid} document, so Find friends
 * and Bonds keep working after users/* becomes owner-only.
 *
 *   npx tsx scripts/backfillProfiles.ts            # create missing profiles (never overwrites)
 *   npx tsx scripts/backfillProfiles.ts --dry-run  # show what would be created
 *
 * profiles/{uid} = { name, photoURL, shareChart, chart (only if sharing), updatedAt }
 * Also stamps `uid` onto existing following docs so account deletion can clean them up.
 * Same setup as seedTestUsers.ts (firebase-admin, tsx, ./firebase-admin-key.json).
 */
const DB_ID = process.env.FIRESTORE_DB ?? 'default';
const KEY_PATH = process.env.FIREBASE_ADMIN_KEY ?? './firebase-admin-key.json';

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { readFileSync } = await import('node:fs');
  const app = initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
  const db = getFirestore(app, DB_ID);

  const users = await db.collection('users').get();
  let created = 0, skipped = 0, stamped = 0;

  for (const u of users.docs) {
    const d = u.data();
    const profileRef = db.collection('profiles').doc(u.id);
    const existing = await profileRef.get();
    const name = (typeof d.name === 'string' && d.name.trim()) || (typeof d.email === 'string' ? d.email.split('@')[0] : 'Someone');
    if (existing.exists) {
      skipped++;
    } else {
      const shareChart = d.shareChart === true;
      const chart = shareChart && d.natalChart && d.natalChart.version === 1 ? d.natalChart : null;
      console.log(`${dryRun ? 'would create' : 'create'} profiles/${u.id}  ${name}${shareChart ? '  (sharing chart)' : ''}`);
      if (!dryRun) {
        await profileRef.set({ name, photoURL: typeof d.photoURL === 'string' ? d.photoURL : null, shareChart, chart, updatedAt: FieldValue.serverTimestamp() });
      }
      created++;
    }

    // following docs: add uid = doc id where missing
    const following = await u.ref.collection('following').get();
    for (const f of following.docs) {
      if (f.data().uid) continue;
      if (!dryRun) await f.ref.set({ uid: f.id }, { merge: true });
      stamped++;
    }
  }

  console.log(`\n${dryRun ? 'Would create' : 'Created'} ${created} profile(s), ${skipped} already existed, ${stamped} following doc(s) ${dryRun ? 'to stamp' : 'stamped'} with uid.`);
}

main().catch(err => { console.error(err.message ?? err); process.exit(1); });
