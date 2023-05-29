import {ItemList, K8sEvent} from "../types.ts";
import Card from '@mui/material/Card';
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import apiClient from "../api.ts";
import getAge from "../utils.ts";
import {useEffect, useState} from "react";
import {DateTime} from "luxon";

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

type EventsListProps = {
    src: string | undefined;
};

export default function Events({src}: EventsListProps) {
    const [events, setEvents] = useState<ItemList<K8sEvent>>({items: []});
    const [error, setError] = useState<object | undefined>(undefined);

    useEffect(() => {
        apiClient.getProviderEvents(src as string)
            .then((data) => setEvents(data))
            .catch((err) => setError(err))
    }, [src])

    if (error) {
        return (<Typography>Failed getting events: {error.toString()}</Typography>)
    }

    return (
        <Grid container spacing={2}>
            {events?.items?.map((event: K8sEvent) => (
                <EventListItem event={event} key={event.metadata.name}/>
            ))}
        </Grid>
    );
}
