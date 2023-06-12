import {EdgeMarkerType} from "@reactflow/core/dist/esm/types/edges";
import {Edge, MarkerType, Node} from "reactflow";
import {NodeStatus} from "./CustomNodes.tsx";
import {K8sResource} from "../../types.ts";
import {logger} from "../../logger.ts";

export enum NodeTypes {
    Claim = "claim",
    Composition = "composition",
    CompositeResource = "composed",
    ManagedResource = "managed",
}

export class GraphData {
    private id = 0;
    public nodes: Node[] = []
    public edges: Edge[] = []

    public addNode(ntype: NodeTypes, res: K8sResource, isMain?: boolean, onClick?: () => void): Node {
        const status = this.getStatus(res)
        const node = {
            id: (++this.id).toString(),
            type: ntype,
            data: {
                label: res.metadata.name,
                status: status[0],
                statusMsg: status[1],
                main: isMain,
                onClick: onClick,
            },
            position: {x: 0, y: 0},
        };
        this.nodes.push(node)
        return node
    }

    addEdge(src: Node, tgt: Node): void {
        const edge: Edge = {
            id: (++this.id).toString(),
            source: src.id,
            target: tgt.id,
        };

        const marker: EdgeMarkerType = {type: MarkerType.ArrowClosed, width: 20, height: 20}

        switch (src.data.status) {
            case NodeStatus.NotFound:
                edge.style = {stroke: 'maroon'}
                marker.color = "maroon"
                break
            case NodeStatus.NotReady:
                edge.style = {stroke: 'red'}
                marker.color = "red"
                break
            case NodeStatus.Unhealthy:
                edge.style = {stroke: 'red'}
                marker.color = "red"
                break
            case NodeStatus.NotSynced:
                edge.style = {stroke: 'orange'}
                marker.color = "orange"
                break
            default:
                break;
        }

        edge.markerStart = marker

        this.edges.push(edge)
    }

    private getStatus(res: K8sResource): [NodeStatus, string] {
        logger.log("get status from", res)
        const problems: { [key: string]: string } = {}

        res.status?.conditions?.forEach((element) => {
            if (element.status != "True") {
                problems[element.type] = element.reason
            }
        });

        if (problems["Found"]) {
            return [NodeStatus.NotFound, problems["Found"]]
        } else if (problems["Healthy"]) {
            return [NodeStatus.Unhealthy, problems["Healthy"]]
        } else if (problems["Synced"]) {
            return [NodeStatus.NotSynced, problems["Synced"]]
        } else if (problems["Ready"]) {
            return [NodeStatus.NotReady, problems["Ready"]]
        }

        return [NodeStatus.Ok, ""]
    }
}