import React, { useState } from 'react';
import { TrophyCard } from '../types';
import { X, RotateCw, Trophy, Trash2, Download, Share2, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UnifiedTradingCard } from './UnifiedTradingCard';

interface TrophyCardViewerModalProps {
  card: TrophyCard;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const TrophyCardViewerModal: React.FC<TrophyCardViewerModalProps> = ({ card, isOpen, onClose, onDelete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(card.id);
      onClose();
    }
  };

  const handleDownloadCardJSON = () => {
    const payload = {
      version: '1.2',
      type: 'klutchh_trophy_card',
      exportedAt: new Date().toISOString(),
      card
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Klutchh_Card_${card.athleteName.replace(/\s+/g, '_')}_${card.sportId}.klutchh-card`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-6 sm:p-7 w-full max-w-md relative shadow-2xl flex flex-col items-center gap-5 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Title */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-black uppercase tracking-wider mb-0.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Official Minted Trading Card</span>
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wide truncate max-w-[280px]">
              {card.athleteName}
            </h2>
          </div>

          {/* Unified 3D Holographic Card */}
          <UnifiedTradingCard
            card={card}
            size="lg"
            interactive={true}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 w-full justify-center pt-1 border-t border-zinc-800">
            <button
              onClick={() => setIsFlipped(!isFlipped)}
              className="flex-1 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white py-2.5 px-4 rounded-xl font-bold uppercase tracking-wider text-xs transition-all border border-zinc-700"
            >
              <RotateCw className="w-3.5 h-3.5 text-amber-400" />
              <span>{isFlipped ? 'View Front' : 'View Back'}</span>
            </button>

            <button
              onClick={handleDownloadCardJSON}
              className="flex items-center justify-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2.5 px-3 rounded-xl font-bold text-xs transition-all border border-zinc-700"
              title="Download card backup file (.klutchh-card)"
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Saved!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export</span>
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
              className="p-2.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-400 border border-red-900/40 transition-all"
              title="Burn / Delete Card"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Delete Confirmation Drawer */}
          {showDeleteConfirm && (
            <div className="bg-red-950/60 border border-red-900/60 p-4 rounded-2xl text-center w-full animate-fadeIn">
              <p className="text-white text-xs font-bold mb-3">Burn & permanently delete this trophy card?</p>
              <div className="flex gap-2 justify-center">
                <button 
                  onClick={() => setShowDeleteConfirm(false)} 
                  className="text-xs bg-zinc-800 text-zinc-300 px-4 py-2 rounded-xl font-bold hover:bg-zinc-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="text-xs bg-red-600 text-white px-4 py-2 rounded-xl font-black uppercase tracking-wider hover:bg-red-500 transition-all shadow-lg shadow-red-600/30"
                >
                  Burn Card
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
