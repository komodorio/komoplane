import {Alert, Box, Grid, IconButton, LinearProgress, Paper, Typography} from "@mui/material";
import {Edge, MarkerType, Node} from "reactflow";
import {NavigateFunction, useNavigate, useParams} from "react-router-dom";
import {Claim, ClaimExtended, K8sResource} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";
import ConditionList from "../components/ConditionList.tsx";
import Events from "../components/Events.tsx";
import RelationsGraph from "../components/graph/RelationsGraph.tsx";
import {NodeStatus} from "../components/graph/CustomNodes.tsx";
import {EdgeMarkerType} from "@reactflow/core/dist/esm/types/edges";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";
import InfoTabs, {ItemContext} from "../components/InfoTabs.tsx";
import ConditionChips from "../components/ConditionChips.tsx";
import InfoDrawer from "../components/InfoDrawer.tsx";
import {DataObject as YAMLIcon} from '@mui/icons-material';

export default function ClaimPage() {
    const {group: group, version: version, kind: kind, namespace: namespace, name: name} = useParams();
    const [claim, setClaim] = useState<ClaimExtended | null>(null);
    const [error, setError] = useState<object | null>(null);
    const navigate = useNavigate();
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);

    useEffect(() => {
        apiClient.getClaim(group, version, kind, namespace, name)
            .then((data) => setClaim(data))
            .catch((err) => setError(err))
    }, [group, version, kind, namespace, name])

    if (error) {
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

    if (!claim) {
        return (<LinearProgress/>)
    }

    const data = graphDataFromClaim(claim, navigate);

    const onClose = () => {
        setDrawerOpen(false)
    }

    const claimClean: Claim = { ...claim };
    delete claimClean['managedResources']
    delete claimClean['compositeResource']
    delete claimClean['composition']

    const bridge = new ItemContext()
    bridge.setCurrent(claimClean)

    const title = (<>
        {claim.metadata.name}
        <ConditionChips status={claim.status ? claim.status : {}}></ConditionChips>
    </>)

    const onYaml=()=>{
        setDrawerOpen(true)
    }

    return (
        <>
            <HeaderBar title={claim.metadata.name} super="Claim"/>
            <PageBody>
                <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} md={6}>
                        <Paper className="p-4">
                            <Box className="flex justify-between">
                                <Typography variant="h6">Configuration</Typography>
                                <IconButton onClick={onYaml} title="Show YAML">
                                    <YAMLIcon/>
                                </IconButton>
                            </Box>
                            <Typography variant="body1">
                                API Version: {claim.apiVersion}
                            </Typography>
                            <Typography variant="body1">
                                Kind: {claim.kind}
                            </Typography>
                            <Typography variant="body1">
                                Namespace: {claim.metadata.namespace}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper className="p-4">
                            <Typography variant="h6">Status</Typography>
                            <ConditionList conditions={claim.status.conditions}></ConditionList>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Paper className="p-4 flex flex-col" sx={{height: '20rem'}}>
                            <Typography variant="h6">Relations</Typography>
                            <RelationsGraph nodes={data.nodes} edges={data.edges}></RelationsGraph>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Paper className="p-4">
                            <Typography variant="h6">Events</Typography>
                            <Events src={"providers/" + claim.metadata.name}></Events>
                        </Paper>
                    </Grid>
                </Grid>
            </PageBody>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} type="Claim" title={title}>
                <InfoTabs bridge={bridge} initial="yaml" noRelations={true} noEvents={true} noStatus={true}></InfoTabs>
            </InfoDrawer>
        </>
    );
}


function graphDataFromClaim(claim: ClaimExtended, navigate: NavigateFunction): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = []
    const edges: Edge[] = []
    let id = 0

    // TODO: make separate class from this
    function addNode(ntype: string, label: string, status: [NodeStatus, string], isMain?: boolean, onClick?: () => void): Node {
        const node = {
            id: (++id).toString(),
            type: ntype,
            data: {
                label: label,
                status: status[0],
                statusMsg: status[1],
                main: isMain,
                onClick: onClick,
            },
            position: {x: 0, y: 0},
        };
        nodes.push(node)
        return node
    }

    function addEdge(src: Node, tgt: Node): void {
        const edge: Edge = {
            id: (++id).toString(),
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

        edges.push(edge)
    }

    const claimId = addNode("claim", claim.metadata.name, getStatus(claim), true)

    const compId = addNode("composition", claim.composition.metadata.name, getStatus(claim.composition), false, () => {
        navigate("/compositions/" + claim.composition.metadata.name)
    });
    addEdge(compId, claimId)


    const xrId = addNode("composed", claim.compositeResource.metadata.name, getStatus(claim.compositeResource), false, () => {
        navigate("/composite/" + claim.compositeResource.apiVersion + "/" + claim.compositeResource.kind + "/" + claim.compositeResource.metadata.name) // FIXME: don't do if resource is missing!
    });
    addEdge(xrId, claimId)

    claim.managedResources?.map(res => {
        const resId = addNode("managed", res.metadata.name, getStatus(res), false, () => {
            navigate("/managed/" + res.apiVersion + "/" + res.kind + "/" + res.metadata.name) // FIXME: don't do if resource is missing!
        });
        addEdge(resId, xrId)
    })

    return {
        nodes: nodes,
        edges: edges,
    };
}

function getStatus(res: K8sResource): [NodeStatus, string] {
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