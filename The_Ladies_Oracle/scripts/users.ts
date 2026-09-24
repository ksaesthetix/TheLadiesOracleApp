// @ts-nocheck — a dev script run with tsx; kept out of the app's type-check.
/**
 * List accounts, and delete the ones that match a word in their name or email.
 *
 *   npx tsx scripts/users.ts --list                          # everyone: Auth + Firestore, tier, questions this week
 *   npx tsx scripts/users.ts --delete-matching Test          # DRY RUN: shows who would be deleted (name or email contains "test")
 *   npx tsx scripts/users.ts --delete-matching Test --yes    # deletes them: Auth user, users/{uid} (+ subcollections),
 *                                                            #   profiles/{uid}, and their rows in other people's following lists
 *   npx tsx scripts/users.ts --delete-uid <uid> --yes        # one specific account
 *   … add --keep <uid> (repeatable) to protect an account whatever it's called,
 *     and --name-only to ignore emails (the seeded test users' emails all contain "test").
 *
 * Matching is case-insensitive and checks: Firestore name, Auth displayName, and email (unless --name-only).
 * Accounts that exist only in Auth (a sign-up that never wrote its documents) are included.
 * Same setup as seedTestUsers.ts (firebase-admin, tsx, ./firebase-admin-key.json).
 */
const DB_ID = process.env.FIRESTORE_DB ?? 'default';
const KEY_PATH = process.env.FIREBASE_ADMIN_KEY ?? './firebase-admin-key.json';

function weekKey(date = new Date()) {
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
  const yes = args.includes('--yes');
  const nameOnly = args.includes('--name-only');
  const keep = new Set(args.flatMap((a, i) => (a === '--keep' && args[i + 1] ? [args[i + 1]] : [])));
  const matchIdx = args.indexOf('--delete-matching');
  const needle = matchIdx >= 0 ? (args[matchIdx + 1] ?? '').toLowerCase() : null;
  const uidIdx = args.indexOf('--delete-uid');
  const oneUid = uidIdx >= 0 ? args[uidIdx + 1] : null;
  if (needle !== null && !needle) throw new Error('--delete-matching needs a word, e.g. --delete-matching Test');

  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore } = await import('firebase-admin/firestore');
  const { readFileSync } = await import('node:fs');
  const app = initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
  const auth = getAuth(app);
  const db = getFirestore(app, DB_ID);

  // ── gather: every Auth user + every users doc, merged by uid ──
  type Row = { uid: string; name: string; email: string; inAuth: boolean; hasDoc: boolean; tier: string; used: number; isTest: boolean };
  const rows = new Map<string, Row>();
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const u of page.users) rows.set(u.uid, { uid: u.uid, name: u.displayName ?? '', email: u.email ?? '', inAuth: true, hasDoc: false, tier: 'explorer', used: 0, isTest: false });
    pageToken = page.pageToken;
  } while (pageToken);

  const docs = await db.collection('users').get();
  const wk = weekKey();
  for (const d of docs.docs) {
    const data = d.data();
    const row = rows.get(d.id) ?? { uid: d.id, name: '', email: '', inAuth: false, hasDoc: false, tier: 'explorer', used: 0, isTest: false };
    row.hasDoc = true;
    row.name = (typeof data.name === 'string' && data.name) || row.name;
    row.email = row.email || (typeof data.email === 'string' ? data.email : '');
    row.isTest = data.isTestUser === true;
    const [plan, usage] = await Promise.all([
      db.collection('users').doc(d.id).collection('billing').doc('plan').get(),
      db.collection('users').doc(d.id).collection('usage').doc(wk).get(),
    ]);
    if (plan.exists && typeof plan.data()!.tier === 'string') row.tier = plan.data()!.tier;
    if (usage.exists) row.used = Number(usage.data()!.count) || 0;
    rows.set(d.id, row);
  }
  const all = [...rows.values()].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

  const print = (list: Row[]) => {
    for (const r of list) {
      const flags = [r.inAuth ? '' : 'NO AUTH', r.hasDoc ? '' : 'NO DOC', r.isTest ? 'test' : ''].filter(Boolean).join(', ');
      console.log(`${(r.name || '—').padEnd(22)} ${(r.email || '—').padEnd(44)} ${r.tier.padEnd(18)} ${String(r.used).padStart(2)} asked  ${r.uid}${flags ? `  [${flags}]` : ''}`);
    }
  };

  // ── --list ──
  if (needle === null && !oneUid) {
    print(all);
    console.log(`\n${all.length} account(s) · week ${wk}`);
    return;
  }

  // ── select victims ──
  const victims = all.filter(r => !keep.has(r.uid) && (oneUid ? r.uid === oneUid : ((nameOnly ? r.name : `${r.name} ${r.email}`).toLowerCase().includes(needle!))));
  if (!victims.length) { console.log('Nothing matches.'); return; }
  console.log(yes ? `Deleting ${victims.length} account(s):` : `DRY RUN — would delete ${victims.length} account(s) (add --yes to do it):`);
  print(victims);
  if (!yes) return;

  // ── delete, same cascade as DELETE /account ──
  for (const r of victims) {
    await db.recursiveDelete(db.collection('users').doc(r.uid));
    await db.collection('profiles').doc(r.uid).delete().catch(() => {});
    try {
      const snap = await db.collectionGroup('following').where('uid', '==', r.uid).get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      if (snap.size) await batch.commit();
    } catch (e: any) { console.warn(`  (following lists not cleaned for ${r.uid}: ${e.message?.split('\n')[0]})`); }
    if (r.inAuth) await auth.deleteUser(r.uid).catch(e => { if (e.code !== 'auth/user-not-found') throw e; });
    console.log(`  ✓ ${r.name || r.email || r.uid}`);
  }
  console.log('Done.');
}

main().catch(err => { console.error(err.message ?? err); process.exit(1); });
