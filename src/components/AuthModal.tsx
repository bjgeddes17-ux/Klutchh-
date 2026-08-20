import React, { useState } from 'react';
import { UserAccount } from '../types';
import { X, User, Lock, Mail, Flame, LogIn, UserPlus, CheckCircle, Loader2, AlertCircle, Zap } from 'lucide-react';
import { signInWithGoogle, signUpWithEmail, loginWithEmail, logoutFirebase } from '../lib/firebase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onLoginSuccess: (user: UserAccount) => void;
  onLogout: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  onLogout
}) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'Coach' | 'Athlete' | 'Parent'>('Coach');
  const [clubOrSchool, setClubOrSchool] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        const userAccount = await signUpWithEmail(email, password, name, role, clubOrSchool);
        onLoginSuccess(userAccount);
        onClose();
      } else {
        const userAccount = await loginWithEmail(email, password);
        onLoginSuccess(userAccount);
        onClose();
      }
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      const msg = err.message || 'Authentication failed. Please check your credentials.';
      setError(msg.replace('Firebase: ', ''));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    try {
      const userAccount = await signInWithGoogle();
      if (userAccount) {
        onLoginSuccess(userAccount);
        onClose();
      } else {
        // Redirecting to Google auth page
        setError('Redirecting to Google sign-in...');
      }
    } catch (err: any) {
      console.error('Google sign in error:', err);
      
      const errorCode = err.code || '';
      const errorMessage = err.message || '';
      const currentHost = window.location.hostname;
      
      if (errorCode === 'auth/unauthorized-domain' || errorMessage.includes('unauthorized-domain') || errorMessage.includes('domain is not authorized')) {
        setError(
          `Domain Not Authorized!\n\n` +
          `Your Firebase project has not authorized "${currentHost}" for Google Sign-In yet.\n\n` +
          `To resolve this instantly:\n` +
          `1. Open your Firebase Console (console.firebase.google.com)\n` +
          `2. Go to Authentication > Settings > Authorized domains\n` +
          `3. Click 'Add domain' and paste: ${currentHost}\n\n` +
          `💡 Tip: If you are running the app inside the AI Studio sandbox iframe, click the external link icon in the top-right corner to open the app in a new browser tab first.`
        );
      } else if (errorCode === 'auth/operation-not-allowed' || errorMessage.includes('operation-not-allowed') || errorMessage.includes('disabled')) {
        setError(
          `Google Sign-In is Disabled!\n\n` +
          `Google Sign-In needs to be enabled as an active provider in your Firebase project.\n\n` +
          `To resolve this:\n` +
          `1. Go to your Firebase Console > Authentication > Sign-in method\n` +
          `2. Click 'Add new provider' and choose 'Google'\n` +
          `3. Toggle 'Enable' and save your configuration.`
        );
      } else if (errorCode === 'auth/popup-blocked' || errorMessage.includes('popup-blocked')) {
        setError(
          `Sign-In Popup Blocked!\n\n` +
          `Your browser blocked the Google authentication window from opening.\n\n` +
          `Please click again and allow popups in your browser's address bar to log in.`
        );
      } else if (errorCode === 'auth/popup-closed-by-user' || errorMessage.includes('popup-closed-by-user')) {
        setError(
          `Google Sign-In Cancelled:\n\n` +
          `The Google authentication window was closed before completion. Please try again.`
        );
      } else {
        setError(errorMessage.replace('Firebase: ', '') || 'Google Sign-In failed.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-zinc-100 flex flex-col gap-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="bg-red-600/20 text-red-500 p-2 rounded-xl border border-red-500/30">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase italic tracking-wider text-white">
                {currentUser ? 'Klutchh Profile' : isSignUp ? 'Create Athlete Account' : 'Sign In to Klutchh'}
              </h2>
              <p className="text-xs text-zinc-400">
                {currentUser ? 'Logged in as verified user' : 'Save biometrics, videos, and AI coaching histories'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 hover:bg-zinc-800 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentUser ? (
          /* Logged In View */
          <div className="flex flex-col gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-red-600 text-white font-black flex items-center justify-center text-lg border-2 border-yellow-400 shadow-lg">
                {currentUser.name.charAt(0)}
              </div>
              <div>
                <div className="text-sm font-black text-white flex items-center gap-2">
                  <span>{currentUser.name}</span>
                  <span className="bg-yellow-400/20 text-yellow-400 border border-yellow-400/30 text-[10px] px-2 py-0.5 rounded uppercase font-extrabold">
                    {currentUser.role}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 mt-0.5">{currentUser.email}</p>
                {currentUser.clubOrSchool && (
                  <p className="text-[11px] text-zinc-500 font-mono mt-0.5">{currentUser.clubOrSchool}</p>
                )}
              </div>
            </div>

            <div className="bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Session active. All video biometrics and AI reports are saved to your Firebase library.</span>
            </div>

            <button
              onClick={async () => {
                await logoutFirebase();
                onLogout();
                onClose();
              }}
              className="w-full bg-zinc-800 hover:bg-red-600/30 hover:border-red-500 border border-zinc-700 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider transition-all"
            >
              Log Out
            </button>
          </div>
        ) : (
          /* Form or Quick Demo Selection */
          <div className="flex flex-col gap-5">
            
            {error && (
              <div className="bg-red-950/85 border border-red-500/40 p-3.5 rounded-xl text-xs text-red-300 font-medium whitespace-pre-line leading-relaxed text-left flex flex-col gap-1.5 shadow-lg">
                <div className="flex items-center gap-1.5 text-red-400 font-bold uppercase tracking-wider text-[10px]">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Authentication Notice</span>
                </div>
                <div>{error}</div>
              </div>
            )}
            
            {/* Google Sign-In Button */}
            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-zinc-100 text-zinc-900 font-extrabold text-xs py-3 px-4 rounded-xl border border-zinc-200 flex items-center justify-center gap-3 shadow-md transition-all active:scale-95 group disabled:opacity-50"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.27 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.73 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
              <span>{isLoading ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>

            {/* Quick Demo Mode Button for Sandbox Testing */}
            <button
              type="button"
              onClick={() => {
                const demoUser = {
                  id: 'demo-coach-' + Date.now(),
                  name: 'Coach Marcus (Demo)',
                  email: 'coach.marcus@klutchh.demo',
                  role: 'Coach' as const,
                  clubOrSchool: 'Elite Academy Pro',
                  avatar: undefined
                };
                onLoginSuccess(demoUser);
                onClose();
              }}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-zinc-950 font-black text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>Instant Demo Coach Login (Bypass OAuth)</span>
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-zinc-800"></div>
              <span className="flex-shrink mx-4 text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Or use email</span>
              <div className="flex-grow border-t border-zinc-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">

              {isSignUp && (
                <>
                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="Coach Marcus"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="Coach">Coach / Athletic Trainer</option>
                      <option value="Athlete">Athlete / Student</option>
                      <option value="Parent">Parent / Guardian</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Club / School</label>
                    <input
                      type="text"
                      placeholder="High School / Academy Name"
                      value={clubOrSchool}
                      onChange={(e) => setClubOrSchool(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="coach@school.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-500 text-white font-black text-xs py-2.5 rounded-xl uppercase tracking-wider shadow-lg shadow-red-600/30 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : isSignUp ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                <span>{isLoading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}</span>
              </button>
            </form>

            <div className="text-center pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-xs text-zinc-400 hover:text-yellow-400 font-semibold transition-all"
              >
                {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Create one now'}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

