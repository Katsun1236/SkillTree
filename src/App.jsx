import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import IndexView from './pages/Index';
import TreeView from './pages/TreeView';

export default function App() {
  const [currentView, setCurrentView] = useState(null);
  const [activeTreeId, setActiveTreeId] = useState(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        setCurrentView(session ? 'index' : 'login');
      } else if (event === 'SIGNED_IN') {
        setCurrentView('index');
      } else if (event === 'SIGNED_OUT') {
        setCurrentView('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (currentView === null) {
    return (
      <div className="h-screen w-full bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 text-black overflow-hidden">
      {currentView === 'login' && <Login setView={setCurrentView} />}
      {currentView === 'index' && <IndexView setView={setCurrentView} setActiveTreeId={setActiveTreeId} />}
      {currentView === 'tree' && <TreeView setView={setCurrentView} treeId={activeTreeId} />}
    </div>
  );
}