import React, { useState } from 'react';
import { parseZeroKnowledgeShareHash } from '../utils/shareReportUrl';
import { SavedReport } from '../types';
import {
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  ShieldCheck,
  Play,
  Share2,
  X
} from 'lucide-react';

interface PinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (report: SavedReport) => void;
}

export const PinPromptModal: React.FC<PinPromptModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setErrorMsg('Please enter the 4-digit PIN provided by your coach.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    const hash = window.location.hash;
    const res = parseZeroKnowledgeShareHash(hash, pin.trim());

    setIsVerifying(false);

    if (res.success && res.report) {
      // Clear hash after successful unlock to prevent leakage
      history.replaceState(null, '', window.location.pathname);
      onSuccess(res.report);
      onClose();
    } else {
      if (res.isExpired) {
        setErrorMsg('This report link has expired. Please ask your coach for a fresh link.');
      } else {
        setErrorMsg('Incorrect PIN. Please check the code provided by your coach.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-zinc-100 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 font-mono font-bold px-2 py-0.5 rounded uppercase">
                Protected Athlete Report
              </span>
              <h3 className="text-base font-black text-white uppercase italic tracking-wider mt-0.5">
                Enter Coach PIN
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-300 leading-relaxed">
          Your coach has protected this biomechanics audit with a privacy PIN. Enter the PIN provided by your coach to open the report.
        </p>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              4-Digit Passcode
            </label>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setErrorMsg(null);
              }}
              placeholder="e.g. 4821"
              autoFocus
              className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-amber-400 rounded-2xl py-3 px-4 text-center text-xl font-mono font-black text-amber-300 tracking-[0.3em] focus:outline-none transition-all"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl flex items-center gap-2 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying}
              className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Report'}</span>
            </button>
          </div>
        </form>

        <div className="flex items-center justify-center gap-2 text-[11px] text-zinc-500 font-mono pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Server End-to-End Decryption</span>
        </div>

      </div>
    </div>
  );
};
