import React, { useEffect, useRef, useState } from 'react';
import { X, Bold, Italic, Strikethrough, Link, Image as ImageIcon, Video, Highlighter, Settings, CheckCircle, Upload, Palette } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Node, mergeAttributes } from '@tiptap/core';
import { supabase } from '../../supabaseClient';

// Extension sur mesure pour lire les vidéos MP4 uploadées
const CustomVideo = Node.create({
  name: 'customVideo',
  group: 'block',
  selectable: true,
  draggable: true,
  addAttributes() {
    return { src: { default: null } };
  },
  parseHTML() {
    return [{ tag: 'video' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { controls: true, className: 'w-full rounded-xl my-4 shadow-sm' })];
  },
  addCommands() {
    return {
      setCustomVideo: (options) => ({ commands }) => {
        return commands.insertContent({ type: this.name, attrs: options });
      },
    };
  },
});

export default function NodeModal({ 
  selectedNode, 
  isEditMode, 
  nodes, 
  updateNodeData, 
  markAsRead, 
  onClose 
}) {
  const fileInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);

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
      CustomVideo,
    ],
    content: selectedNode?.content || '',
    onUpdate: ({ editor }) => {
      updateNodeData(selectedNode.id, 'content', editor.getHTML());
    },
    editable: isEditMode,
  });

  // Synchronise l'état éditable et le contenu si la node change
  useEffect(() => {
    if (editor && selectedNode) {
      editor.setEditable(isEditMode);
      if (editor.getHTML() !== selectedNode.content) {
        editor.commands.setContent(selectedNode.content || '');
      }
    }
  }, [isEditMode, selectedNode?.id, editor]);

  if (!selectedNode) return null;

  // Fonctions pour insérer des médias riches via URL
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

  // Upload de fichier local vers Supabase Storage
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { error } = await supabase.storage.from('medias').upload(fileName, file);
    
    if (error) {
      alert("Erreur d'upload : " + error.message);
      setIsUploading(false);
      return;
    }

    const { data } = supabase.storage.from('medias').getPublicUrl(fileName);

    if (file.type.startsWith('video/')) {
      editor.chain().focus().setCustomVideo({ src: data.publicUrl }).run();
    } else {
      editor.chain().focus().setImage({ src: data.publicUrl }).run();
    }
    setIsUploading(false);
  };

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-black rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* En-tête */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          {isEditMode ? (
            <input 
              type="text" 
              value={selectedNode.title}
              onChange={(e) => updateNodeData(selectedNode.id, 'title', e.target.value)}
              className="font-black text-3xl bg-transparent outline-none w-2/3 focus:border-b-2 border-slate-200"
            />
          ) : (
            <h2 className="font-black text-3xl">{selectedNode.title}</h2>
          )}
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-8">
          
          {isEditMode ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white">
              
              {/* Barre d'outils TipTap */}
              <div className="bg-slate-50 p-3 border-b border-slate-200 flex flex-wrap gap-1.5 items-center">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded-lg transition ${editor?.isActive('bold') ? 'bg-black text-white' : 'hover:bg-slate-200 text-black'}`}>
                  <Bold size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded-lg transition ${editor?.isActive('italic') ? 'bg-black text-white' : 'hover:bg-slate-200 text-black'}`}>
                  <Italic size={18} />
                </button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-2 rounded-lg transition ${editor?.isActive('strike') ? 'bg-black text-white' : 'hover:bg-slate-200 text-black'}`}>
                  <Strikethrough size={18} />
                </button>

                <div className="h-6 w-[1px] bg-slate-300 mx-1" />

                <button type="button" onClick={addLink} className={`p-2 rounded-lg transition ${editor?.isActive('link') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-200 text-black'}`}>
                  <Link size={18} />
                </button>
                <button type="button" onClick={addImage} title="Image depuis un lien" className="p-2 hover:bg-slate-200 rounded-lg text-black transition">
                  <ImageIcon size={18} />
                </button>
                <button type="button" onClick={addVideo} title="Vidéo YouTube" className="p-2 hover:bg-slate-200 rounded-lg text-black transition">
                  <Video size={18} />
                </button>

                <div className="h-6 w-[1px] bg-slate-300 mx-1" />

                {/* Upload local */}
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-2 hover:bg-slate-200 rounded-lg text-black transition flex items-center gap-1"
                  title="Upload depuis l'ordinateur"
                >
                  <Upload size={18} />
                  {isUploading && <span className="text-xs font-bold animate-pulse">...</span>}
                </button>

                <div className="h-6 w-[1px] bg-slate-300 mx-1" />

                <button type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: '#ffcc00' }).run()} className={`p-2 rounded-lg transition ${editor?.isActive('highlight') ? 'bg-yellow-200 text-black' : 'hover:bg-slate-200 text-black'}`}>
                  <Highlighter size={18} />
                </button>

                <div className="flex items-center gap-1 pl-1">
                  <input type="color" onInput={setTextColor} value={editor?.getAttributes('textStyle').color || '#000000'} className="w-6 h-6 rounded cursor-pointer border border-slate-300 overflow-hidden" />
                </div>
              </div>

              {/* Zone d'édition */}
              <div className="p-6 min-h-[250px] outline-none prose max-w-none font-medium leading-relaxed">
                <EditorContent editor={editor} />
              </div>

            </div>
          ) : (
            <div 
              className="font-medium leading-relaxed text-lg prose max-w-none"
              dangerouslySetInnerHTML={{ __html: selectedNode.content }}
            />
          )}

          {/* Paramètres d'édition supplémentaires */}
          {isEditMode && (
            <>
              {/* Design de la carte */}
              <div className="mt-8 grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <h3 className="col-span-2 font-black mb-2 flex items-center gap-2">
                  <Palette size={20} /> Design de la carte
                </h3>
                
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1">Titre alternatif (si verrouillé)</label>
                  <input 
                    type="text" 
                    placeholder="Ex: ??? ou Compétence Secrète" 
                    value={selectedNode.lockedTitle || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, 'lockedTitle', e.target.value)}
                    className="w-full bg-white p-2 rounded-lg border border-slate-200 outline-none font-medium text-sm focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Emoji / Icône</label>
                  <input 
                    type="text" 
                    maxLength="2"
                    value={selectedNode.emoji || '🌟'}
                    onChange={(e) => updateNodeData(selectedNode.id, 'emoji', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xl text-center outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Sous-titre</label>
                  <input 
                    type="text" 
                    value={selectedNode.subtitle || ''}
                    onChange={(e) => updateNodeData(selectedNode.id, 'subtitle', e.target.value)}
                    placeholder="Ex: Les bases absolues"
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Couleur de fond</label>
                  <input 
                    type="color" 
                    value={selectedNode.bgColor || '#ffffff'}
                    onChange={(e) => updateNodeData(selectedNode.id, 'bgColor', e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Couleur du texte</label>
                  <input 
                    type="color" 
                    value={selectedNode.textColor || '#000000'}
                    onChange={(e) => updateNodeData(selectedNode.id, 'textColor', e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                </div>
              </div>

              {/* Conditions de déblocage */}
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
            </>
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