import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Grid, Map as MapIcon, Star } from 'lucide-react';
import NodeCard from '../components/nodes/NodeCard';
import NodeModal from '../components/nodes/Nodemodal';
import EditorPanel from '../components/EditorPanel';

export default function TreeView({ setView, treeId }) {
  const [nodes, setNodes] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
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
        pages: node.pages || [{ id: 'page-1', content: node.content || '', validation: { type: 'read' } }],
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
      
      // Calcul du niveau (ex: Palier de 100 XP par niveau)
      const threshold = currentLevel * 100;
      let newLevel = currentLevel;
      
      if (newXpTotal >= threshold) {
        newLevel = currentLevel + 1;
        // Optionnel : tu pourrais déclencher une animation de Level Up ici !
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
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-white px-6 py-3 rounded-2xl shadow-xl border border-slate-200 flex items-center gap-4 min-w-[300px]">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
            <Star className="text-indigo-500" size={24} fill="currentColor" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between w-full text-xs font-black mb-1.5 uppercase tracking-wide">
              <span className="text-indigo-600">Niveau {treeData.level || 1}</span>
              <span className="text-slate-400">{treeData.current_xp || 0} / {(treeData.level || 1) * 100} XP</span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(100, ((treeData.current_xp || 0) / ((treeData.level || 1) * 100)) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-30 flex gap-2">
        {!isEditMode && (
          <button onClick={() => setIsEditMode(true)} className="bg-black text-white px-5 py-2.5 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition flex items-center gap-2">
            Ouvrir l'éditeur
          </button>
        )}
      </div>

      <div className="absolute bottom-6 right-6 z-30 bg-white p-2 rounded-xl shadow-xl border border-slate-200 flex items-center justify-center cursor-help" title="Utilise la molette pour zoomer, clique et glisse dans le vide pour te déplacer.">
        <MapIcon size={24} className="text-slate-400" />
      </div>

      <TransformWrapper
        initialScale={1} minScale={0.1} maxScale={4} centerOnInit={true}
        disabled={draggingNodeId !== null} panning={{ velocityDisabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform, state }) => (
          <div className="flex-1 relative w-full h-full overflow-hidden" style={workspaceStyle}>
            <div className="absolute bottom-6 left-6 z-30 flex bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden font-bold">
              <button onClick={() => zoomOut()} className="px-3 py-2 hover:bg-slate-100 border-r border-slate-200">-</button>
              <button onClick={() => resetTransform()} className="px-3 py-2 hover:bg-slate-100 text-sm text-slate-500">{Math.round(state.scale * 100)}%</button>
              <button onClick={() => zoomIn()} className="px-3 py-2 hover:bg-slate-100 border-l border-slate-200">+</button>
            </div>

            <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
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