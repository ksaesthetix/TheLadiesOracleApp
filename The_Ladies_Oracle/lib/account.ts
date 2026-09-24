/**
 * Account plumbing shared by Sign Up, Login, Edit Profile and Settings.
 *
 * Two documents per person:
 *   users/{uid}      private — email, birth details, coordinates, natalChart cache. Owner-only.
 *   profiles/{uid}   public to signed-in users — name, photoURL, shareChart, and a copy of the
 *                    chart while sharing is on. This is what Find friends and Bonds read.
 */
import { User, createUserWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';
import type { NatalChart } from './astrology/natal';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://theladiesoracleapp.onrender.com';

export interface PublicProfile {
  name: string;
  photoURL: string | null;
  shareChart: boolean;
  chart: NatalChart | null;
}

/** Firebase Auth error codes → something a person can act on. */
export function friendlyAuthError(code: string | undefined, fallback = 'Something went wrong. Please try again.'): string {
  switch (code) {
    case 'auth/email-already-in-use': return 'That email already has an account. Log in instead, or use “Forgot password”.';
    case 'auth/invalid-email': return 'That doesn’t look like an email address.';
    case 'auth/weak-password': return 'Choose a password of at least 8 characters.';
    case 'auth/missing-password': return 'Please enter a password.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'Email or password isn’t right. Try again, or use “Forgot password”.';
    case 'auth/too-many-requests': return 'Too many attempts. Wait a few minutes and try again.';
    case 'auth/network-request-failed': return 'No connection. Check your internet and try again.';
    case 'auth/user-disabled': return 'This account has been disabled.';
    default: return fallback;
  }
}

/**
 * Make sure both documents exist. Call after sign-up (with the names) and after every login
 * (covers accounts created before this existed). Never overwrites what's already there.
 */
export async function ensureUserDocs(user: User, extra: { firstName?: string; lastName?: string } = {}) {
  const name = user.displayName?.trim() || [extra.firstName, extra.lastName].filter(Boolean).join(' ').trim() || user.email?.split('@')[0] || 'Someone';
  const photoURL = user.photoURL ?? null;

  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      name,
      ...(extra.firstName ? { firstName: extra.firstName } : {}),
      ...(extra.lastName ? { lastName: extra.lastName } : {}),
      email: user.email ?? null,
      photoURL,
      createdAt: serverTimestamp(),
    });
  }

  const profileRef = doc(db, 'profiles', user.uid);
  const profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) {
    const existing = userSnap.exists() ? userSnap.data() : {};
    await setDoc(profileRef, {
      name: (typeof existing.name === 'string' && existing.name.trim()) || name,
      photoURL: (typeof existing.photoURL === 'string' && existing.photoURL) || photoURL,
      shareChart: existing.shareChart === true,
      chart: existing.shareChart === true && existing.natalChart?.version === 1 ? existing.natalChart : null,
      updatedAt: serverTimestamp(),
    });
  }
}

/** Sign up with email + password and create both documents. */
export async function signUpWithEmail(input: { firstName: string; lastName: string; email: string; password: string }) {
  const cred = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
  const displayName = `${input.firstName.trim()} ${input.lastName.trim()}`.trim();
  await updateProfile(cred.user, { displayName });
  // The account exists from here on. If the documents can't be written right now (rules, network),
  // don't fail the sign-up — the next login's ensureUserDocs() creates them.
  try {
    await ensureUserDocs(cred.user, { firstName: input.firstName.trim(), lastName: input.lastName.trim() });
  } catch (err: any) {
    console.warn('[signUp] user documents not written yet:', err?.message);
  }
  return cred.user;
}

/** Keep the public profile in step when name or photo change. */
export async function updatePublicProfile(uid: string, patch: { name?: string; photoURL?: string | null }) {
  await setDoc(doc(db, 'profiles', uid), { ...patch, updatedAt: serverTimestamp() }, { merge: true });
}

/** Turn chart sharing on/off; the chart copy travels with it. */
export async function setChartSharing(uid: string, on: boolean, chart: NatalChart | null) {
  await setDoc(doc(db, 'profiles', uid), { shareChart: on, chart: on ? chart : null, updatedAt: serverTimestamp() }, { merge: true });
}

/** Called by useNatalChart after a recompute: refresh the public copy only if the person is sharing. */
export async function syncSharedChart(uid: string, chart: NatalChart) {
  const snap = await getDoc(doc(db, 'profiles', uid));
  if (snap.exists() && snap.data().shareChart === true) {
    await setDoc(doc(db, 'profiles', uid), { chart, updatedAt: serverTimestamp() }, { merge: true });
  }
}

/** Read someone's public profile (or null if they've gone). */
export async function getPublicProfile(uid: string): Promise<PublicProfile | null> {
  const snap = await getDoc(doc(db, 'profiles', uid));
  if (!snap.exists()) return null;
  const d = snap.data();
  return {
    name: (typeof d.name === 'string' && d.name.trim()) || 'Your friend',
    photoURL: typeof d.photoURL === 'string' ? d.photoURL : null,
    shareChart: d.shareChart === true,
    chart: d.chart && d.chart.version === 1 ? (d.chart as NatalChart) : null,
  };
}

/**
 * Delete the account: the server removes users/{uid} (and subcollections), profiles/{uid},
 * the Auth user, and this person from other people's following lists. Then we sign out.
 */
export async function deleteAccount(): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not signed in');
  const token = await user.getIdToken(true);
  const res = await fetch(`${API_URL}/account`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `The server could not delete the account (HTTP ${res.status}).`);
  }
  await signOut(auth).catch(() => {});
}
