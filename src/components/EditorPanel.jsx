import React from 'react';
import { ArrowLeft, Plus, Palette, Move, Type } from 'lucide-react';

export default function EditorPanel({ setView, addNode, setIsEditMode }) {
  return (
    <aside className="w-80 h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20 relative">
      <div className="p-4 border-b border-slate-200 flex items-center gap-4">
        <button onClick={() => setView('index')} className="p-2 hover:bg-slate-100 rounded-lg transition">
          <ArrowLeft size={20} />
        </button>
        <h2 className="font-black text-xl">Éditeur</h2>
      </div>
      
      <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto">
        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Outils</h3>
          <button 
            onClick={addNode} 
            className="w-full bg-black text-white p-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition"
          >
            <Plus size={18} /> Ajouter une compétence
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Propriétés de l'arbre</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Grille d'alignement</span>
              <div className="w-10 h-6 bg-black rounded-full p-1 cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full translate-x-4 transition-transform"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">Arrière-plan</span>
              <button className="flex items-center gap-2 text-sm border p-1.5 rounded-md hover:bg-slate-200 transition">
                <Palette size={14}/> Blanc
              </button>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Raccourcis</h3>
          <ul className="text-sm font-medium space-y-2 text-slate-600">
            <li className="flex items-center gap-2"><Move size={14}/> Glisser pour déplacer</li>
            <li className="flex items-center gap-2"><Type size={14}/> Clic pour éditer le contenu</li>
          </ul>
        </div>
      </div>
      
      <div className="p-4 border-t border-slate-200">
         <button 
            onClick={() => setIsEditMode(false)} 
            className="w-full bg-slate-100 text-black p-3 rounded-lg font-bold hover:bg-slate-200 transition"
         >
            Quitter l'éditeur
         </button>
      </div>
    </aside>
  );
}