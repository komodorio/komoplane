import ReactFlow, {
    Background,
    ConnectionLineType,
    Controls,
    Edge,
    Node,
    Position,
    useEdgesState,
    useNodesState
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {useMemo} from "react";
import {ClaimNode, MRNode, XRNode, CompositionNode} from "./CustomNodes.tsx"


const dagreGraph = new dagre.graphlib.Graph({directed: true});
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 300;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const isHorizontal = direction === 'LR' || direction === "RL";
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
        node.targetPosition = isHorizontal ? Position.Right : Position.Top;
        node.sourcePosition = isHorizontal ? Position.Left : Position.Bottom;

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


type GraphProps = {
    nodes: Node[];
    edges: Edge[];
};

const RelationsGraph = ({nodes: initialNodes, edges: initialEdges}: GraphProps) => {
    const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
        initialNodes,
        initialEdges,
        "RL"
    );

    const [nodes, , onNodesChange] = useNodesState(layoutedNodes);
    const [edges, , onEdgesChange] = useEdgesState(layoutedEdges);

    const nodeTypes = useMemo(() => ({
        claim: ClaimNode,
        composed: XRNode,
        managed: MRNode,
        composition: CompositionNode,
    }), []);

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            connectionLineType={ConnectionLineType.SmoothStep}
            nodesConnectable={false}
            fitView
        >
            <Background color="white"/>
            <Controls showInteractive={false} showZoom={false} position={"top-right"}/>
        </ReactFlow>
    );
};

export default RelationsGraph;