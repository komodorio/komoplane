import {Card, CardContent, Grid} from '@mui/material';
import {ItemList, ManagedResource} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";

type ItemProps = {
    item: ManagedResource;
};

function ListItem({item}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name}>
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6">Name: {item.metadata.name}</Typography>
                    <Typography variant="h6">Kind: {item.kind}</Typography>
                    <Typography variant="h6">Group: {item.apiVersion}</Typography>
                    <Typography variant="h6">Provider Config: {item.spec.providerConfigRef.name}</Typography>
                    <ReadySynced status={item.status}></ReadySynced>
                </CardContent>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<ManagedResource> | undefined;
};

export default function ManagedResourcesList({items}: ItemListProps) {
    return (
        <Grid container spacing={2}>
            {items?.items?.map((item: ManagedResource) => (
                <ListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
