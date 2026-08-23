import React, { useState } from 'react';
import { TrophyCard } from '../types';
import { X, RotateCw, Trophy, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TrophyCardViewerModalProps {
  card: TrophyCard;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const TrophyCardViewerModal: React.FC<TrophyCardViewerModalProps> = ({ card, isOpen, onClose, onDelete }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen) return null;

  const handleDelete = () => {
    if (onDelete) {
      onDelete(card.id);
      onClose();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-zinc-900 border border-zinc-700 rounded-3xl p-6 w-full max-w-sm relative"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center gap-6">
            <h2 className="text-lg font-black text-white uppercase tracking-wider">{card.athleteName}</h2>
            
            <motion.div
              className="relative w-64 h-96 cursor-grab active:cursor-grabbing"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
              style={{ transformStyle: "preserve-3d" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (Math.abs(info.offset.x) > 50) {
                  setIsFlipped(!isFlipped);
                }
              }}
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Front */}
              <div className="absolute inset-0 backface-hidden" style={{ backfaceVisibility: "hidden" }}>
                <div className="w-full h-full bg-zinc-800 rounded-2xl overflow-hidden border border-zinc-700 shadow-2xl relative">
                  {card.capturedImage ? (
                    <img src={card.capturedImage} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Trophy className="w-12 h-12 text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4 bg-amber-500 text-zinc-950 text-xs font-black px-3 py-1 rounded shadow-lg">
                    {card.grade}
                  </div>
                </div>
              </div>
              
              {/* Back */}
              <div 
                className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl border-4 border-amber-600 p-4 flex flex-col justify-between backface-hidden shadow-2xl" 
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                <div className="flex justify-between items-start border-b border-amber-600/30 pb-2">
                  <div className="flex flex-col">
                    <span className="text-4xl font-black text-amber-500">{card.score}</span>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">{card.sportName}</span>
                  </div>
                  <div className="w-16 h-16 bg-zinc-900 rounded-full border-2 border-amber-600 flex items-center justify-center">
                    <Trophy className="w-8 h-8 text-amber-500" />
                  </div>
                </div>

                <div className="text-center py-2">
                  <h3 className="text-white font-black uppercase text-sm tracking-widest truncate">{card.athleteName}</h3>
                  <p className="text-zinc-500 text-[10px] font-mono">{card.movementPhase}</p>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] font-bold text-white bg-zinc-900/50 p-3 rounded-xl border border-zinc-700/50">
                  {card.sportAttributes?.map((attr, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span className="text-zinc-400 uppercase">{attr.label}</span>
                      <span className="text-amber-500">{attr.value}</span>
                    </div>
                  ))}
                  {!card.sportAttributes?.length && (
                    <div className="col-span-2 text-center text-zinc-500">No stats available</div>
                  )}
                </div>
              </div>
            </motion.div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsFlipped(!isFlipped)}
                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-all"
              >
                <RotateCw className="w-4 h-4" /> Spin / Flip
              </button>
              
              <button
                onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                className="flex items-center gap-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 px-4 py-3 rounded-full font-bold uppercase tracking-wider text-sm transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            {showDeleteConfirm && (
              <div className="bg-red-950/50 border border-red-900 p-4 rounded-xl text-center">
                <p className="text-white text-xs mb-3">Delete this trophy card?</p>
                <div className="flex gap-2 justify-center">
                  <button onClick={() => setShowDeleteConfirm(false)} className="text-xs bg-zinc-800 px-3 py-1.5 rounded-lg">Cancel</button>
                  <button onClick={handleDelete} className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg">Confirm</button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
