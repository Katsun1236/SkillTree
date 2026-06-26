import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Grid, Map as MapIcon, Star, Settings, Plus, Trash2, X } from 'lucide-react';
import NodeCard from '../components/nodes/NodeCard';
import NodeModal from '../components/nodes/Nodemodal';
import EditorPanel from '../components/EditorPanel';

function XpConfigModal({ treeData, updateTreeData, onClose }) {
  const defaultLevels = Array.from({ length: 10 }, (_, i) => ({
    name: `Niveau ${i + 1}`,
    threshold: (i + 1) * 100,
  }));
  const [levels, setLevels] = useState(treeData.xp_levels || defaultLevels);

  const handleSave = async () => {
    await updateTreeData('xp_levels', levels);
    onClose();
  };

  const updateLevel = (i, field, value) => {
    const updated = [...levels];
    updated[i] = { ...updated[i], [field]: field === 'threshold' ? parseInt(value) || 0 : value };
    setLevels(updated);
  };

  const addLevel = () => setLevels([...levels, { name: `Niveau ${levels.length + 1}`, threshold: (levels.length + 1) * 100 }]);
  const removeLevel = (i) => setLevels(levels.filter((_, idx) => idx !== i));

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="font-black text-xl flex items-center gap-2"><Settings size={20} /> Configuration des niveaux XP</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {levels.map((lvl, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${i === (treeData.level || 1) - 1 ? 'border-indigo-300 bg-indigo-50' : 'border-slate-200 bg-slate-50'}`}>
              <span className="text-xs font-black text-slate-400 w-5 text-center">{i + 1}</span>
              <input
                type="text"
                value={lvl.name}
                onChange={(e) => updateLevel(i, 'name', e.target.value)}
                placeholder={`Niveau ${i + 1}`}
                className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400"
              />
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={lvl.threshold}
                  onChange={(e) => updateLevel(i, 'threshold', e.target.value)}
                  className="w-24 p-2 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:border-indigo-400 text-center"
                />
                <span className="text-xs font-bold text-slate-400">XP</span>
              </div>
              <button onClick={() => removeLevel(i)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 size={14} /></button>
            </div>
          ))}
          <button onClick={addLevel} className="w-full p-2.5 border-2 border-dashed border-slate-200 rounded-xl text-sm font-bold text-slate-400 hover:border-indigo-300 hover:text-indigo-500 transition flex items-center justify-center gap-2">
            <Plus size={16} /> Ajouter un niveau
          </button>
        </div>
        <div className="p-6 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 p-3 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold transition">Annuler</button>
          <button onClick={handleSave} className="flex-1 p-3 bg-black text-white hover:bg-slate-800 rounded-xl font-bold transition">Sauvegarder</button>
        </div>
      </div>
    </div>
  );
}

export default function TreeView({ setView, treeId }) {
  const [nodes, setNodes] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const workspaceRef = useRef(null);
  
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const [showXpConfig, setShowXpConfig] = useState(false);
  const GRID_SIZE = 40;

  useEffect(() => {
    if (treeId) {
      loadTreeDetails();
      loadTreeNodes();
    }
  }, [treeId]);

  const loadTreeDetails = async () => {
    const { data } = await supabase.from('trees').select('*').eq('id', treeId).single();
    if (data) setTreeData(data);
  };

  const loadTreeNodes = async () => {
    setLoading(true);
    const { data } = await supabase.from('nodes').select('*').eq('tree_id', treeId);
    if (data) {
      const formattedNodes = data.map(node => ({
        ...node,
        dependsOn: node.depends_on || [],
        exclusiveWith: node.exclusive_with || [],
        attachments: node.attachments || [],
        lockedTitle: node.locked_title || '',
        bgColor: node.bg_color || '#ffffff',
        textColor: node.text_color || '#000000',
        emoji: node.emoji || '🌟',
        subtitle: node.subtitle || '',
        pages: (node.pages || [{ id: 'page-1', content: node.content || '', validation: { type: 'read' } }]).map(p => ({
          ...p,
          validation: p.validation ?? { type: 'read' }
        })),
        xpReward: node.xp_reward ?? 50 // 50 XP par défaut
      }));
      setNodes(calculateUnlocks(formattedNodes));
    }
    setLoading(false);
  };
  
  const calculateUnlocks = (currentNodes) => {
    // 1. On liste tous les IDs qui doivent être bannis par les compétences déjà complétées
    const blockedIds = new Set();
    currentNodes.forEach(node => {
      if (node.status === 'completed' && node.exclusiveWith?.length > 0) {
        node.exclusiveWith.forEach(id => blockedIds.add(id));
      }
    });

    // 2. On applique les règles de base + le nouveau statut 'blocked'
    return currentNodes.map(node => {
      // Si la carte est dans la liste des bannis, elle est bloquée définitivement
      if (blockedIds.has(node.id)) {
        return { ...node, status: 'blocked' };
      }

      if (node.status === 'completed' || (node.dependsOn.length === 0 && node.status !== 'completed')) {
        return { ...node, status: node.status === 'completed' ? 'completed' : 'unlocked' };
      }
      const allDependenciesMet = node.dependsOn.every(depId => {
        const depNode = currentNodes.find(n => n.id === depId);
        return depNode && depNode.status === 'completed';
      });
      if (allDependenciesMet && node.status === 'locked') return { ...node, status: 'unlocked' };
      if (!allDependenciesMet && node.status === 'unlocked') return { ...node, status: 'locked' };
      return node;
    });
  };

  const updateTreeData = async (field, value) => {
    setTreeData(prev => ({ ...prev, [field]: value }));
    await supabase.from('trees').update({ [field]: value }).eq('id', treeId);
  };

  // --- SYSTÈME D'XP ---
  const markAsRead = async (nodeId) => {
    const completedNode = nodes.find(n => n.id === nodeId);
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, status: 'completed' } : n);
    setNodes(calculateUnlocks(newNodes));
    setSelectedNode(null);
    
    // Mise à jour de la carte en BDD
    await supabase.from('nodes').update({ status: 'completed' }).eq('id', nodeId);

    // Ajout de l'XP à l'arbre
    const xpGained = completedNode.xpReward || 0;
    if (xpGained > 0 && treeData) {
      const currentXp = treeData.current_xp || 0;
      const currentLevel = treeData.level || 1;
      const newXpTotal = currentXp + xpGained;
      const levels = treeData.xp_levels;
      let newLevel = currentLevel;

      if (levels && levels.length > 0) {
        const currentLevelData = levels[currentLevel - 1];
        const threshold = currentLevelData?.threshold ?? currentLevel * 100;
        if (newXpTotal >= threshold && currentLevel < levels.length) newLevel = currentLevel + 1;
      } else {
        const threshold = currentLevel * 100;
        if (newXpTotal >= threshold) newLevel = currentLevel + 1;
      }

      setTreeData(prev => ({ ...prev, current_xp: newXpTotal, level: newLevel }));
      await supabase.from('trees').update({ current_xp: newXpTotal, level: newLevel }).eq('id', treeId);
    }
  };

  const addNode = async () => {
    const newNodeData = {
      id: `node-${Date.now()}`, tree_id: treeId, title: 'Nouveau',
      position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 },
      status: 'locked', depends_on: [], locked_title: '', emoji: '🌟', subtitle: '',
      bg_color: '#ffffff', text_color: '#000000',
      pages: [{ id: `page-${Date.now()}`, content: '', validation: { type: 'read' } }],
      attachments: [], exclusive_with: [], xp_reward: 50
    };

    const { data } = await supabase.from('nodes').insert(newNodeData).select().single();
    if (data) {
      const formatted = { 
        ...data, dependsOn: data.depends_on || [], lockedTitle: data.locked_title || '',
        bgColor: data.bg_color || '#ffffff', textColor: data.text_color || '#000000',
        emoji: data.emoji || '🌟', subtitle: data.subtitle || '', pages: data.pages,
        attachments: data.attachments || [], exclusiveWith: data.exclusive_with || [], xpReward: data.xp_reward || 50
      };
      setNodes(calculateUnlocks([...nodes, formatted]));
    }
  };

  const updateNodeData = async (nodeId, field, value) => {
    let mappedField = field;
    if (field === 'dependsOn') mappedField = 'depends_on';
    if (field === 'lockedTitle') mappedField = 'locked_title';
    if (field === 'bgColor') mappedField = 'bg_color';
    if (field === 'textColor') mappedField = 'text_color';
    if (field === 'exclusiveWith') mappedField = 'exclusive_with';
    if (field === 'xpReward') mappedField = 'xp_reward';

    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n);
    setNodes(calculateUnlocks(newNodes));
    if (selectedNode && selectedNode.id === nodeId) setSelectedNode({ ...selectedNode, [field]: value });
    await supabase.from('nodes').update({ [mappedField]: value }).eq('id', nodeId);
  };

  const handleMouseDown = (e, nodeId) => {
    if (!isEditMode) return;
    e.stopPropagation(); 
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e, scale) => {
    if (!draggingNodeId) return;
    const movementX = e.movementX / scale;
    const movementY = e.movementY / scale;

    setNodes(prevNodes => prevNodes.map(n => {
      if (n.id === draggingNodeId) {
        let newX = n.position.x + movementX;
        let newY = n.position.y + movementY;
        if (snapToGrid) {
          newX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
          newY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
        }
        return { ...n, position: { x: newX, y: newY } };
      }
      return n;
    }));
  };

  const handleMouseUp = async () => {
    if (draggingNodeId) {
      const node = nodes.find(n => n.id === draggingNodeId);
      if (node) await supabase.from('nodes').update({ position: node.position }).eq('id', draggingNodeId);
    }
    setDraggingNodeId(null);
  };

  const renderConnections = () => {
    const lines = [];
    nodes.forEach(node => {
      node.dependsOn.forEach(depId => {
        const parentNode = nodes.find(n => n.id === depId);
        if (parentNode) {
          const startX = parentNode.position.x + 120; 
          const startY = parentNode.position.y + 80;
          const endX = node.position.x + 120;
          const endY = node.position.y;
          const isUnlocked = node.status !== 'locked';
          lines.push(
            <path
              key={`${depId}-${node.id}`}
              d={`M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`}
              fill="none" stroke={isUnlocked ? "#000000" : "#cbd5e1"} strokeWidth="3"
              strokeDasharray={isUnlocked ? "0" : "5,5"}
            />
          );
        }
      });
    });
    return lines;
  };

  if (loading) return <div className="h-screen w-full bg-white flex items-center justify-center"><div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"/></div>;

  const workspaceStyle = treeData?.background_type === 'image'
    ? { backgroundImage: `url(${treeData.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: treeData?.background_value || '#ffffff' };

  return (
    <div className="h-full w-full flex overflow-hidden bg-slate-50 relative">
      
      {isEditMode && (
        <EditorPanel setView={setView} addNode={addNode} setIsEditMode={setIsEditMode} treeData={treeData} updateTreeData={updateTreeData}>
          <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Outils Canvas</h3>
            <button 
              onClick={() => setSnapToGrid(!snapToGrid)}
              className={`w-full p-2 rounded-lg font-bold flex items-center justify-center gap-2 transition ${snapToGrid ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white border-slate-200 text-slate-600'} border`}
            >
              <Grid size={18} /> Magnétisme : {snapToGrid ? 'ON' : 'OFF'}
            </button>
          </div>
        </EditorPanel>
      )}

      {/* Barre d'XP Flottante (Affichée en mode lecture) */}
      {!isEditMode && treeData && (
        <>
          <div
            className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-4 min-w-[300px] cursor-pointer hover:border-indigo-300 transition group"
            onClick={() => setShowXpConfig(true)}
            title="Cliquer pour configurer les niveaux XP"
          >
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Star className="text-indigo-500" size={24} fill="currentColor" />
            </div>
            <div className="flex-1">
              <div className="flex justify-between w-full text-xs font-black mb-1.5 uppercase tracking-wide">
                <span className="text-indigo-600">{(treeData.xp_levels && treeData.xp_levels[(treeData.level || 1) - 1]?.name) || `Niveau ${treeData.level || 1}`}</span>
                <span className="text-slate-400">{treeData.current_xp || 0} / {(treeData.xp_levels && treeData.xp_levels[(treeData.level || 1) - 1]?.threshold) || ((treeData.level || 1) * 100)} XP</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, ((treeData.current_xp || 0) / ((treeData.xp_levels && treeData.xp_levels[(treeData.level || 1) - 1]?.threshold) || ((treeData.level || 1) * 100))) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {showXpConfig && (
            <XpConfigModal
              treeData={treeData}
              updateTreeData={updateTreeData}
              onClose={() => setShowXpConfig(false)}
            />
          )}
        </>
      )}

      <div className="absolute top-6 left-6 z-30 flex gap-2">
        {!isEditMode && (
          <button onClick={() => setIsEditMode(true)} className="bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition flex items-center gap-2">
            Ouvrir l'éditeur
          </button>
        )}
      </div>

      <TransformWrapper
        initialScale={1} minScale={0.1} maxScale={4} centerOnInit={true}
        disabled={draggingNodeId !== null} panning={{ velocityDisabled: true }}
        wheel={{ step: 0.05 }}
      >
        {({ zoomIn, zoomOut, resetTransform, state }) => (
          <div className="flex-1 relative w-full h-full overflow-hidden" style={workspaceStyle}>
            <div className="absolute bottom-6 left-6 z-30 flex bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden font-bold">
              <button onClick={() => zoomOut()} className="px-3 py-2 hover:bg-slate-100 border-r border-slate-200">-</button>
              <button onClick={() => resetTransform()} className="px-3 py-2 hover:bg-slate-100 text-sm text-slate-500">{Math.round(state.scale * 100)}%</button>
              <button onClick={() => zoomIn()} className="px-3 py-2 hover:bg-slate-100 border-l border-slate-200">+</button>
            </div>

            <div className="absolute bottom-6 right-6 z-30 bg-white p-2.5 rounded-xl shadow-xl border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100 transition" title="Recentrer la vue" onClick={() => resetTransform()}>
              <MapIcon size={24} className="text-slate-500" />
            </div>

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%", overflow: "hidden" }} contentStyle={{ width: "100%", height: "100%" }}>
              <main 
                className={`w-[5000px] h-[5000px] relative transition-colors ${isEditMode && !draggingNodeId ? 'cursor-grab active:cursor-grabbing' : ''} ${draggingNodeId ? 'cursor-crosshair' : ''}`}
                ref={workspaceRef} onMouseMove={(e) => handleMouseMove(e, state.scale)} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
              >
                {snapToGrid && isEditMode && (
                  <div className="absolute inset-0 opacity-20 pointer-events-none" 
                       style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px` }} />
                )}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">{renderConnections()}</svg>
                {nodes.map(node => (
                  <NodeCard key={node.id} node={node} isEditMode={isEditMode} onMouseDown={(e) => handleMouseDown(e, node.id)} onClick={() => setSelectedNode(node)} />
                ))}
              </main>
            </TransformComponent>
          </div>
        )}
      </TransformWrapper>

      <NodeModal selectedNode={selectedNode} isEditMode={isEditMode} nodes={nodes} updateNodeData={updateNodeData} markAsRead={markAsRead} onClose={() => setSelectedNode(null)} />
    </div>
  );
}