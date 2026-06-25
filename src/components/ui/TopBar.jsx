import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Share2, Settings } from 'lucide-react';

export default function TopBar({ title = 'SkillTree', onLogout, user }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email || 'Utilisateur';
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center flex-shrink-0 z-10 relative">
      <div className="flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
          <circle cx="20" cy="7" r="4" fill="#6C63FF"/>
          <line x1="20" y1="11" x2="20" y2="17" stroke="#6C63FF" strokeWidth="1.5"/>
          <circle cx="10" cy="21" r="3.5" fill="#6C63FF" fillOpacity="0.75"/>
          <circle cx="30" cy="21" r="3.5" fill="#6C63FF" fillOpacity="0.75"/>
          <line x1="20" y1="17" x2="10" y2="21" stroke="#6C63FF" strokeWidth="1.5" strokeOpacity="0.6"/>
          <line x1="20" y1="17" x2="30" y2="21" stroke="#6C63FF" strokeWidth="1.5" strokeOpacity="0.6"/>
          <circle cx="4" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
          <circle cx="16" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
          <circle cx="24" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
          <circle cx="36" cy="32" r="3" fill="#6C63FF" fillOpacity="0.45"/>
          <line x1="10" y1="24.5" x2="4" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
          <line x1="10" y1="24.5" x2="16" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
          <line x1="30" y1="24.5" x2="24" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
          <line x1="30" y1="24.5" x2="36" y2="32" stroke="#6C63FF" strokeWidth="1" strokeOpacity="0.3"/>
        </svg>
        <span className="font-black text-lg">{title}</span>
      </div>

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 hover:bg-slate-100 rounded-full p-1 transition"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-500 flex items-center justify-center text-white text-sm font-bold ring-2 ring-slate-200">
              {initials}
            </div>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              {avatarUrl && <img src={avatarUrl} alt={displayName} className="w-10 h-10 rounded-full object-cover mb-2"/>}
              <p className="font-bold text-sm truncate">{displayName}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
            <div className="p-1">
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition"
              >
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}