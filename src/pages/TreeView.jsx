import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Import de ton client Supabase
import NodeCard from '../components/nodes/NodeCard';
import NodeModal from '../components/nodes/Nodemodal';
import EditorPanel from '../components/EditorPanel';

export default function TreeView({ setView, treeId }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const workspaceRef = useRef(null);

  // 1. Charger les nœuds depuis Supabase au montage du composant
  useEffect(() => {
    if (treeId) {
      loadTreeNodes();
    }
  }, [treeId]);

  const loadTreeNodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('nodes') // Remplace par le nom exact de ta table de nœuds
      .select('*')
      .eq('tree_id', treeId);

    if (error) {
      console.error("Erreur lors du chargement des compétences :", error.message);
    } else if (data) {
      // Adapter le format si depends_on ou position diffèrent en base de données
      const formattedNodes = data.map(node => ({
        ...node,
        dependsOn: node.depends_on || [], // mapping camelCase / snake_case
      }));
      setNodes(calculateUnlocks(formattedNodes));
    }
    setLoading(false);
  };
  
  // Fonction de calcul des verrous (inchangée)
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

  // 2. Sauvegarder le changement de statut (Validation de l'apprentissage)
  const markAsRead = async (nodeId) => {
    const updatedNodes = nodes.map(n => n.id === nodeId ? { ...n, status: 'completed' } : n);
    const calculated = calculateUnlocks(updatedNodes);
    
    setNodes(calculated);
    setSelectedNode(null);

    // Update dans Supabase
    const targetNode = calculated.find(n => n.id === nodeId);
    await supabase
      .from('nodes')
      .update({ status: 'completed' })
      .eq('id', nodeId);
      
    // Optionnel : Mettre à jour aussi le statut des nœuds enfants débloqués en BDD
  };

  // 3. Ajouter une nouvelle compétence sur Supabase
  const addNode = async () => {
    const tempId = `node-${Date.now()}`;
    const newNodeData = {
      id: tempId,
      tree_id: treeId,
      title: 'Nouveau',
      content: '',
      image: '',
      position: { x: 400, y: 200 },
      status: 'locked',
      depends_on: []
    };

    // Insertion BDD
    const { data, error } = await supabase
      .from('nodes')
      .insert(newNodeData)
      .select()
      .single();

    if (error) {
      console.error("Erreur lors de l'ajout du nœud :", error.message);
      return;
    }

    if (data) {
      const formatted = { ...data, dependsOn: data.depends_on || [] };
      setNodes(calculateUnlocks([...nodes, formatted]));
    }
  };

  // 4. Mettre à jour les données (Titre, contenu TipTap, dépendances)
  const updateNodeData = async (nodeId, field, value) => {
    // Changement local immédiat pour l'UI
    const mappedField = field === 'dependsOn' ? 'depends_on' : field;
    
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n);
    setNodes(calculateUnlocks(newNodes));
    
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, [field]: value });
    }

    // Sauvegarde en arrière-plan dans Supabase
    await supabase
      .from('nodes')
      .update({ [mappedField]: value })
      .eq('id', nodeId);
  };

  const handleMouseDown = (e, nodeId) => {
    if (!isEditMode) return;
    setDraggingNodeId(nodeId);
  };

  // 5. Sauvegarder la position finale après un Drag & Drop
  const handleMouseUp = async () => {
    if (draggingNodeId) {
      const finalNode = nodes.find(n => n.id === draggingNodeId);
      if (finalNode) {
        await supabase
          .from('nodes')
          .update({ position: finalNode.position })
          .eq('id', draggingNodeId);
      }
    }
    setDraggingNodeId(null);
  };

  const handleMouseMove = (e) => {
    if (!draggingNodeId || !workspaceRef.current) return;
    const rect = workspaceRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - 100; 
    const y = e.clientY - rect.top - 40;  
    setNodes(nodes.map(n => n.id === draggingNodeId ? { ...n, position: { x, y } } : n));
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

  return (
    <div className="h-full w-full bg-white flex overflow-hidden">
      
      {isEditMode && (
        <EditorPanel 
          setView={setView} 
          addNode={addNode} 
          setIsEditMode={setIsEditMode} 
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
        className={`flex-1 relative overflow-hidden bg-white ${isEditMode ? 'cursor-crosshair' : ''}`}
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