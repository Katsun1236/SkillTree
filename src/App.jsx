import React, { useState, useEffect } from 'react';

import { supabase } from './supabaseClient';
import Login from './pages/Login';
import IndexView from './pages/Index';
import TreeView from './pages/TreeView';

function IndexView({ setView, setActiveTreeId }) {
  return (
    <div className="flex h-full w-full items-center justify-center gap-4">
      <button onClick={() => { setActiveTreeId('1'); setView('tree'); }} className="bg-black text-white p-4 rounded-xl font-bold">
        Ouvrir un arbre (Aperçu)
      </button>
      <button onClick={() => setView('login')} className="bg-slate-200 text-black p-4 rounded-xl font-bold">
        Déconnexion
      </button>
    </div>
  );
}

function TreeView({ setView, treeId }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <button onClick={() => setView('index')} className="bg-black text-white p-4 rounded-xl font-bold">
        Retour à l'accueil (Aperçu)
      </button>
    </div>
  );
}
// -------------------------------------------------------------------------

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [activeTreeId, setActiveTreeId] = useState(null);

  useEffect(() => {
    // 1. On vérifie si on est déjà connecté en arrivant sur la page
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setCurrentView('index');
    });

    // 2. On écoute en temps réel (ex: quand Discord nous renvoie validé)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentView(session ? 'index' : 'login');
    });

    return () => subscription.unsubscribe();
  }, []);
  
  

  return (
    <div className="h-screen w-full bg-slate-50 text-black overflow-hidden">
      {currentView === 'login' && <Login setView={setCurrentView} />}
      {currentView === 'index' && <IndexView setView={setCurrentView} setActiveTreeId={setActiveTreeId} />}
      {currentView === 'tree' && <TreeView setView={setCurrentView} treeId={activeTreeId} />}
    </div>
  );
}