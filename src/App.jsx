import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Login from './pages/Login';
import IndexView from './pages/Index';
import TreeView from './pages/TreeView';

export default function App() {
  const [session, setSession] = useState(null);
  const [currentView, setCurrentView] = useState('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setCurrentView('index');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCurrentView(session ? 'index' : 'login');
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="h-screen w-full bg-slate-50 text-black">
      {currentView === 'login' && <Login />}
      {currentView === 'index' && <IndexView setView={setCurrentView} />}
      {currentView === 'tree' && <TreeView setView={setCurrentView} />}
    </div>
  );
}