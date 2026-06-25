import React from 'react';
import { X, Image as ImageIcon, Bold, Italic, Settings, CheckCircle } from 'lucide-react';

export default function NodeModal({ 
  selectedNode, 
  isEditMode, 
  nodes, 
  updateNodeData, 
  markAsRead, 
  onClose 
}) {
  if (!selectedNode) return null;

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-black rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          {isEditMode ? (
            <input 
              type="text" 
              value={selectedNode.title}
              onChange={(e) => updateNodeData(selectedNode.id, 'title', e.target.value)}
              className="font-black text-3xl bg-transparent outline-none w-2/3"
            />
          ) : (
            <h2 className="font-black text-3xl">{selectedNode.title}</h2>
          )}
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          
          {isEditMode && (
            <div className="mb-6 flex gap-4">
               <div className="flex-1 bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center gap-3">
                <ImageIcon size={20} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Lien d'une image..." 
                  value={selectedNode.image}
                  onChange={(e) => updateNodeData(selectedNode.id, 'image', e.target.value)}
                  className="flex-1 bg-transparent outline-none font-medium"
                />
              </div>
            </div>
          )}

          {selectedNode.image && (
            <img 
              src={selectedNode.image} 
              alt={selectedNode.title} 
              className="w-full h-64 object-cover rounded-2xl mb-8"
            />
          )}

          {isEditMode ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex gap-2">
                <button type="button" onClick={() => document.execCommand('bold', false, null)} className="p-2 hover:bg-slate-200 rounded-lg text-black"><Bold size={18} /></button>
                <button type="button" onClick={() => document.execCommand('italic', false, null)} className="p-2 hover:bg-slate-200 rounded-lg text-black"><Italic size={18} /></button>
              </div>
              <div 
                contentEditable
                className="p-6 min-h-[200px] outline-none font-medium leading-relaxed"
                dangerouslySetInnerHTML={{ __html: selectedNode.content }}
                onBlur={(e) => updateNodeData(selectedNode.id, 'content', e.target.innerHTML)}
              />
            </div>
          ) : (
            <div 
              className="font-medium leading-relaxed text-lg"
              dangerouslySetInnerHTML={{ __html: selectedNode.content }}
            />
          )}

          {isEditMode && (
            <div className="mt-8">
              <h3 className="font-black mb-4 flex items-center gap-2">
                <Settings size={20} /> Conditions de déblocage
              </h3>
              <div className="flex flex-wrap gap-3">
                {nodes.filter(n => n.id !== selectedNode.id).map(otherNode => (
                  <label key={otherNode.id} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 cursor-pointer hover:border-black font-bold text-sm">
                    <input 
                      type="checkbox"
                      checked={selectedNode.dependsOn.includes(otherNode.id)}
                      onChange={(e) => {
                        let newDepends = [...selectedNode.dependsOn];
                        if (e.target.checked) newDepends.push(otherNode.id);
                        else newDepends = newDepends.filter(id => id !== otherNode.id);
                        updateNodeData(selectedNode.id, 'dependsOn', newDepends);
                      }}
                      className="w-4 h-4 accent-black"
                    />
                    {otherNode.title}
                  </label>
                ))}
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          {!isEditMode && selectedNode.status !== 'completed' ? (
            <button 
              onClick={() => markAsRead(selectedNode.id)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition"
            >
              <CheckCircle size={24} /> Valider l'apprentissage
            </button>
          ) : !isEditMode && selectedNode.status === 'completed' ? (
            <div className="w-full flex items-center justify-center gap-2 text-black font-black text-lg py-4 border-2 border-black rounded-xl">
              <CheckCircle size={24} /> Compétence maîtrisée
            </div>
          ) : isEditMode ? (
             <button 
             onClick={onClose}
             className="w-full bg-slate-100 hover:bg-slate-200 text-black px-6 py-4 rounded-xl font-black text-lg transition"
           >
             Terminer l'édition
           </button>
          ) : null}
        </div>

      </div>
    </div>
  );
}