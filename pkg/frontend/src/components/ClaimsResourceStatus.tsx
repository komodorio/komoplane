import {Claim, ItemList, K8sEvent} from "../types.ts";
import Card from '@mui/material/Card';
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import apiClient from "../api.ts";
import getAge from "../utils.ts";
import {useEffect, useState} from "react";
import {DateTime} from "luxon";
import LinearProgress from '@mui/material/LinearProgress';

type EventListItemProps = {
    event: K8sEvent;
};

function EventListItem({event}: EventListItemProps) {
    const last = DateTime.fromISO(event.lastTimestamp)
    const first = DateTime.fromISO(event.firstTimestamp)
    const age = getAge(DateTime.now(), last)
    const interval = getAge(last, first)
    return (
        <Grid item xs={12} md={12} key={event.metadata.name}>
            <Card variant="outlined" className="p-2">
                <Typography variant="body1">{age} (x{event.count} over {interval})</Typography>
                <Typography variant="body1">{event.type}</Typography>
                <Typography variant="body1">{event.reason}</Typography>
                <Typography variant="body1">{event.message}</Typography>
                <Typography variant="body1"></Typography>
            </Card>
        </Grid>
    );
}

type ComponentProps = {
    claim: Claim;
};

export default function ClaimResourceStatus({claim}: ComponentProps) {
    const [events, setData] = useState<ItemList<K8sEvent> | null>(null);
    const [error, setError] = useState<object | null>(null);

    useEffect(() => {
        apiClient.getClaim(claim)
            .then((data) => setData(data))
            .catch((err) => setError(err))
    }, [claim])

    if (error) {
        return (<Typography>Failed getting events: {error.toString()}</Typography>)
    }

    if (!events) {
        return <LinearProgress/>;
    }

    return (
        <Grid container spacing={2}>
            {events?.items?.map((event: K8sEvent) => (
                <EventListItem event={event} key={event.metadata.name}/>
            ))}
        </Grid>
    );
}
