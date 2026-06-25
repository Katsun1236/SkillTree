import React from 'react';
import { Plus, FolderTree } from 'lucide-react';
import { supabase } from '../supabaseClient';


function Button({ children, onClick, variant = 'primary', fullWidth = false, className = '', icon: Icon, type = "button", ...props }) {
  let baseStyle = "flex items-center justify-center gap-2 font-bold transition ";

  if (variant === 'primary') {
    baseStyle += "bg-black text-white px-6 py-3 rounded-xl hover:bg-slate-800 shadow-md ";
  } else if (variant === 'secondary') {
    baseStyle += "bg-slate-100 text-black px-6 py-3 rounded-xl hover:bg-slate-200 ";
  } else if (variant === 'outline') {
    baseStyle += "border-2 border-black text-black px-6 py-3 rounded-xl hover:bg-slate-50 ";
  } else if (variant === 'icon') {
    baseStyle = "p-2 hover:bg-slate-100 rounded-full transition flex items-center justify-center text-slate-600 hover:text-black ";
  }

  if (fullWidth) {
    baseStyle += "w-full ";
  }

  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${className}`} {...props}>
      {Icon && <Icon size={20} />}
      {children}
    </button>
  );
}
// --------------------------------------------------

export default function IndexView({ setView, setActiveTreeId }) {
  // --- NOUVELLE FONCTION DE DÉCONNEXION ---
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
          <Button icon={Plus} onClick={() => alert("Fonctionnalité de création à venir !")}>
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