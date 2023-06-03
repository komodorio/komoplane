import {useCallback} from 'react';
import ReactFlow, {
    addEdge,
    ConnectionLineType,
    Edge,
    Node,
    Panel,
    Position,
    useEdgesState,
    useNodesState
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {IconButton} from "@mui/material";
import {EastTwoTone as LRIcon, SouthTwoTone as TBIcon} from '@mui/icons-material';

const initialNodes = [
    {id: '1', position: {x: 0, y: 0}, data: {label: '1'}},
    {id: '2', position: {x: 0, y: 100}, data: {label: '2'}},
];
const initialEdges = [{id: 'e1-2', source: '1', target: '2'}];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR';
    dagreGraph.setGraph({rankdir: direction});

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, {width: nodeWidth, height: nodeHeight});
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = isHorizontal ? Position.Left : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Right : Position.Bottom;

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return {nodes, edges};
};

const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
    initialNodes,
    initialEdges
);

const RelationsGraph = () => {
    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    const onConnect = useCallback(
        (params) =>
            setEdges((eds) =>
                addEdge({...params, type: ConnectionLineType.SmoothStep, animated: true}, eds)
            ),
        []
    );
    const onLayout = useCallback(
        (direction: string) => {
            const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
                nodes,
                edges,
                direction
            );

            setNodes([...layoutedNodes]);
            setEdges([...layoutedEdges]);
        },
        [nodes, edges]
    );

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
        >
            <Panel position="top-right">
                <IconButton onClick={() => onLayout('TB')}><TBIcon/></IconButton>
                <IconButton onClick={() => onLayout('LR')}><LRIcon/></IconButton>
            </Panel>
        </ReactFlow>
    );
};

export default RelationsGraph;