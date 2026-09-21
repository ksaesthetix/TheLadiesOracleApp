// @ts-nocheck — a dev script run with tsx; kept out of the app's type-check.
/**
 * Give a user a membership tier (writes users/{uid}/billing/plan — the doc the app and server read).
 *
 *   npx tsx scripts/setPlan.ts <email-or-uid> <tier> [--expires YYYY-MM-DD]
 *   npx tsx scripts/setPlan.ts amelia.hart@test.theladiesoracle.com elite
 *   npx tsx scripts/setPlan.ts <yourUid> inner-connoisseur --expires 2027-09-21
 *   npx tsx scripts/setPlan.ts <email-or-uid> explorer            # back to free (deletes the plan doc)
 *   npx tsx scripts/setPlan.ts --spread                            # test users: one of each tier, round-robin
 *   npx tsx scripts/setPlan.ts --list                              # who is on what
 *   npx tsx scripts/setPlan.ts <email-or-uid> --reset-usage        # forget this week's questions for that user
 *
 * Tiers: explorer · inner-explorer · inner-connoisseur · elite
 * Needs the same setup as seedTestUsers.ts (firebase-admin, tsx, ./firebase-admin-key.json).
 */
const TIERS = ['explorer', 'inner-explorer', 'inner-connoisseur', 'elite'];
const DB_ID = process.env.FIRESTORE_DB ?? 'default';
const KEY_PATH = process.env.FIREBASE_ADMIN_KEY ?? './firebase-admin-key.json';

function weekKey(date = new Date()) {
  // ISO week of the London calendar date — must match backend/plans.js
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  const d = new Date(Date.UTC(get('year'), get('month') - 1, get('day')));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return `${d.getUTCFullYear()}-W${String(Math.ceil(((d.getTime() - yearStart) / 86400000 + 1) / 7)).padStart(2, '0')}`;
}

async function main() {
  const args = process.argv.slice(2);
  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { readFileSync } = await import('node:fs');
  const app = initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
  const auth = getAuth(app);
  const db = getFirestore(app, DB_ID);

  const planRef = (uid: string) => db.collection('users').doc(uid).collection('billing').doc('plan');

  async function resolveUid(idOrEmail: string): Promise<{ uid: string; label: string }> {
    if (idOrEmail.includes('@')) {
      const u = await auth.getUserByEmail(idOrEmail);
      return { uid: u.uid, label: `${u.displayName ?? idOrEmail} (${u.uid})` };
    }
    const snap = await db.collection('users').doc(idOrEmail).get();
    return { uid: idOrEmail, label: `${snap.exists ? snap.data()!.name : '?'} (${idOrEmail})` };
  }

  async function setPlan(uid: string, tier: string, expires: string | null) {
    if (tier === 'explorer') { await planRef(uid).delete(); return; }
    await planRef(uid).set({
      tier,
      expiresAt: expires ? new Date(`${expires}T23:59:59Z`).toISOString() : null,
      source: 'manual',
      updatedAt: FieldValue.serverTimestamp(),
    });
  }

  // ── --list ──
  if (args.includes('--list')) {
    const users = await db.collection('users').orderBy('name').get();
    const wk = weekKey();
    for (const u of users.docs) {
      const [plan, usage] = await Promise.all([planRef(u.id).get(), db.collection('users').doc(u.id).collection('usage').doc(wk).get()]);
      const p = plan.exists ? plan.data()! : null;
      const tier = p?.tier ?? 'explorer';
      const exp = p?.expiresAt ? ` until ${String(p.expiresAt).slice(0, 10)}` : '';
      const used = usage.exists ? usage.data()!.count : 0;
      console.log(`${(u.data().name ?? '?').padEnd(20)} ${tier.padEnd(18)}${exp.padEnd(18)} ${used} asked this week (${wk})${u.data().isTestUser ? '  [test]' : ''}`);
    }
    return;
  }

  // ── --spread: test users get tiers round-robin ──
  if (args.includes('--spread')) {
    const snap = await db.collection('users').where('isTestUser', '==', true).orderBy('name').get();
    if (snap.empty) throw new Error('No test users — run seedTestUsers.ts first');
    let i = 0;
    for (const d of snap.docs) {
      const tier = TIERS[i++ % TIERS.length];
      await setPlan(d.id, tier, tier === 'elite' || tier === 'explorer' ? null : '2027-12-31');
      console.log(`✓ ${(d.data().name ?? d.id).padEnd(20)} → ${tier}`);
    }
    return;
  }

  // ── <who> --reset-usage ──
  const who = args.find(a => !a.startsWith('--') && !TIERS.includes(a));
  if (!who) throw new Error('Usage: setPlan.ts <email-or-uid> <tier> [--expires YYYY-MM-DD] | --spread | --list');
  const { uid, label } = await resolveUid(who);

  if (args.includes('--reset-usage')) {
    await db.collection('users').doc(uid).collection('usage').doc(weekKey()).delete();
    console.log(`✓ ${label}: this week's questions forgotten (${weekKey()})`);
    if (!args.some(a => TIERS.includes(a))) return;
  }

  // ── <who> <tier> [--expires] ──
  const tier = args.find(a => TIERS.includes(a));
  if (!tier) throw new Error(`Tier must be one of: ${TIERS.join(', ')}`);
  const expIdx = args.indexOf('--expires');
  const expires = expIdx >= 0 ? args[expIdx + 1] : null;
  if (expires && !/^\d{4}-\d{2}-\d{2}$/.test(expires)) throw new Error('--expires wants YYYY-MM-DD');
  await setPlan(uid, tier, expires);
  console.log(`✓ ${label} → ${tier}${expires ? ` until ${expires}` : ''}${tier === 'explorer' ? ' (plan doc removed)' : ''}`);
  console.log('  The app updates live — the Oracle tab and Settings → Membership change without a restart.');
}

main().catch(err => { console.error(err.message ?? err); process.exit(1); });
