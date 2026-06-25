import React from 'react';

export default function TopBar({ title = "SkillTree", onLogout, showLogout = true }) {
  return (
    <header className="bg-white border-b border-slate-200 p-4 flex justify-between items-center px-8 w-full z-10 relative">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-black text-xl shadow-sm">
          S
        </div>
        <span className="font-black text-xl">{title}</span>
      </div>
      {showLogout && (
        <button 
          onClick={onLogout} 
          className="font-bold text-slate-500 hover:text-black transition"
        >
          Déconnexion
        </button>
      )}
    </header>
  );
}