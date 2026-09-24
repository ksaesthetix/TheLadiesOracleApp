// @ts-nocheck — a dev script run with tsx; kept out of the app's type-check.
/**
 * Seed test users into Firebase Auth + Firestore so Find friends, Bonds and sharing
 * have real people to work with.
 *
 *   npx tsx scripts/seedTestUsers.ts                 # create/refresh the 12 test users
 *   npx tsx scripts/seedTestUsers.ts --follow <uid>  # …and make <uid> (you) follow them all, and they you
 *   npx tsx scripts/seedTestUsers.ts --dry-run       # print what would be written, touch nothing
 *   npx tsx scripts/seedTestUsers.ts --delete        # remove every user marked isTestUser (Auth + Firestore)
 *
 * Needs: npm i -D firebase-admin tsx
 *        a service-account key at ./firebase-admin-key.json (or FIREBASE_ADMIN_KEY=/path/to/key.json)
 *        FIRESTORE_DB if your database id isn't "default"
 *
 * Every test user can log in: <email> / Oracle123!  (see TEST_PASSWORD)
 * Each users/{uid} doc gets the same fields the app writes, plus a computed natalChart
 * (so Bonds work immediately) and isTestUser: true (so --delete can find them).
 */
import { computeNatalChart } from '../lib/astrology/natal';

const TEST_PASSWORD = 'Oracle123!';
const EMAIL_DOMAIN = 'test.theladiesoracle.com';
const DB_ID = process.env.FIRESTORE_DB ?? 'default';
const KEY_PATH = process.env.FIREBASE_ADMIN_KEY ?? './firebase-admin-key.json';

type Person = {
  name: string;
  birthDate: string;          // YYYY-MM-DD, local to the birthplace
  timeOfBirth: string | null; // HH:mm or null = unknown
  location_name: string;
  country: string;
  latitude: number;
  longitude: number;
};

// A spread of dates, times (three unknown), and places — including one southern-hemisphere chart.
const PEOPLE: Person[] = [
  { name: 'Amelia Hart',      birthDate: '1991-03-14', timeOfBirth: '06:42', location_name: 'London',     country: 'United Kingdom', latitude: 51.5074,  longitude: -0.1278 },
  { name: 'Priya Nair',       birthDate: '1988-11-02', timeOfBirth: '23:15', location_name: 'Manchester', country: 'United Kingdom', latitude: 53.4808,  longitude: -2.2426 },
  { name: 'Isla Ferguson',    birthDate: '1995-07-21', timeOfBirth: '14:05', location_name: 'Edinburgh',  country: 'United Kingdom', latitude: 55.9533,  longitude: -3.1883 },
  { name: 'Rosa Delgado',     birthDate: '1983-01-29', timeOfBirth: null,    location_name: 'Bristol',    country: 'United Kingdom', latitude: 51.4545,  longitude: -2.5879 },
  { name: 'Grace Okafor',     birthDate: '1999-09-09', timeOfBirth: '03:30', location_name: 'Birmingham', country: 'United Kingdom', latitude: 52.4862,  longitude: -1.8904 },
  { name: 'Megan Price',      birthDate: '1986-05-17', timeOfBirth: '11:50', location_name: 'Cardiff',    country: 'United Kingdom', latitude: 51.4816,  longitude: -3.1791 },
  { name: 'Hannah Whitfield', birthDate: '1992-12-24', timeOfBirth: null,    location_name: 'Leeds',      country: 'United Kingdom', latitude: 53.8008,  longitude: -1.5491 },
  { name: 'Niamh Byrne',      birthDate: '1990-06-30', timeOfBirth: '19:20', location_name: 'Dublin',     country: 'Ireland',        latitude: 53.3498,  longitude: -6.2603 },
  { name: 'Charlotte Reeve',  birthDate: '1978-10-08', timeOfBirth: '08:10', location_name: 'Oxford',     country: 'United Kingdom', latitude: 51.7520,  longitude: -1.2577 },
  { name: 'Eilidh Munro',     birthDate: '2001-04-03', timeOfBirth: '00:25', location_name: 'Glasgow',    country: 'United Kingdom', latitude: 55.8642,  longitude: -4.2518 },
  { name: 'Sofia Almeida',    birthDate: '1994-08-15', timeOfBirth: null,    location_name: 'Lisbon',     country: 'Portugal',       latitude: 38.7223,  longitude: -9.1393 },
  { name: 'Zoe Campbell',     birthDate: '1989-02-11', timeOfBirth: '16:45', location_name: 'Sydney',     country: 'Australia',      latitude: -33.8688, longitude: 151.2093 },
];

const slug = (name: string) => name.toLowerCase().replace(/[^a-z]+/g, '.').replace(/^\.|\.$/g, '');
const emailFor = (p: Person) => `${slug(p.name)}@${EMAIL_DOMAIN}`;
const photoFor = (p: Person) => `https://i.pravatar.cc/300?u=${encodeURIComponent(emailFor(p))}`;
const toDateString = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toDateString(); }; // 'Fri Jan 16 2026', as the old DOB screen wrote

function buildDoc(p: Person) {
  const natalChart = computeNatalChart({ date: p.birthDate, time: p.timeOfBirth, latitude: p.latitude, longitude: p.longitude });
  return {
    name: p.name,
    email: emailFor(p),
    photoURL: photoFor(p),
    country: p.country,
    location_name: p.location_name,
    lattitude: p.latitude,   // the app's own (misspelt) field — keep until locationdetails.tsx is fixed
    latitude: p.latitude,
    longitude: p.longitude,
    dateOfBirth: toDateString(p.birthDate),
    birthDate: p.birthDate,
    timeOfBirth: p.timeOfBirth,
    natalChart,
    shareChart: true,
    isTestUser: true,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const del = args.includes('--delete');
  const followIdx = args.indexOf('--follow');
  const followUid = followIdx >= 0 ? args[followIdx + 1] : null;
  if (followIdx >= 0 && !followUid) throw new Error('--follow needs a uid');

  if (dryRun) {
    for (const p of PEOPLE) {
      const d = buildDoc(p);
      const c = d.natalChart;
      console.log(`${d.name.padEnd(18)} ${d.email.padEnd(44)} ${c.bigThree.sun} Sun · ${c.bigThree.moon} Moon · ${c.bigThree.rising ?? '— (no time)'} rising`);
    }
    console.log(`\n${PEOPLE.length} users would be written to Firestore db "${DB_ID}". Password for all: ${TEST_PASSWORD}`);
    return;
  }

  const { initializeApp, cert } = await import('firebase-admin/app');
  const { getAuth } = await import('firebase-admin/auth');
  const { getFirestore, FieldValue } = await import('firebase-admin/firestore');
  const { readFileSync } = await import('node:fs');

  const app = initializeApp({ credential: cert(JSON.parse(readFileSync(KEY_PATH, 'utf8'))) });
  const auth = getAuth(app);
  const db = getFirestore(app, DB_ID);

  if (del) {
    const snap = await db.collection('users').where('isTestUser', '==', true).get();
    console.log(`Deleting ${snap.size} test users…`);
    for (const d of snap.docs) {
      await auth.deleteUser(d.id).catch(e => console.warn(`  auth ${d.id}: ${e.message}`));
      await db.recursiveDelete(d.ref); // doc + following/journal/daily/pattern/billing/usage
      await db.collection('profiles').doc(d.id).delete().catch(() => {});
      console.log(`  ✓ ${d.data().name} (${d.id})`);
    }
    if (followUid) {
      const mine = await db.collection('users').doc(followUid).collection('following').get();
      const testIds = new Set(snap.docs.map(d => d.id));
      for (const f of mine.docs) if (testIds.has(f.id)) await f.ref.delete();
      console.log(`  ✓ removed them from ${followUid}'s following`);
    }
    return;
  }

  const created: { uid: string; name: string; photoURL: string }[] = [];
  for (const p of PEOPLE) {
    const email = emailFor(p);
    const doc = buildDoc(p);
    let uid: string;
    try {
      uid = (await auth.getUserByEmail(email)).uid;
      await auth.updateUser(uid, { displayName: p.name, photoURL: doc.photoURL, password: TEST_PASSWORD });
    } catch (e: any) {
      if (e.code !== 'auth/user-not-found') throw e;
      uid = (await auth.createUser({ email, password: TEST_PASSWORD, displayName: p.name, photoURL: doc.photoURL, emailVerified: true })).uid;
    }
    await db.collection('users').doc(uid).set({ ...doc, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    // Public profile (what Find friends and Bonds read); chart is published because shareChart is true.
    await db.collection('profiles').doc(uid).set({ name: doc.name, photoURL: doc.photoURL, shareChart: true, chart: doc.natalChart, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    created.push({ uid, name: p.name, photoURL: doc.photoURL });
    console.log(`✓ ${p.name.padEnd(18)} ${uid}  ${doc.natalChart.bigThree.sun}/${doc.natalChart.bigThree.moon}/${doc.natalChart.bigThree.rising ?? '—'}`);
  }

  if (followUid) {
    const meSnap = await db.collection('users').doc(followUid).get();
    if (!meSnap.exists) throw new Error(`users/${followUid} not found — is that your uid?`);
    const me = meSnap.data()!;
    const batch = db.batch();
    for (const u of created) {
      batch.set(db.collection('users').doc(followUid).collection('following').doc(u.uid), { uid: u.uid, name: u.name, photoURL: u.photoURL, followedAt: FieldValue.serverTimestamp() }, { merge: true });
      batch.set(db.collection('users').doc(u.uid).collection('following').doc(followUid), { uid: followUid, name: me.name ?? 'You', photoURL: me.photoURL ?? null, followedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
    await batch.commit();
    console.log(`✓ ${me.name ?? followUid} now follows all ${created.length}, and they follow back`);
  }

  console.log(`\nDone. Log in as any of them with their email and password ${TEST_PASSWORD}.`);
}

main().catch(err => { console.error(err); process.exit(1); });
