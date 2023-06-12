import ReactFlow, {Background, ConnectionLineType, Controls, Edge, Node, Position} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import {BaseSyntheticEvent} from "react";
import {ClaimNode, CompositionNode, MRNode, XRNode} from "./CustomNodes.tsx"
import {logger} from "../../logger.ts";


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

const nodeTypes = {
    claim: ClaimNode,
    composed: XRNode,
    managed: MRNode,
    composition: CompositionNode,
};

const RelationsGraph = ({nodes: initialNodes, edges: initialEdges}: GraphProps) => {
    logger.log("Render initial", initialNodes)
    const {nodes: layoutedNodes, edges: layoutedEdges} = getLayoutedElements(
        initialNodes,
        initialEdges,
        "RL"
    );

    logger.log("Render layouted", layoutedNodes)

    const onNodeClick = (_: BaseSyntheticEvent, element: Node | Edge) => {
        if (element.data.onClick) {
            element.data.onClick()
        }
    }

    console.log("Render", layoutedNodes)

    return (
        <ReactFlow
            nodeTypes={nodeTypes}
            nodes={layoutedNodes}
            edges={layoutedEdges}
            connectionLineType={ConnectionLineType.SmoothStep}
            nodesConnectable={false}
            onNodeClick={onNodeClick}
            fitView
        >
            <Background color="white"/>
            <Controls showInteractive={false} showZoom={false} position={"top-right"}/>
        </ReactFlow>
    );
};

export default RelationsGraph;