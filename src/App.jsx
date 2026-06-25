import React, { useState } from 'react';

export default function App() {
  const [currentView, setCurrentView] = useState('login');
  const [activeTreeId, setActiveTreeId] = useState(null);

  return (
    <div className="h-screen w-full bg-slate-50 text-black overflow-hidden">
      {currentView === 'login' && <Login setView={setCurrentView} />}
      {currentView === 'index' && <IndexView setView={setCurrentView} setActiveTreeId={setActiveTreeId} />}
      {currentView === 'tree' && <TreeView setView={setCurrentView} treeId={activeTreeId} />}
    </div>
  );
}