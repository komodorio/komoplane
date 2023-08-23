import {Handle, NodeProps, Position} from 'reactflow';
import Box from "@mui/material/Box";
import {Typography} from "@mui/material";
import {
    HeartBroken as IconUnhealthy,
    NotListedLocation as IconNotFound,
    ReportProblem as IconNotReady,
    SyncDisabled as IconNoSync,
} from "@mui/icons-material";
import {logger} from "../../logger.ts";

export enum NodeStatus {
    Ok = "Ok",
    NotSynced = "Not Synced",
    NotReady = "Not Ready",
    Unhealthy = "Unhealthy",
    NotFound = "Not Found",
}

function NodeStatusLine({data}: { data: { status: string, statusMsg: string } }) {
    let icon = (<></>)

    switch (data.status) {
        case NodeStatus.NotReady:
            icon = (<IconNotReady fontSize="small" color="error" titleAccess={data.statusMsg}/>)
            break
        case NodeStatus.Unhealthy:
            icon = (<IconUnhealthy fontSize="small" color="error" titleAccess={data.statusMsg}/>)
            break
        case NodeStatus.NotSynced:
            icon = (<IconNoSync fontSize="small" color="warning" titleAccess={data.statusMsg}/>)
            break
        case NodeStatus.NotFound:
            icon = (<IconNotFound fontSize="small" color="error" titleAccess={data.statusMsg}/>)
            break
        default:
            return (<></>)
    }

    return (
        <Typography color={icon.props.color} fontSize="small" className="pt-1">
            {icon} {data.status}
        </Typography>
    )
}

function CustomNode({data, sourcePosition, targetPosition}: NodeProps) {
    logger.log("Custom node render", data.onClick ? "pointer" : "grab")
    return (
        <Box className="border rounded border-gray-600" sx={{
            backgroundColor: data.bgcolor,
            maxWidth: 350,
            borderWidth: data.main ? 3 : null,
            cursor: data.onClick ? "pointer" : "grab"
        }}>
            <Box className="px-3 py-1 border-b border-gray-400 bg-gray-500 bg-opacity-20"
                 sx={{display: 'flex', justifyContent: 'space-between', flexDirection: 'row'}}>
                <Typography fontSize="x-small" className="uppercase text-xs">{data.type}</Typography>
                <Typography fontSize="x-small" className="text-xs" sx={{marginLeft: "0.5rem"}}
                            title={data.apiVersion}>{data.kind}</Typography>
            </Box>
            <Box className="px-3 py-1">
                <Typography variant="h6" sx={data.main ? {fontWeight: 'bold'} : {}}>
                    {data.compositionName ? data.compositionName : data.label}
                </Typography>
                <NodeStatusLine data={data}/>
            </Box>
            <Handle type="target" position={targetPosition ? targetPosition : Position.Top}/>
            <Handle type="source" position={sourcePosition ? sourcePosition : Position.Bottom}/>
        </Box>
    );
}

export function ClaimNode(data: NodeProps) {
    data.data.type = "Claim"
    data.data.bgcolor = "#B6E1FF"
    return CustomNode(data)
}

export function CompositionNode(data: NodeProps) {
    data.data.type = "Composition"
    data.data.bgcolor = "#B893F5"
    return CustomNode(data)
}

export function MRNode(data: NodeProps) {
    data.data.type = "Managed Resource"
    data.data.bgcolor = "#90F4CE"
    return CustomNode(data)
}

export function XRNode(data: NodeProps) {
    data.data.type = "Composite Resource"
    data.data.bgcolor = "#FFCE85"
    return CustomNode(data)
}

export function ProviderConfigNode(data: NodeProps) {
    data.data.type = "Provider Config"
    data.data.bgcolor = "#B6E1FF"
    return CustomNode(data)
}

