'use client';

import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { firebaseDb } from '@/lib/firebase-client';

export interface FirebaseProfile {
  id: string;
  authUid: string;
  nickname: string;
  ninnikTitle: string;
  registeredAt: string;
}

const profileRef = (uid: string) => doc(firebaseDb, 'users', uid);
const nicknameRef = (nickname: string) => doc(firebaseDb, 'userNicknames', encodeURIComponent(nickname));

export async function getFirebaseProfile(uid: string): Promise<FirebaseProfile | null> {
  const snapshot = await getDoc(profileRef(uid));
  return snapshot.exists() ? snapshot.data() as FirebaseProfile : null;
}

export async function createFirebaseProfile({ uid, nickname, ninnikTitle }: Pick<FirebaseProfile, 'nickname' | 'ninnikTitle'> & { uid: string }) {
  const profile = await runTransaction(firebaseDb, async (transaction) => {
    const userDocument = profileRef(uid);
    const nicknameDocument = nicknameRef(nickname);
    const [existingUser, existingNickname] = await Promise.all([
      transaction.get(userDocument),
      transaction.get(nicknameDocument),
    ]);

    if (existingUser.exists()) return existingUser.data() as FirebaseProfile;
    if (existingNickname.exists()) throw new Error('NICKNAME_TAKEN');

    const newProfile: FirebaseProfile = {
      id: uid,
      authUid: uid,
      nickname,
      ninnikTitle,
      registeredAt: new Date().toISOString(),
    };
    transaction.set(userDocument, newProfile);
    transaction.set(nicknameDocument, { userId: uid });
    return newProfile;
  });
  return profile;
}
