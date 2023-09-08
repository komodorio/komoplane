import ReactFlow, {
    Background, Connection,
    ConnectionLineType,
    Controls,
    Edge,
    addEdge,
    Node,
    Position,
    useEdgesState,
    useNodesState
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {BaseSyntheticEvent, useCallback, useEffect} from "react";
import {ClaimNode, CompositionNode, MRNode, ProviderConfigNode, XRNode} from "./CustomNodes.tsx"
import {logger} from "../../logger.ts";


const nodeWidth = 300;
const nodeHeight = 50;

const getLayoutedElements = (nodes: Node[], edges: Edge[], direction = 'TB') => {
    const dagreGraph = new dagre.graphlib.Graph({directed: true});
    dagreGraph.setDefaultEdgeLabel(() => ({}));

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

const nodeTypes = {
    claim: ClaimNode,
    composed: XRNode,
    managed: MRNode,
    composition: CompositionNode,
    provConfig: ProviderConfigNode,
};

const RelationsGraph = ({nodes: initialNodes, edges: initialEdges}: GraphProps) => {
    logger.log("Render initial", initialNodes)

    // FIXME: something wrong is happening here or in the calling code, not always layouted properly
    const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
        initialNodes,
        initialEdges,
        "RL"
    );

    const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

    useEffect(() => {
        setNodes([...layoutedNodes]);
        setEdges([...layoutedEdges]);
    }, [layoutedEdges, layoutedNodes, setEdges, setNodes]);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge(params, eds)),
        [setEdges]
    );

    const onNodeClick = (_: BaseSyntheticEvent, element: Node | Edge) => {
        if (element.data.onClick) {
            element.data.onClick()
        }
    }

    logger.log("Render")

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
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