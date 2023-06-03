import {Alert, Grid, LinearProgress, Paper, Typography} from "@mui/material";
import {Node, Edge} from "reactflow";
import {useParams} from "react-router-dom";
import {ClaimExtended} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";
import ConditionList from "../components/ConditionList.tsx";
import Events from "../components/Events.tsx";
import ReadySynced from "../components/ReadySynced.tsx";
import RelationsGraph from "../components/RelationsGraph.tsx";

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
                        <RelationsGraph data={data}></RelationsGraph>
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



function graphDataFromClaim(claim: ClaimExtended): {nodes: Node[], edges: Edge[]} { // FIXME: wrong placement of fn
    const nodes: Node[] = []
    const edges: Edge[] = []
    let id=0

    const claimId = nodes.push({
        id: (id++).toString(),
        label: "<b>" + claim.metadata.name + "</b>\n<code>Claim</code>",
    })

    const compId = nodes.push({
        font: {multi: true},
        label: "<b>" + claim.composition.metadata.name + "</b>\n<code>Composition</code>",
        shape: "box",
        color: {background: "#AAFFAA"}
    })[0]
    edges.push({
        from: compId, to: claimId, arrows: {from: {enabled: true}}
    })

    const xrId = nodes.push({
        font: {multi: true},
        label: "<b>" + claim.compositeResource.metadata.name + "</b>\n<code>Composite Resource</code>",
        shape: "box",
        color: {background: "#AAFFFF"}
    })[0]
    edges.push({
        from: xrId, to: claimId, arrows: {from: {enabled: true}}
    })


    claim.managedResources?.map(res => {
        const resId = nodes.push({
            font: {multi: true},
            label: "<b>" + res.metadata.name + "</b>\n<code>Managed Resource</code>",
            shape: "box",
            color: {background: "#FFFFAA"}
        })[0]
        edges.push({
            from: resId,
            to: xrId,
            arrows: {
                from: {enabled: true}
            },
            smooth: {
                enabled: true,
                type: 'cubicBezier', //'', '', '', '', '', 'curvedCW', 'curvedCCW', ''
                roundness: 1
            }
        })
    })

    return {
        nodes: nodes,
        edges: edges,
    };
}