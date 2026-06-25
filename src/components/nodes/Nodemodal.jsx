
import React, { useEffect } from 'react';
import { X, Bold, Italic, Strikethrough, Link, Image, Video, Highlighter, Settings, CheckCircle } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

export default function NodeModal({ 
  selectedNode, 
  isEditMode, 
  nodes, 
  updateNodeData, 
  markAsRead, 
  onClose 
}) {
  
  if (!selectedNode) return null;

  // Configuration de l'éditeur TipTap
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-600 underline cursor-pointer' } }),
      ImageExtension.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-xl my-4 mx-auto' } }),
      Highlight.configure({ multicolor: true }),
      Youtube.configure({ HTMLAttributes: { class: 'w-full aspect-video rounded-xl my-4' } }),
    ],
    content: selectedNode.content || '',
    onUpdate: ({ editor }) => {
      // Met à jour la donnée dans l'arbre quand le contenu change
      updateNodeData(selectedNode.id, 'content', editor.getHTML());
    },
    editable: isEditMode,
  });

  // Synchronise l'état éditable et le contenu si la node change
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditMode);
      if (editor.getHTML() !== selectedNode.content) {
        editor.commands.setContent(selectedNode.content || '');
      }
    }
  }, [isEditMode, selectedNode.id, editor]);

  // Fonctions pour insérer des médias riches
  const addImage = () => {
    const url = prompt("Entrez l'URL de l'image :");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  const addVideo = () => {
    const url = prompt("Entrez l'URL de la vidéo YouTube :");
    if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run();
  };

  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt("Entrez l'URL du lien :", previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const setTextColor = (e) => {
    editor.chain().focus().setColor(e.target.value).run();
  };

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-black rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* En-tête de la Modal */}
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

        {/* Corps de la Modal */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {isEditMode ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
              
              {/* Barre d'outils enrichie */}
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-wrap gap-1.5 items-center">
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-2 rounded-lg transition ${editor?.isActive('bold') ? 'bg-black text-white' : 'hover:bg-slate-200 text-black'}`}
                >
                  <Bold size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-2 rounded-lg transition ${editor?.isActive('italic') ? 'bg-black text-white' : 'hover:bg-slate-200 text-black'}`}
                >
                  <Italic size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 rounded-lg transition ${editor?.isActive('strike') ? 'bg-black text-white' : 'hover:bg-slate-200 text-black'}`}
                >
                  <Strikethrough size={18} />
                </button>

                <div className="h-6 w-[1px] bg-slate-300 mx-1" />

                <button
                  type="button"
                  onClick={addLink}
                  className={`p-2 rounded-lg transition ${editor?.isActive('link') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-black'}`}
                >
                  <Link size={18} />
                </button>
                <button
                  type="button"
                  onClick={addImage}
                  className="p-2 hover:bg-slate-200 rounded-lg text-black transition"
                >
                  <Image size={18} />
                </button>
                <button
                  type="button"
                  onClick={addVideo}
                  className="p-2 hover:bg-slate-200 rounded-lg text-black transition"
                >
                  <Video size={18} />
                </button>

                <div className="h-6 w-[1px] bg-slate-300 mx-1" />

                {/* Surlignage */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()}
                  className={`p-2 rounded-lg transition ${editor?.isActive('highlight') ? 'bg-yellow-200 text-black' : 'hover:bg-slate-200 text-black'}`}
                >
                  <Highlighter size={18} />
                </button>

                {/* Sélecteur de Couleur de texte */}
                <div className="flex items-center gap-1 pl-1">
                  <input
                    type="color"
                    onInput={setTextColor}
                    value={editor?.getAttributes('textStyle').color || '#000000'}
                    className="w-6 h-6 rounded cursor-pointer border border-slate-300 overflow-hidden"
                  />
                </div>
              </div>

              {/* Zone d'édition de TipTap */}
              <div className="p-6 min-h-[250px] outline-none prose max-w-none font-medium leading-relaxed">
                <EditorContent editor={editor} />
              </div>

            </div>
          ) : (
            // Mode Lecture seule (rendu propre du HTML généré)
            <div 
              className="font-medium leading-relaxed text-lg prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedNode.content }}
            />
          )}

          {/* Conditions de Déblocage (Uniquement en mode Edition) */}
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

        {/* Pied de la Modal */}
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