import React from 'react';
import { CheckCircle, Lock, Unlock } from 'lucide-react';

export default function NodeCard({ node, isEditMode, onMouseDown, onClick }) {
  let styleClasses = "bg-white border-slate-300 text-black shadow-sm";
  let Icon = Lock;

  if (node.status === 'locked') {
    styleClasses = "bg-slate-50 border-slate-200 text-slate-400 opacity-60";
    Icon = Lock;
  } else if (node.status === 'unlocked') {
    styleClasses = "bg-white border-black text-black shadow-lg border-2 hover:-translate-y-1 transition-transform";
    Icon = Unlock;
  } else if (node.status === 'completed') {
    styleClasses = "bg-black border-black text-white shadow-lg hover:-translate-y-1 transition-transform";
    Icon = CheckCircle;
  }

  const handleClick = () => {
    if (!isEditMode && node.status !== 'locked') {
      onClick(node);
    } else if (isEditMode) {
      onClick(node);
    }
  };

  return (
    <div
      className={`absolute w-[200px] min-h-[80px] p-4 rounded-xl border flex flex-col items-center justify-center text-center select-none ${styleClasses} ${isEditMode ? 'cursor-move' : 'cursor-pointer'}`}
      style={{ left: node.position.x, top: node.position.y }}
      onMouseDown={(e) => onMouseDown(e, node.id)}
      onClick={handleClick}
    >
      <Icon size={20} className="mb-2" />
      <span className="font-bold text-sm">{node.title}</span>
    </div>
  );
}