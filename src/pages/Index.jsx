import React from 'react';
import { Plus, FolderTree, LogOut } from 'lucide-react';
import { supabase } from '../supabaseClient';

const mockTrees = [
  { id: 1, name: 'Développement Web', nodesCount: 24 },
  { id: 2, name: 'Design UI/UX', nodesCount: 18 },
  { id: 3, name: 'DevOps', nodesCount: 12 },
];

function TopBar({ title, onLogout }) {
  return (
    <header className="w-full bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between flex-shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-black text-sm">S</div>
        <span className="font-black text-lg">{title}</span>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 text-slate-500 hover:text-black transition text-sm font-semibold"
      >
        <LogOut size={16} />
        Déconnexion
      </button>
    </header>
  );
}

function Button({ children, onClick, icon: Icon, type = 'button' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      className="flex items-center justify-center gap-2 font-bold transition bg-black text-white px-6 py-3 rounded-xl hover:bg-slate-800 shadow-md"
    >
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}

export default function IndexView({ setView, setActiveTreeId }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('login');
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      <TopBar title="Tableau de bord" onLogout={handleLogout} />

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black">Mes Arbres</h2>
          <Button icon={Plus} onClick={() => alert('Fonctionnalité de création à venir !')}>
            Créer un arbre
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockTrees.map(tree => (
            <div
              key={tree.id}
              onClick={() => { setActiveTreeId(tree.id); setView('tree'); }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-black transition cursor-pointer group"
            >
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition">
                <FolderTree size={24} />
              </div>
              <h3 className="font-bold text-xl mb-2">{tree.name}</h3>
              <p className="text-slate-500 text-sm font-medium">{tree.nodesCount} compétences</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}