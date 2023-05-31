import LinearProgress from '@mui/material/LinearProgress';
import Typography from "@mui/material/Typography";
import {Grid} from "@mui/material";
import {useParams} from "react-router-dom";
import {ClaimExtended} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";
import {graphDataFromClaim} from "../utils.ts";
import ConditionList from "../components/ConditionList.tsx";
import Events from "../components/Events.tsx";
import Paper from '@mui/material/Paper';
import ReadySynced from "../components/ReadySynced.tsx";
import {RelationsGraph} from "../components/RelationsGraph.tsx";

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
        return (<Typography>Not found: {error.toString()}</Typography>)
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
};


