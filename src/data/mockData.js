export const mockTrees = [
  { id: '1', name: 'Développement Web Front-End', nodesCount: 12 },
  { id: '2', name: 'Design Graphique & UI', nodesCount: 8 },
];

export const initialNodes = [
  {
    id: 'node-1',
    title: 'Les Bases',
    content: 'Début de l\'arbre.',
    image: '',
    position: { x: 300, y: 100 },
    status: 'unlocked',
    dependsOn: []
  },
  {
    id: 'node-2',
    title: 'Compétence Avancée',
    content: 'Suite logique.',
    image: '',
    position: { x: 300, y: 300 },
    status: 'locked',
    dependsOn: ['node-1']
  }
];