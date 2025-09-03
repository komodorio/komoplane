import {ItemList, K8sEvent} from "../types.ts";
import {Alert, Card, Grid, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {getAgeParse} from "../utils.ts";
import {useEffect, useState} from "react";
import LinearProgress from '@mui/material/LinearProgress';

type EventListItemProps = {
    event: K8sEvent;
};

function EventListItem({event}: EventListItemProps) {
    const age = getAgeParse(event.lastTimestamp)
    const interval = getAgeParse(event.lastTimestamp, event.firstTimestamp)
    return (
        <Grid item xs={12} md={12} key={event?.metadata?.name || event?.metadata?.uid || Math.random()}>
            <Card variant="outlined" className="p-2">
                <Grid container justifyContent="space-between">
                    <Grid item>
                        <Typography variant="body1" sx={{fontWeight: 'bold'}}>{event.reason}</Typography>
                        <Typography variant="body1">{event.message}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1"
                                    className={event.type != "Normal" ? "text-amber-700" : ""}>{event.type}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1" className="mb-1">{age} ago</Typography>
                        <Typography variant="body1"
                                    className="text-gray-400">x{event.count} over {interval}</Typography>
                    </Grid>
                </Grid>
            </Card>
        </Grid>
    );
}

type EventsListProps = {
    src: string | undefined;
};

export default function Events({src}: EventsListProps) {
    const [events, setEvents] = useState<ItemList<K8sEvent> | null>(null);
    const [error, setError] = useState<object | undefined>(undefined);

    useEffect(() => {
        apiClient.getEvents(src as string)
            .then((data) => setEvents(data))
            .catch((err) => setError(err))
    }, [src])

    if (error) {
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

    if (!events) {
        return <LinearProgress/>;
    }

    if (!events.items.length) {
        return <Typography>No events found</Typography>;
    }

    return (
        <Grid container spacing={2}>
            {events.items.map((event: K8sEvent) => (
                <EventListItem event={event} key={event?.metadata?.name || event?.metadata?.uid || Math.random()}/>
            ))}

        </Grid>
    );
}
