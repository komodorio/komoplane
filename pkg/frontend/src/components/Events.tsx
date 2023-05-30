import {ItemList, K8sEvent} from "../types.ts";
import Card from '@mui/material/Card';
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import apiClient from "../api.ts";
import {getAge} from "../utils.ts";
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
                <Grid container justifyContent="space-between">
                    <Grid item>
                        <Typography variant="body1">{event.reason}</Typography>
                        <Typography variant="body1" sx={{ fontStyle: 'oblique' }}>{event.message}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1" className={event.type!="Normal"?"text-amber-700":""}>{event.type}</Typography>
                    </Grid>
                    <Grid item>
                        <Typography variant="body1" className="mb-1">{age} ago</Typography>
                        <Typography variant="body1" className="text-gray-400">x{event.count} over {interval}</Typography>
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
        apiClient.getProviderEvents(src as string)
            .then((data) => setEvents(data))
            .catch((err) => setError(err))
    }, [src])

    if (error) {
        return (<Typography>Failed getting events: {error.toString()}</Typography>)
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
                <EventListItem event={event} key={event.metadata.name}/>
            ))}

        </Grid>
    );
}
