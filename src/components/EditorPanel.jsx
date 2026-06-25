import React from 'react';
import { ArrowLeft, Plus, Palette, Move, Type } from 'lucide-react';

export default function EditorPanel({ setView, addNode, setIsEditMode, treeData, updateTreeData }) {
  return (
    <aside className="w-80 h-full bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20 relative">
      <div className="p-4 border-b border-slate-200 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('index')} className="p-2 hover:bg-slate-100 rounded-lg transition">
            <ArrowLeft size={20} />
          </button>
          <h2 className="font-black text-xl">Éditeur</h2>
        </div>
        
        {/* MODIFIER LE NOM DU TABLEAU */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nom du tableau</label>
          <input
            type="text"
            value={treeData?.name || ''}
            onChange={(e) => updateTreeData('name', e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-lg font-bold text-sm outline-none focus:border-black mt-1"
          />
        </div>
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

        {/* CHOISIR UNE IMAGE OU COULEUR DE FOND */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Propriétés de l'arrière-plan</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Type de fond</label>
              <select
                value={treeData?.background_type || 'color'}
                onChange={(e) => updateTreeData('background_type', e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold outline-none"
              >
                <option value="color">Couleur unie</option>
                <option value="image">Image (URL)</option>
              </select>
            </div>

            {treeData?.background_type === 'color' ? (
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Couleur</span>
                <input
                  type="color"
                  value={treeData?.background_value || '#ffffff'}
                  onChange={(e) => updateTreeData('background_value', e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 overflow-hidden"
                />
              </div>
            ) : (
              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">URL de l'image</label>
                <input
                  type="text"
                  value={treeData?.background_value || ''}
                  onChange={(e) => updateTreeData('background_value', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-black"
                />
              </div>
            )}
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