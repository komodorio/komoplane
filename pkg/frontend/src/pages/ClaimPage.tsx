import {Alert, Grid, LinearProgress, Paper, Typography} from "@mui/material";
import {Edge, MarkerType, Node} from "reactflow";
import {useParams} from "react-router-dom";
import {ClaimExtended} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";
import ConditionList from "../components/ConditionList.tsx";
import Events from "../components/Events.tsx";
import ReadySynced from "../components/ReadySynced.tsx";
import RelationsGraph from "../components/graph/RelationsGraph.tsx";

export default function ClaimPage() {
    const {group: group, version: version, kind: kind, namespace: namespace, name: name} = useParams();
    const [claim, setClaim] = useState<ClaimExtended | null>(null);
    const [error, setError] = useState<object | null>(null);

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

    const data = graphDataFromClaim(claim);

    return (
        <>
            <div className="mb-4">
                <Typography variant="subtitle2">CLAIM</Typography>
                <Typography variant="h3">{claim.metadata.name} <ReadySynced
                    status={claim.status}></ReadySynced></Typography>
            </div>
            <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={6}>
                    <Paper className="p-4">
                        <Typography variant="h6">Configuration</Typography>
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
        </>
    );
}


function graphDataFromClaim(claim: ClaimExtended): { nodes: Node[], edges: Edge[] } { // FIXME: wrong placement of fn
    const nodes: Node[] = []
    const edges: Edge[] = []
    let id = 0

    nodes.push({
        id: (++id).toString(),
        type: "claim",
        data: {
            label: claim.metadata.name,
        },
        position: {x: 0, y: 0}
    })
    const claimId = id.toString()

    nodes.push({
        id: (++id).toString(),
        type: "composition",
        data: {
            label: claim.composition.metadata.name,
        },
        position: {x: 0, y: 0}
    })
    const compId = id.toString();
    edges.push({
        id: (++id).toString(),
        source: compId,
        target: claimId,
        style: {width: 10},
        markerStart: {type: MarkerType.ArrowClosed}
    })

    nodes.push({
        id: (++id).toString(),
        type: "composed",
        data: {
            label: claim.compositeResource.metadata.name,
        },
        position: {x: 0, y: 0}
    })
    const xrId = id.toString()
    edges.push({
        id: (++id).toString(),
        source: xrId,
        target: claimId,
        markerStart: {type: MarkerType.ArrowClosed}
    })

    claim.managedResources?.map(res => {
        nodes.push({
            id: (++id).toString(),
            type: "managed",
            data: {
                label: res.metadata.name,
            },
            position: {x: 0, y: 0}
        })
        const resId = id.toString()
        edges.push({
            id: (++id).toString(),
            source: resId,
            target: xrId,
            markerStart: {type: MarkerType.ArrowClosed}
        })
    })

    return {
        nodes: nodes,
        edges: edges,
    };
}