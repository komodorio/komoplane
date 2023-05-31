/*
import React, {useCallback, useEffect, useMemo} from "react";
import ReactFlow, {
    addEdge,
    Connection,
    ConnectionLineType,
    Edge,
    Node,
    useEdgesState,
    useNodesState,
    useReactFlow,
} from "reactflow";

import {useLayoutedElements} from "./useLayoutedElements";
import {CustomDefaultNode, CustomGroupNode, CustomInputNode, CustomOutputNode,} from "./diagramComponents/Node";
import {CustomSmoothStepEdge} from "./diagramComponents/ConnectionLine";
import {CustomControls} from "./diagramComponents/Controls";
import {ResourcesMapNode} from "./useGetResourcesMap";

//
//FIXME: use https://reactflow.dev/docs/examples/layout/dagre/ and https://stackoverflow.com/questions/63734566/react-flow-chart-automatic-layout
//

export type ResourceDataType = ResourcesMapNode & {
    onClick?: () => void;
    childs?: Node<ResourceDataType>[];
};
const initViewport = {x: 0, y: 0, zoom: 0.5};

interface ResourcesDiagaramProps {
    initialNodes: Node<ResourceDataType>[];
    initialEdges: Edge[];
}

const ResourcesDiagaram: React.FC<ResourcesDiagaramProps> = ({
                                                                 initialNodes,
                                                                 initialEdges,
                                                             }) => {
    const {nodes: layoutedNodes, edges: layoutedEdges} = useLayoutedElements(
        initialNodes,
        initialEdges
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

    const {setViewport} = useReactFlow();

    const nodeTypes = useMemo(
        () => ({
            customDefault: CustomDefaultNode,
            customInput: CustomInputNode,
            customOutput: CustomOutputNode,
            customGroup: CustomGroupNode,
        }),
        []
    );

    const edgeTypes = useMemo(
        () => ({
            customSmoothStep: CustomSmoothStepEdge,
        }),
        []
    );

    useEffect(() => {
        Array.from(
            document.getElementsByClassName(
                "react-flow__attribution"
            ) as HTMLCollectionOf<HTMLElement>
        )[0].style.display = "none";
    }, []);

    return (
        <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            connectionLineType={ConnectionLineType.SmoothStep}
            fitView
            panOnScroll
            onInit={() => setViewport(initViewport)}
            minZoom={0}
        >
            <CustomControls initViewport={initViewport}/>
        </ReactFlow>
    );
};

export default ResourcesDiagaram;
*/
