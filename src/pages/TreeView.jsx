import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import NodeCard from '../components/nodes/NodeCard';
import NodeModal from '../components/nodes/Nodemodal';
import EditorPanel from '../components/EditorPanel';

export default function TreeView({ setView, treeId }) {
  const [nodes, setNodes] = useState([]);
  const [treeData, setTreeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const workspaceRef = useRef(null);
  
  useEffect(() => {
    if (treeId) {
      loadTreeDetails();
      loadTreeNodes();
    }
  }, [treeId]);

  // Charger les infos globales de l'arbre (Nom, fond)
  const loadTreeDetails = async () => {
    const { data } = await supabase
      .from('trees')
      .select('*')
      .eq('id', treeId)
      .single();
    if (data) setTreeData(data);
  };

  // Charger les compétences
  const loadTreeNodes = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('nodes')
      .select('*')
      .eq('tree_id', treeId);

    if (data) {
      const formattedNodes = data.map(node => ({
        ...node,
        dependsOn: node.depends_on || [],
        lockedTitle: node.locked_title || '', 
      }));
      setNodes(calculateUnlocks(formattedNodes));
    }
    setLoading(false);
  };
  
  const calculateUnlocks = (currentNodes) => {
    return currentNodes.map(node => {
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

  // Mettre à jour les données globales de l'arbre (Nom et fond)
  const updateTreeData = async (field, value) => {
    setTreeData(prev => ({ ...prev, [field]: value }));
    await supabase
      .from('trees')
      .update({ [field]: value })
      .eq('id', treeId);
  };

  const markAsRead = async (nodeId) => {
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, status: 'completed' } : n);
    setNodes(calculateUnlocks(newNodes));
    setSelectedNode(null);
    await supabase.from('nodes').update({ status: 'completed' }).eq('id', nodeId);
  };

  const addNode = async () => {
    const newNodeData = {
      id: `node-${Date.now()}`,
      tree_id: treeId,
      title: 'Nouveau',
      content: '',
      image: '',
      position: { x: 400, y: 200 },
      status: 'locked',
      depends_on: [],
      locked_title: ''
    };

    const { data } = await supabase.from('nodes').insert(newNodeData).select().single();
    if (data) {
      const formatted = { ...data, dependsOn: data.depends_on || [], lockedTitle: data.locked_title || '' };
      setNodes(calculateUnlocks([...nodes, formatted]));
    }
  };

  const updateNodeData = async (nodeId, field, value) => {
    let mappedField = field;
    if (field === 'dependsOn') mappedField = 'depends_on';
    if (field === 'lockedTitle') mappedField = 'locked_title';

    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n);
    setNodes(calculateUnlocks(newNodes));
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, [field]: value });
    }

    await supabase.from('nodes').update({ [mappedField]: value }).eq('id', nodeId);
  };

  const handleMouseDown = (e, nodeId) => {
    if (!isEditMode) return;
    setDraggingNodeId(nodeId);
  };

  const handleMouseMove = (e) => {
    if (!draggingNodeId || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 100; 
    const y = e.clientY - rect.top - 40;  
    setNodes(nodes.map(n => n.id === draggingNodeId ? { ...n, position: { x, y } } : n));
  };

  const handleMouseUp = async () => {
    if (draggingNodeId) {
      const node = nodes.find(n => n.id === draggingNodeId);
      if (node) {
        await supabase.from('nodes').update({ position: node.position }).eq('id', draggingNodeId);
      }
    }
    setDraggingNodeId(null);
  };

  const renderConnections = () => {
    const lines = [];
    nodes.forEach(node => {
      node.dependsOn.forEach(depId => {
        const parentNode = nodes.find(n => n.id === depId);
        if (parentNode) {
          const startX = parentNode.position.x + 100;
          const startY = parentNode.position.y + 80;
          const endX = node.position.x + 100;
          const endY = node.position.y;
          const isUnlocked = node.status !== 'locked';
          lines.push(
            <path
              key={`${depId}-${node.id}`}
              d={`M ${startX} ${startY} C ${startX} ${startY + 50}, ${endX} ${endY - 50}, ${endX} ${endY}`}
              fill="none"
              stroke={isUnlocked ? "#000000" : "#cbd5e1"}
              strokeWidth="3"
              strokeDasharray={isUnlocked ? "0" : "5,5"}
            />
          );
        }
      });
    });
    return lines;
  };

  if (loading) {
    return (
      <div className="h-screen w-full bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  // Définir le style d'arrière plan dynamiquement
  const workspaceStyle = treeData?.background_type === 'image'
    ? { backgroundImage: `url(${treeData.background_value})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : { backgroundColor: treeData?.background_value || '#ffffff' };

  return (
    <div className="h-full w-full bg-white flex overflow-hidden">
      
      {isEditMode && (
        <EditorPanel 
          setView={setView} 
          addNode={addNode} 
          setIsEditMode={setIsEditMode}
          treeData={treeData}
          updateTreeData={updateTreeData}
        />
      )}

      {!isEditMode && (
        <button 
          onClick={() => setIsEditMode(true)}
          className="absolute top-6 left-6 z-30 bg-black text-white px-4 py-2 rounded-lg font-bold shadow-lg hover:bg-slate-800 transition"
        >
          Ouvrir l'éditeur
        </button>
      )}

      <main 
        className={`flex-1 relative overflow-hidden ${isEditMode ? 'cursor-crosshair' : ''}`}
        style={workspaceStyle}
        ref={workspaceRef}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {renderConnections()}
        </svg>

        {nodes.map(node => (
          <NodeCard
            key={node.id}
            node={node}
            isEditMode={isEditMode}
            onMouseDown={handleMouseDown}
            onClick={() => setSelectedNode(node)}
          />
        ))}
      </main>

      <NodeModal
        selectedNode={selectedNode}
        isEditMode={isEditMode}
        nodes={nodes}
        updateNodeData={updateNodeData}
        markAsRead={markAsRead}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  );
}