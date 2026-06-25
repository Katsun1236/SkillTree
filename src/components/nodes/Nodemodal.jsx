import React, { useEffect, useRef, useState } from 'react';
import { X, Bold, Italic, Strikethrough, Link, Image as ImageIcon, Video, Highlighter, Settings, CheckCircle, Upload, Palette, Table as TableIcon, Plus, ChevronRight, AlertTriangle, Trash2, Paperclip, FileDown } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import ImageExtension from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import Youtube from '@tiptap/extension-youtube';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Node, mergeAttributes } from '@tiptap/core';
import { supabase } from '../../supabaseClient';


const CustomVideo = Node.create({
  name: 'customVideo',
  group: 'block', selectable: true, draggable: true,
  addAttributes() { return { src: { default: null } }; },
  parseHTML() { return [{ tag: 'video' }]; },
  renderHTML({ HTMLAttributes }) { return ['video', mergeAttributes(HTMLAttributes, { controls: true, className: 'w-full rounded-xl my-4 shadow-sm' })]; },
  addCommands() { return { setCustomVideo: (options) => ({ commands }) => commands.insertContent({ type: this.name, attrs: options }) }; },
});

export default function NodeModal({ selectedNode, isEditMode, nodes, updateNodeData, markAsRead, onClose }) {
  const fileInputRef = useRef(null);
  const attachmentInputRef = useRef(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState([]);
  const [qcmError, setQcmError] = useState(false);

  const pages = selectedNode?.pages?.length > 0 ? selectedNode.pages : [{ id: 'default', content: selectedNode?.content || '', validation: { type: 'read' } }];
  const currentPage = pages[currentPageIndex];

  const editor = useEditor({
    extensions: [
      StarterKit, TextStyle, Color,
      LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-indigo-600 underline cursor-pointer' } }),
      ImageExtension.configure({ HTMLAttributes: { class: 'max-w-full h-auto rounded-xl my-4 mx-auto' } }),
      Highlight.configure({ multicolor: true }),
      Youtube.configure({ HTMLAttributes: { class: 'w-full aspect-video rounded-xl my-4' } }),
      Table.configure({ resizable: true }), TableRow, TableHeader, TableCell, CustomVideo,
    ],
    content: currentPage?.content || '',
    onUpdate: ({ editor }) => updatePageData('content', editor.getHTML()),
    editable: isEditMode,
  });

  useEffect(() => {
    if (editor && currentPage) {
      editor.setEditable(isEditMode);
      if (editor.getHTML() !== currentPage.content) editor.commands.setContent(currentPage.content || '');
    }
    setSelectedAnswers([]);
    setQcmError(false);
  }, [currentPageIndex, selectedNode?.id, isEditMode]);

  if (!selectedNode) return null;

  const updatePageData = (field, value) => {
    const newPages = [...pages];
    newPages[currentPageIndex] = { ...newPages[currentPageIndex], [field]: value };
    updateNodeData(selectedNode.id, 'pages', newPages);
  };

  const updateValidation = (field, value) => {
    const newPages = [...pages];
    newPages[currentPageIndex].validation = { ...newPages[currentPageIndex].validation, [field]: value };
    updateNodeData(selectedNode.id, 'pages', newPages);
  };

  const addPage = () => {
    const newPages = [...pages, { id: `page-${Date.now()}`, content: '', validation: { type: 'read' } }];
    updateNodeData(selectedNode.id, 'pages', newPages);
    setCurrentPageIndex(newPages.length - 1);
  };

  const deleteCurrentPage = () => {
    if (pages.length <= 1) return alert("Tu dois avoir au moins une page.");
    if (!confirm("Supprimer cette page ?")) return;
    const newPages = pages.filter((_, idx) => idx !== currentPageIndex);
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    updateNodeData(selectedNode.id, 'pages', newPages);
  };

  const addImage = () => { const url = prompt("URL de l'image :"); if (url) editor.chain().focus().setImage({ src: url }).run(); };
  const addVideo = () => { const url = prompt("URL YouTube :"); if (url) editor.chain().focus().setYoutubeVideo({ src: url }).run(); };
  const addLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = prompt("URL du lien :", previousUrl);
    if (url === null) return;
    if (url === '') return editor.chain().focus().extendMarkRange('link').unsetLink().run();
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const fileName = `${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
    const { error } = await supabase.storage.from('medias').upload(fileName, file);
    if (error) { alert("Erreur d'upload : " + error.message); setIsUploading(false); return; }
    const { data } = supabase.storage.from('medias').getPublicUrl(fileName);
    if (file.type.startsWith('video/')) editor.chain().focus().setCustomVideo({ src: data.publicUrl }).run();
    else editor.chain().focus().setImage({ src: data.publicUrl }).run();
    setIsUploading(false);
  };

  // --- UPLOAD DES PIÈCES JOINTES ---
  const handleAttachmentUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsUploadingAttachment(true);
    const fileName = `${Math.random().toString(36).substring(2)}_${file.name}`;
    const { error } = await supabase.storage.from('medias').upload(fileName, file);
    if (error) { alert("Erreur d'upload du fichier : " + error.message); setIsUploadingAttachment(false); return; }
    
    const { data } = supabase.storage.from('medias').getPublicUrl(fileName);
    const newAttachments = [...(selectedNode.attachments || []), { name: file.name, url: data.publicUrl }];
    updateNodeData(selectedNode.id, 'attachments', newAttachments);
    setIsUploadingAttachment(false);
  };

  const handleValidateStep = () => {
    if (currentPage.validation.type === 'qcm') {
      const correctIds = currentPage.validation.options.filter(o => o.isCorrect).map(o => o.id);
      const isCorrect = correctIds.length === selectedAnswers.length && correctIds.every(id => selectedAnswers.includes(id));
      if (!isCorrect) { setQcmError(true); return; }
    }
    if (currentPageIndex < pages.length - 1) setCurrentPageIndex(currentPageIndex + 1);
    else markAsRead(selectedNode.id);
  };

  return (
    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white text-black rounded-3xl w-full max-w-4xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        
        <div className="bg-white border-b border-slate-100 p-6 pb-0">
          <div className="flex justify-between items-center mb-4">
            {isEditMode ? (
              <input type="text" value={selectedNode.title} onChange={(e) => updateNodeData(selectedNode.id, 'title', e.target.value)} className="font-black text-3xl bg-transparent outline-none w-2/3 focus:border-b-2 border-slate-200" />
            ) : (
              <h2 className="font-black text-3xl">{selectedNode.title}</h2>
            )}
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={24} /></button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-4 items-center">
            {pages.map((p, idx) => (
              <button key={p.id} onClick={() => isEditMode && setCurrentPageIndex(idx)} className={`px-4 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-colors ${idx === currentPageIndex ? 'bg-black text-white' : (isEditMode ? 'bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer' : 'bg-slate-50 text-slate-400 cursor-not-allowed opacity-50')}`}>
                Page {idx + 1}
              </button>
            ))}
            {isEditMode && <button onClick={addPage} className="p-2 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition font-bold flex items-center gap-1 text-sm"><Plus size={16} /> Ajouter une page</button>}
            {isEditMode && pages.length > 1 && <button onClick={deleteCurrentPage} className="ml-auto p-2 text-red-400 hover:bg-red-50 rounded-lg transition" title="Supprimer la page"><Trash2 size={16} /></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          
          {isEditMode ? (
            <div className="border border-slate-200 rounded-2xl overflow-hidden flex flex-col bg-white mb-8 shadow-sm">
              {/* Barre d'outils TipTap */}
              <div className="bg-white p-2 border-b border-slate-200 flex flex-wrap gap-1 items-center">
                <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded transition ${editor?.isActive('bold') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Bold size={16} /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded transition ${editor?.isActive('italic') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Italic size={16} /></button>
                <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded transition ${editor?.isActive('strike') ? 'bg-black text-white' : 'hover:bg-slate-100 text-slate-600'}`}><Strikethrough size={16} /></button>
                <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                <button type="button" onClick={addLink} className={`p-1.5 rounded transition ${editor?.isActive('link') ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-slate-100 text-slate-600'}`}><Link size={16} /></button>
                <button type="button" onClick={addImage} title="Image (URL)" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"><ImageIcon size={16} /></button>
                <button type="button" onClick={addVideo} title="YouTube" className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition"><Video size={16} /></button>
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*,video/*" className="hidden" />
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition flex items-center gap-1" title="Upload local">
                  <Upload size={16} />{isUploading && <span className="text-[10px] font-bold animate-pulse">...</span>}
                </button>
                <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                <button type="button" onClick={() => editor.chain().focus().toggleHighlight({ color: '#fef08a' }).run()} className={`p-1.5 rounded transition ${editor?.isActive('highlight') ? 'bg-yellow-200 text-black' : 'hover:bg-slate-100 text-slate-600'}`}><Highlighter size={16} /></button>
                <input type="color" onInput={(e) => editor.chain().focus().setColor(e.target.value).run()} value={editor?.getAttributes('textStyle').color || '#000000'} className="w-6 h-6 ml-1 rounded cursor-pointer border border-slate-200" />
                <div className="h-5 w-[1px] bg-slate-200 mx-1" />
                <button type="button" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 transition flex items-center gap-1 text-xs font-bold"><TableIcon size={16}/> Tab</button>
                {editor?.isActive('table') && (
                  <>
                    <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold">+ Lig</button>
                    <button type="button" onClick={() => editor.chain().focus().addColumnAfter().run()} className="p-1.5 hover:bg-slate-100 rounded text-slate-600 text-[10px] font-bold">+ Col</button>
                    <button type="button" onClick={() => editor.chain().focus().deleteTable().run()} className="p-1.5 hover:bg-red-50 rounded text-red-500 text-[10px] font-bold">Sup. Tab</button>
                  </>
                )}
              </div>
              <div className="p-6 min-h-[300px] outline-none prose max-w-none font-medium leading-relaxed bg-white"><EditorContent editor={editor} /></div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8 font-medium leading-relaxed text-lg prose max-w-none" dangerouslySetInnerHTML={{ __html: currentPage.content }} />
          )}

          {/* AFFICHAGE DES PIÈCES JOINTES EN MODE LECTURE */}
          {!isEditMode && selectedNode.attachments?.length > 0 && (
            <div className="mt-8 border-t border-slate-200 pt-6">
              <h3 className="font-black text-lg mb-4 flex items-center gap-2 text-slate-700"><Paperclip size={20} /> Ressources à télécharger</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {selectedNode.attachments.map((file, i) => (
                  <a key={i} href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-400 hover:shadow-md transition group">
                    <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition"><FileDown size={20} /></div>
                    <span className="font-bold text-sm truncate text-slate-700 group-hover:text-black">{file.name}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* VALIDATION QCM / LECTURE */}
          {isEditMode ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-black mb-4 flex items-center gap-2 text-lg"><CheckCircle size={20} /> Méthode de validation (Page {currentPageIndex + 1})</h3>
              <div className="mb-4">
                <label className="text-sm font-bold text-slate-500 mr-4">Type :</label>
                <select value={currentPage.validation.type} onChange={(e) => updateValidation('type', e.target.value)} className="p-2 border border-slate-200 rounded-lg text-sm font-bold outline-none">
                  <option value="read">Bouton classique (J'ai lu)</option>
                  <option value="qcm">Question à Choix Multiples (QCM/QRM)</option>
                </select>
              </div>
              {currentPage.validation.type === 'qcm' && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <input type="text" placeholder="Pose ta question ici..." value={currentPage.validation.question || ''} onChange={(e) => updateValidation('question', e.target.value)} className="w-full p-3 mb-4 rounded-lg border border-slate-200 outline-none font-bold" />
                  <div className="space-y-2 mb-4">
                    {(currentPage.validation.options || []).map((opt, i) => (
                      <div key={opt.id} className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                        <input type="checkbox" checked={opt.isCorrect || false} onChange={(e) => { const newOpts = [...currentPage.validation.options]; newOpts[i].isCorrect = e.target.checked; updateValidation('options', newOpts); }} className="w-5 h-5 accent-green-500 cursor-pointer" title="Cocher si c'est une bonne réponse" />
                        <input type="text" value={opt.text} onChange={(e) => { const newOpts = [...currentPage.validation.options]; newOpts[i].text = e.target.value; updateValidation('options', newOpts); }} className="flex-1 outline-none text-sm" placeholder={`Option ${i + 1}`} />
                        <button onClick={() => updateValidation('options', currentPage.validation.options.filter(o => o.id !== opt.id))} className="text-red-400 p-1 hover:bg-red-50 rounded"><X size={16} /></button>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => { const newOpts = [...(currentPage.validation.options || []), { id: `opt-${Date.now()}`, text: '', isCorrect: false }]; updateValidation('options', newOpts); }} className="text-sm font-bold bg-white border border-slate-200 px-4 py-2 rounded-lg hover:border-black transition">+ Ajouter un choix</button>
                </div>
              )}
            </div>
          ) : (
            currentPage.validation.type === 'qcm' && (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mt-8">
                <h3 className="font-black text-xl mb-6">{currentPage.validation.question}</h3>
                <div className="grid gap-3">
                  {(currentPage.validation.options || []).map(opt => (
                    <label key={opt.id} className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedAnswers.includes(opt.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                      <input type="checkbox" checked={selectedAnswers.includes(opt.id)} onChange={() => { setQcmError(false); setSelectedAnswers(prev => prev.includes(opt.id) ? prev.filter(id => id !== opt.id) : [...prev, opt.id]); }} className="w-5 h-5 accent-indigo-600" />
                      <span className="font-bold text-slate-700">{opt.text}</span>
                    </label>
                  ))}
                </div>
                {qcmError && <p className="mt-4 text-red-500 font-bold flex items-center gap-2 bg-red-50 p-3 rounded-lg"><AlertTriangle size={18} /> Mauvaise réponse, essaie encore !</p>}
              </div>
            )
          )}

          {/* PARAMÈTRES GLOBAUX (XP & PIÈCES JOINTES) */}
          {isEditMode && currentPageIndex === 0 && (
            <div className="mt-8 grid grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <h3 className="col-span-2 font-black mb-2 flex items-center gap-2"><Settings size={20} /> Paramètres de la carte</h3>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">XP Gagnée</label>
                <input type="number" value={selectedNode.xpReward || 0} onChange={(e) => updateNodeData(selectedNode.id, 'xpReward', parseInt(e.target.value) || 0)} className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Emoji / Icône</label>
                <input type="text" maxLength="2" value={selectedNode.emoji || '🌟'} onChange={(e) => updateNodeData(selectedNode.id, 'emoji', e.target.value)} className="w-full p-2 bg-white border border-slate-200 rounded-lg text-center outline-none" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-500 mb-1">Titre caché (si verrouillé)</label>
                <input type="text" value={selectedNode.lockedTitle || ''} onChange={(e) => updateNodeData(selectedNode.id, 'lockedTitle', e.target.value)} className="w-full bg-white p-2 rounded-lg border border-slate-200 outline-none text-sm" />
              </div>

              {/* UPLOAD DES PIÈCES JOINTES */}
              <div className="col-span-2 mt-2">
                <label className="block text-xs font-bold text-slate-500 mb-2">Fichiers joints (PDF, ZIP...)</label>
                <div className="space-y-2 mb-3">
                  {(selectedNode.attachments || []).map((file, i) => (
                    <div key={i} className="flex justify-between items-center p-2 bg-white border border-slate-200 rounded-lg text-sm">
                      <a href={file.url} target="_blank" rel="noopener noreferrer" className="font-bold text-indigo-600 truncate flex items-center gap-2"><Paperclip size={14}/> {file.name}</a>
                      <button onClick={() => { const newAtt = [...selectedNode.attachments]; newAtt.splice(i, 1); updateNodeData(selectedNode.id, 'attachments', newAtt); }} className="text-red-400 hover:text-red-600"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
                <input type="file" ref={attachmentInputRef} onChange={handleAttachmentUpload} className="hidden" />
                <button onClick={() => attachmentInputRef.current?.click()} disabled={isUploadingAttachment} className="text-xs font-bold bg-white border border-slate-200 px-3 py-2 rounded-lg hover:border-black transition flex items-center gap-2 w-max">
                  <Upload size={14} /> {isUploadingAttachment ? 'Envoi...' : 'Ajouter un fichier'}
                </button>
              </div>

              <div className="col-span-2 mt-4">
                <label className="block text-xs font-bold text-slate-500 mb-2">Compétences requises :</label>
                <div className="flex flex-wrap gap-2">
                  {nodes.filter(n => n.id !== selectedNode.id).map(otherNode => (
                    <label key={otherNode.id} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer text-xs font-bold">
                      <input type="checkbox" checked={selectedNode.dependsOn.includes(otherNode.id)} onChange={(e) => {
                        let newDepends = [...selectedNode.dependsOn];
                        if (e.target.checked) newDepends.push(otherNode.id); else newDepends = newDepends.filter(id => id !== otherNode.id);
                        updateNodeData(selectedNode.id, 'dependsOn', newDepends);
                      }} className="w-3.5 h-3.5 accent-black" />
                      {otherNode.title}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="p-6 border-t border-slate-100 bg-white">
          {!isEditMode && selectedNode.status !== 'completed' ? (
            <button onClick={handleValidateStep} className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-4 rounded-xl font-black text-lg hover:bg-slate-800 transition">
              {currentPageIndex < pages.length - 1 ? <>Étape suivante <ChevronRight size={24} /></> : <><CheckCircle size={24} /> Valider l'apprentissage</>}
            </button>
          ) : !isEditMode && selectedNode.status === 'completed' ? (
            <div className="w-full flex items-center justify-center gap-2 text-black font-black text-lg py-4 border-2 border-black rounded-xl bg-slate-50">
              <CheckCircle size={24} className="text-green-500" /> Compétence maîtrisée
            </div>
          ) : isEditMode ? (
             <button onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-black px-6 py-4 rounded-xl font-black text-lg transition">Terminer l'édition</button>
          ) : null}
        </div>
        <div className="col-span-2 mt-4">
                <label className="block text-xs font-bold text-red-500 mb-2">Compétences incompatibles (Valider cette carte bloquera celles-ci) :</label>
                <div className="flex flex-wrap gap-2">
                  {nodes.filter(n => n.id !== selectedNode.id).map(otherNode => (
                    <label key={`excl-${otherNode.id}`} className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-200 cursor-pointer text-xs font-bold hover:bg-red-100">
                      <input type="checkbox" checked={selectedNode.exclusiveWith?.includes(otherNode.id)} onChange={(e) => {
                        let newExclusive = [...(selectedNode.exclusiveWith || [])];
                        if (e.target.checked) newExclusive.push(otherNode.id); 
                        else newExclusive = newExclusive.filter(id => id !== otherNode.id);
                        updateNodeData(selectedNode.id, 'exclusiveWith', newExclusive);
                      }} className="w-3.5 h-3.5 accent-red-500" />
                      <Ban size={14} /> {otherNode.title}
                    </label>
                  ))}
                </div>
              </div>
      </div>
    </div>
  );
}