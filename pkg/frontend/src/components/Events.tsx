import {K8sEvent} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import { DateTime } from "luxon";


type EventListItemProps = {
    event: K8sEvent;
};

function EventListItem({event}: EventListItemProps) {
    const last=new DateTime(event.lastTimestamp)
    console.log(event.lastTimestamp)
    return (
        <Grid item xs={12} md={12} key={event.metadata.name}>
            <div className="p-4 bg-white rounded shadow">
                <div>
                    <Typography variant="body1">{last.toString()}</Typography>
                    <Typography variant="body1">{event.type}</Typography>
                    <Typography variant="body1">{event.reason}</Typography>
                    <Typography variant="body1">{event.message}</Typography>
                </div>
            </div>
        </Grid>
    );
}

type EventsListProps = {
    src: string | undefined;
};

export default function Events({src}: EventsListProps) {
    const [events, setEvents] = useState<any | undefined>(undefined);
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
