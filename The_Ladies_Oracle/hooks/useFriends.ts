/**
 * Friends = the people you follow. Stored per user so the count and list are yours:
 *
 *   users/{uid}/following/{friendUid}  { name, photoURL, followedAt }
 *
 * `useFollowing()` subscribes live (the profile counter updates the moment you follow
 * someone on the Friends screen). `usePeople()` lists other people from the public
 * `profiles/{uid}` collection (name + photo only) — `users/*` stays private.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  collection, deleteDoc, doc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebaseConfig';

export interface Person {
  uid: string;
  name: string;
  photoURL: string | null;
}

export interface Following extends Person {
  followedAt: Date | null;
}

const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function useFollowing() {
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uid = auth.currentUser?.uid ?? null;

  useEffect(() => {
    if (!uid) { setFollowing([]); setLoading(false); return; }
    setLoading(true);
    const q = query(collection(db, 'users', uid, 'following'), orderBy('name'));
    const unsubscribe = onSnapshot(
      q,
      snap => {
        setFollowing(snap.docs.map(d => {
          const data = d.data();
          return {
            uid: d.id,
            name: str(data.name) ?? 'Someone',
            photoURL: str(data.photoURL),
            followedAt: data.followedAt?.toDate?.() ?? null,
          };
        }));
        setError(null);
        setLoading(false);
      },
      err => {
        console.warn('[useFollowing]', err.message);
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [uid]);

  const follow = useCallback(async (person: Person) => {
    if (!uid || person.uid === uid) return;
    await setDoc(doc(db, 'users', uid, 'following', person.uid), {
      uid: person.uid, // lets the server clean up when this person deletes their account
      name: person.name,
      photoURL: person.photoURL,
      followedAt: serverTimestamp(),
    });
  }, [uid]);

  const unfollow = useCallback(async (friendUid: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, 'users', uid, 'following', friendUid));
  }, [uid]);

  const isFollowing = useCallback((otherUid: string) => following.some(f => f.uid === otherUid), [following]);

  return { following, count: following.length, loading, error, follow, unfollow, isFollowing };
}

/** Other people, for the "Find friends" list — from `profiles/*`, readable by any signed-in user. */
export function usePeople(max = 50) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const uid = auth.currentUser?.uid ?? null;

  const load = useCallback(async () => {
    if (!uid) { setPeople([]); setLoading(false); return; }
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'profiles'), orderBy('name'), limit(max)));
      setPeople(
        snap.docs
          .filter(d => d.id !== uid)
          .map(d => ({ uid: d.id, name: str(d.data().name) ?? 'Someone', photoURL: str(d.data().photoURL) })),
      );
      setError(null);
    } catch (err: any) {
      console.warn('[usePeople]', err?.message);
      setError(err?.code === 'permission-denied'
        ? 'Finding friends needs the `profiles` Firestore rule — see the accounts INSTALL.md.'
        : err?.message ?? 'Could not load people.');
    } finally {
      setLoading(false);
    }
  }, [uid, max]);

  useEffect(() => { load(); }, [load]);

  return { people, loading, error, reload: load };
}
