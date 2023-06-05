import {Handle, NodeProps, Position} from 'reactflow';
import Box from "@mui/material/Box";
import {Typography} from "@mui/material";


function CustomNode({data, sourcePosition, targetPosition}: NodeProps) {
    return (
        <Box className="border rounded border-gray-500" sx={{backgroundColor: data.bgcolor}}>
            <Box className="px-3 py-1 border-b border-gray-400 bg-gray-500 bg-opacity-20">
                    <Typography fontSize="x-small" className="uppercase text-xs">{data.type}</Typography>
            </Box>
            <Box className="px-3 py-1">
                    <Typography variant="h6">{data.label}</Typography>
            </Box>
            <Handle type="target" position={targetPosition?targetPosition:Position.Top}/>
            <Handle type="source" position={sourcePosition?targetPosition:Position.Bottom}/>
        </Box>
    );
}

export function ClaimNode(data: NodeProps) {
    console.log(data)
    data.data.type = "Claim"
    data.data.bgcolor="#FFFFAA"
    return CustomNode(data)
}

export function CompositionNode(data: NodeProps) {
    data.data.type = "Composition"
    data.data.bgcolor="#FFAAFF"
    return CustomNode(data)
}

export function MRNode(data: NodeProps) {
    data.data.type = "Managed Resource"
    data.data.bgcolor="#AAFFFF"
    return CustomNode(data)
}

export function XRNode(data: NodeProps) {
    data.data.type = "Composite Resource"
    data.data.bgcolor="#AAFFAA"
    return CustomNode(data)
}

