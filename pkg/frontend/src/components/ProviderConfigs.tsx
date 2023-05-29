import {ItemList, ProviderConfig} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import Card from '@mui/material/Card';

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
    const [items, setItems] = useState<ItemList<ProviderConfig>>({items: []});
    const [error, setError] = useState<object | undefined>(undefined);

    useEffect(() => {
        apiClient.getProviderConfigs(name as string)
            .then((data) => setItems(data))
            .catch((err) => setError(err))
    }, [name])

    if (error) {
        return (<Typography>Failed getting: {error.toString()}</Typography>)
    }

    return (
        <Grid container spacing={2}>
            {items?.items?.map((item: ProviderConfig) => (
                <EventListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
