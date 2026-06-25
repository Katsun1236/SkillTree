import React, { useState, useRef } from 'react';
import { Lock, Unlock, CheckCircle, ArrowLeft, Plus, Palette, Move, Type, X, Image as ImageIcon, Bold, Italic, Settings } from 'lucide-react';

export default function TreeView({ setView, treeId }) {
  const [nodes, setNodes] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isEditMode, setIsEditMode] = useState(true);
  const [draggingNodeId, setDraggingNodeId] = useState(null);
  const workspaceRef = useRef(null);
  
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

  const markAsRead = (nodeId) => {
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, status: 'completed' } : n);
    setNodes(calculateUnlocks(newNodes));
    setSelectedNode(null);
  };

  const addNode = () => {
    const newNode = {
      id: `node-${Date.now()}`,
      title: 'Nouveau',
      content: '',
      image: '',
      position: { x: 400, y: 200 },
      status: 'locked',
      dependsOn: []
    };
    setNodes(calculateUnlocks([...nodes, newNode]));
  };

  const updateNodeData = (nodeId, field, value) => {
    const newNodes = nodes.map(n => n.id === nodeId ? { ...n, [field]: value } : n);
    setNodes(calculateUnlocks(newNodes));
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode({ ...selectedNode, [field]: value });
    }
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

  const handleMouseUp = () => {
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
            onClick={() => {
              if (!isEditMode && node.status !== 'locked') setSelectedNode(node);
              else if (isEditMode) setSelectedNode(node);
            }}
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