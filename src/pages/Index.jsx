import React, { useState, useEffect } from 'react';
import { Plus, FolderTree, X, Share2, Copy, Check, Trash2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import TopBar from '../components/ui/TopBar';

function CreateTreeModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('trees')
      .insert({ name: name.trim(), owner_id: user.id })
      .select()
      .single();
    if (error) { setError(error.message); setLoading(false); return; }
    onCreated(data);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-black text-xl">Nouvel arbre</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={18}/></button>
        </div>
        {error && <p className="text-red-500 text-sm mb-3 bg-red-50 p-3 rounded-lg">{error}</p>}
        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold mb-2">Nom de l'arbre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex: Développement Web"
              autoFocus
              className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full bg-black text-white p-3 rounded-lg font-bold hover:bg-slate-800 transition disabled:opacity-40"
          >
            {loading ? 'Création…' : 'Créer l\'arbre'}
          </button>
        </form>
      </div>
    </div>
  );
}

function ShareModal({ tree, onClose }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shared, setShared] = useState([]);
  const [copied, setCopied] = useState(false);

  const shareUrl = `${window.location.origin}?tree=${tree.id}`;

  useEffect(() => { loadShared(); }, []);

  const loadShared = async () => {
    const { data } = await supabase
      .from('tree_shares')
      .select('id, shared_with_email, can_edit')
      .eq('tree_id', tree.id);
    if (data) setShared(data);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    const { error } = await supabase
      .from('tree_shares')
      .insert({ tree_id: tree.id, shared_with_email: email.trim().toLowerCase(), can_edit: false });
    if (error) {
      setError(error.code === '23505' ? 'Cet utilisateur a déjà accès.' : error.message);
    } else {
      setSuccess(`Accès accordé à ${email.trim()}`);
      setEmail('');
      loadShared();
    }
    setLoading(false);
  };

  const handleRevoke = async (shareId) => {
    await supabase.from('tree_shares').delete().eq('id', shareId);
    loadShared();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-black text-xl">Partager "{tree.name}"</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={18}/></button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Lien de partage</label>
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 font-mono"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5 text-sm font-bold"
            >
              {copied ? <><Check size={14} className="text-green-500"/> Copié</> : <><Copy size={14}/> Copier</>}
            </button>
          </div>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Inviter par email</label>
          {error && <p className="text-red-500 text-xs mb-2 bg-red-50 p-2 rounded-lg">{error}</p>}
          {success && <p className="text-green-600 text-xs mb-2 bg-green-50 p-2 rounded-lg">{success}</p>}
          <form onSubmit={handleShare} className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.com"
              className="flex-1 p-2.5 text-sm border border-slate-200 rounded-lg outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
            />
            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="px-4 py-2 bg-black text-white rounded-lg font-bold text-sm hover:bg-slate-800 transition disabled:opacity-40"
            >
              {loading ? '…' : 'Inviter'}
            </button>
          </form>
        </div>

        {shared.length > 0 && (
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Accès partagés</label>
            <ul className="space-y-2">
              {shared.map(s => (
                <li key={s.id} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                  <span className="text-sm font-medium truncate">{s.shared_with_email}</span>
                  <button onClick={() => handleRevoke(s.id)} className="text-slate-400 hover:text-red-500 transition ml-2 flex-shrink-0">
                    <Trash2 size={14}/>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default function IndexView({ setView, setActiveTreeId, user }) {
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [shareTarget, setShareTarget] = useState(null);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('login');
  };

  useEffect(() => { loadTrees(); }, []);

  const loadTrees = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data } = await supabase
      .from('trees')
      .select('id, name, created_at, node_count')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setTrees(data);
    setLoading(false);
  };

  const handleCreated = (tree) => {
    setTrees([tree, ...trees]);
    setShowCreate(false);
  };

  const handleDelete = async (e, treeId) => {
    e.stopPropagation();
    if (!confirm('Supprimer cet arbre ?')) return;
    await supabase.from('trees').delete().eq('id', treeId);
    setTrees(trees.filter(t => t.id !== treeId));
  };

  return (
    <div className="h-full w-full bg-slate-50 flex flex-col">
      <TopBar title="SkillTree" onLogout={handleLogout} user={user} />

      <main className="flex-1 p-8 max-w-6xl mx-auto w-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black">Mes Arbres</h2>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition shadow-md"
          >
            <Plus size={18}/> Créer un arbre
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-7 h-7 border-4 border-black border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : trees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
              <FolderTree size={28} className="text-slate-400"/>
            </div>
            <p className="font-bold text-slate-600 mb-1">Aucun arbre pour l'instant</p>
            <p className="text-sm text-slate-400">Crée ton premier arbre de compétences</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trees.map(tree => (
              <div
                key={tree.id}
                onClick={() => { setActiveTreeId(tree.id); setView('tree'); }}
                className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-black transition cursor-pointer group relative"
              >
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-black group-hover:text-white transition">
                  <FolderTree size={24}/>
                </div>
                <h3 className="font-bold text-xl mb-1 pr-8">{tree.name}</h3>
                <p className="text-slate-400 text-sm">{tree.node_count ?? 0} compétences</p>
                <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShareTarget(tree); }}
                    className="p-2 hover:bg-slate-100 rounded-lg transition"
                    title="Partager"
                  >
                    <Share2 size={15} className="text-slate-500"/>
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, tree.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition"
                    title="Supprimer"
                  >
                    <Trash2 size={15} className="text-red-400"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateTreeModal onClose={() => setShowCreate(false)} onCreated={handleCreated}/>}
      {shareTarget && <ShareModal tree={shareTarget} onClose={() => setShareTarget(null)}/>}
    </div>
  );
}