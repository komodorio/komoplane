import {ItemList, ProviderConfig} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import Card from '@mui/material/Card';
import LinearProgress from '@mui/material/LinearProgress';

type ListItemProps = {
    item: ProviderConfig;
};

function EventListItem({item}: ListItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name}>
            <Card variant="outlined" className="p-2">
                <Typography variant="body1">{item.metadata.name}</Typography>
            </Card>
        </Grid>
    );
}

type ListProps = {
    name: string | undefined;
};

export default function ProviderConfigs({name}: ListProps) {
    const [items, setItems] = useState<ItemList<ProviderConfig> | null>(null);
    const [error, setError] = useState<object | undefined>(undefined);

    useEffect(() => {
        apiClient.getProviderConfigs(name as string)
            .then((data) => setItems(data))
            .catch((err) => setError(err))
    }, [name])

    if (error) {
        return (<Typography>Failed getting: {error.toString()}</Typography>)
    }

    if (!items) {
        return <LinearProgress/>;
    }

    if (!items.items.length) {
        return <Typography>None found</Typography>;
    }


    return (
        <Grid container spacing={2}>
            {items?.items?.map((item: ProviderConfig) => (
                <EventListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
