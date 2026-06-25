import React from 'react';
import { CheckCircle, Lock, Unlock, Paperclip, Star, Ban } from 'lucide-react';

export default function NodeCard({ node, isEditMode, onMouseDown, onClick }) {
  const isLocked = node.status === 'locked';
  const isCompleted = node.status === 'completed';
  const isBlocked = node.status === 'blocked'; // Le nouveau statut !

  // Styles dynamiques basés sur l'état
  let bg = node.bgColor || '#ffffff';
  let color = node.textColor || '#000000';
  let borderColor = `${color}40`;
  let opacity = 1;

  if (isLocked) {
    bg = '#f8fafc'; color = '#94a3b8'; borderColor = '#e2e8f0'; opacity = 0.8;
  } else if (isBlocked) {
    bg = '#f1f5f9'; color = '#cbd5e1'; borderColor = '#e2e8f0'; opacity = 0.5; // Très grisé
  } else if (isCompleted) {
    borderColor = '#22c55e';
  }

  const displayTitle = (isLocked && node.lockedTitle) ? node.lockedTitle : node.title;

  const handleClick = () => {
    if (!isEditMode && !isLocked && !isBlocked) onClick(node);
    else if (isEditMode) onClick(node);
  };

  return (
    <div
      className={`absolute w-[240px] p-4 rounded-2xl border-2 flex flex-col items-center justify-center text-center select-none shadow-sm transition-all duration-200 ${isEditMode ? 'cursor-move' : (isLocked || isBlocked ? 'cursor-not-allowed' : 'cursor-pointer hover:shadow-xl hover:-translate-y-1')} ${isBlocked ? 'grayscale' : ''}`}
      style={{ left: node.position.x, top: node.position.y, backgroundColor: bg, color: color, borderColor: borderColor, opacity: opacity }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={handleClick}
    >
      {/* Badge de statut */}
      <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100 z-10">
        {isBlocked ? <Ban size={16} className="text-red-400" /> :
         isLocked ? <Lock size={16} className="text-slate-400" /> : 
         isCompleted ? <CheckCircle size={18} className="text-green-500" /> : 
         <Unlock size={16} className="text-indigo-500" />}
      </div>

      <div className="absolute -top-3 -left-3 flex gap-1 z-10">
        {!isLocked && !isBlocked && node.attachments?.length > 0 && (
          <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100 text-indigo-500"><Paperclip size={14} /></div>
        )}
        {!isCompleted && !isLocked && !isBlocked && node.xpReward > 0 && (
          <div className="h-8 px-2.5 rounded-full flex items-center justify-center bg-white shadow-md border border-slate-100 text-yellow-500 font-black text-xs gap-1"><Star size={12} fill="currentColor" /> {node.xpReward}</div>
        )}
      </div>

      <div className="text-4xl mb-2 filter drop-shadow-sm">
        {isBlocked ? '❌' : isLocked ? '🔒' : (node.emoji || '🌟')}
      </div>

      <h3 className={`font-black text-base leading-tight mb-1 ${isBlocked ? 'line-through' : ''}`}>{displayTitle}</h3>
      
      {!isLocked && !isBlocked && node.subtitle && (
        <span className="text-xs font-bold uppercase tracking-wider opacity-60">{node.subtitle}</span>
      )}
    </div>
  );
}