'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Mail, X } from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from '@/lib/firebase-client';
import { createFirebaseProfile, getFirebaseProfile } from '@/lib/firebase-profile';

interface IdentityPortalProps {
  onComplete: (user: { id: string; nickname: string; ninnikTitle: string }) => void;
  onClose: () => void;
}

type Screen = 'method' | 'email' | 'nickname';

export const IdentityPortal: React.FC<IdentityPortalProps> = ({ onComplete, onClose }) => {
  const [screen, setScreen] = useState<Screen>('method');
  const [emailMode, setEmailMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const nicknameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (screen === 'nickname') nicknameInputRef.current?.focus();
  }, [screen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const completeWithProfile = (profile: { id: string; nickname: string; ninnikTitle: string }) => {
    localStorage.setItem('ninnik_user', JSON.stringify(profile));
    onComplete(profile);
  };

  const findExistingProfile = async (user: User) => {
    const profile = await getFirebaseProfile(user.uid);
    if (!profile) return false;
    completeWithProfile(profile);
    return true;
  };

  const handleAuthenticated = async (user: User) => {
    setIsProcessing(true);
    setMessage(null);
    try {
      if (await findExistingProfile(user)) return;
      setAuthenticatedUser(user);
      setScreen('nickname');
    } catch (error) {
      console.error('Profile lookup failed:', error);
      setMessage('PROFILE CONNECTION FAILED');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      await handleAuthenticated(result.user);
    } catch (error) {
      console.error('Google sign-in failed:', error);
      setMessage('GOOGLE SIGN-IN FAILED');
      setIsProcessing(false);
    }
  };

  const handleEmailSubmit = async () => {
    setIsProcessing(true);
    setMessage(null);
    try {
      const credential = emailMode === 'login'
        ? await signInWithEmailAndPassword(firebaseAuth, email, password)
        : await createUserWithEmailAndPassword(firebaseAuth, email, password);
      await handleAuthenticated(credential.user);
    } catch (error) {
      console.error('Email sign-in failed:', error);
      setMessage(emailMode === 'login' ? 'EMAIL OR PASSWORD IS INCORRECT' : 'EMAIL SIGN-UP FAILED');
      setIsProcessing(false);
    }
  };

  const handleNicknameSubmit = async () => {
    if (!authenticatedUser || nickname.trim().length < 1) return;
    setIsProcessing(true);
    setMessage(null);
    try {
      const ninnikTitle = 'Resonant Traveler';
      const profile = await createFirebaseProfile({
        uid: authenticatedUser.uid,
        nickname: nickname.trim(),
        ninnikTitle,
      });
      completeWithProfile(profile);
    } catch (error) {
      console.error('Profile creation failed:', error);
      setMessage(error instanceof Error && error.message === 'NICKNAME_TAKEN' ? 'NAME ALREADY TAKEN' : 'PROFILE CREATION FAILED');
    } finally {
      setIsProcessing(false);
    }
  };

  const buttonClass = 'w-full py-3 text-[10px] font-bold tracking-[0.18em] rounded flex items-center justify-center gap-2 transition-all uppercase disabled:bg-white/5 disabled:text-white/20 disabled:cursor-default';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="pointer-events-auto bg-[#0b1617]/95 backdrop-blur-xl rounded w-[300px] p-5 relative overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)] text-center"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors" aria-label="Close sign in">
          <X size={20} />
        </button>
        <h2 className="text-lg font-bold text-white tracking-tighter uppercase leading-tight pb-3 mb-5 w-full border-b border-white/20">
          {screen === 'nickname' ? 'CHOOSE NICKNAME' : 'WELCOME'}
        </h2>

        {message && <div className="mb-4 bg-[#ccff00] text-black text-[10px] font-bold px-3 py-2 rounded shadow-lg uppercase tracking-widest">{message}</div>}

        {screen === 'method' && (
          <div className="space-y-3">
            <p className="text-white/50 text-[11px] leading-relaxed mb-5">Sign in first, then choose the name others will see.</p>
            <button onClick={handleGoogleLogin} disabled={isProcessing} className={`${buttonClass} bg-white text-black hover:bg-white/90`}>
              <span className="font-black text-sm">G</span>{isProcessing ? 'CONNECTING...' : 'CONTINUE WITH GOOGLE'}
            </button>
            <button onClick={() => { setMessage(null); setScreen('email'); }} disabled={isProcessing} className={`${buttonClass} border border-white/20 text-white hover:border-[#CCFF00] hover:text-[#CCFF00]`}>
              <Mail size={14} /> CONTINUE WITH EMAIL
            </button>
          </div>
        )}

        {screen === 'email' && (
          <div className="space-y-3">
            <div className="flex text-[9px] font-bold tracking-widest border border-white/10 rounded overflow-hidden">
              <button onClick={() => setEmailMode('login')} className={`w-1/2 py-2 ${emailMode === 'login' ? 'bg-[#CCFF00] text-black' : 'text-white/40'}`}>LOG IN</button>
              <button onClick={() => setEmailMode('signup')} className={`w-1/2 py-2 ${emailMode === 'signup' ? 'bg-[#CCFF00] text-black' : 'text-white/40'}`}>SIGN UP</button>
            </div>
            <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="EMAIL" autoComplete="email" className="w-full bg-white/5 text-center text-white text-sm py-3 px-3 focus:outline-none focus:bg-white/10 placeholder:text-white/20 border-b border-white/10 focus:border-[#CCFF00]/50" />
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="PASSWORD (6+ CHARACTERS)" autoComplete={emailMode === 'login' ? 'current-password' : 'new-password'} className="w-full bg-white/5 text-center text-white text-sm py-3 px-3 focus:outline-none focus:bg-white/10 placeholder:text-white/20 border-b border-white/10 focus:border-[#CCFF00]/50" onKeyDown={(event) => event.key === 'Enter' && handleEmailSubmit()} />
            <button onClick={handleEmailSubmit} disabled={isProcessing || !email || password.length < 6} className={`${buttonClass} bg-[#CCFF00] text-black hover:bg-[#b3ff00]`}>
              {isProcessing ? 'CONNECTING...' : emailMode === 'login' ? 'LOG IN WITH EMAIL' : 'CREATE EMAIL ACCOUNT'}
            </button>
            <button onClick={() => { setMessage(null); setScreen('method'); }} className="w-full text-[9px] text-white/30 hover:text-[#CCFF00] uppercase tracking-widest font-mono">BACK</button>
          </div>
        )}

        {screen === 'nickname' && (
          <div className="space-y-4">
            <CheckCircle2 className="mx-auto text-[#CCFF00]" size={28} />
            <p className="text-white/55 text-[11px] leading-relaxed">Signed in as {authenticatedUser?.email || 'Google account'}.</p>
            <input ref={nicknameInputRef} type="text" value={nickname} onChange={(event) => { setNickname(event.target.value); setMessage(null); }} placeholder="NICKNAME" maxLength={10} className="w-full bg-white/5 text-center text-white text-sm py-3 px-3 focus:outline-none focus:bg-white/10 placeholder:text-white/20 font-bold tracking-widest uppercase border-b border-white/10 focus:border-[#CCFF00]/50" onKeyDown={(event) => event.key === 'Enter' && handleNicknameSubmit()} />
            <button onClick={handleNicknameSubmit} disabled={isProcessing || nickname.trim().length < 1} className={`${buttonClass} bg-[#CCFF00] text-black hover:bg-[#b3ff00]`}>
              {isProcessing ? 'SAVING...' : 'ENTER WORLD'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
