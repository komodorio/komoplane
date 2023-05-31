import {Card, CardContent, Grid} from '@mui/material';
import {ItemList, XRD} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";

type ItemProps = {
    item: XRD;
};

function ListItem({item}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name}>
            <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h6">Name: {item.metadata.name}</Typography>
                        <Typography variant="h6">Kind: {item.kind}</Typography>
                        <Typography variant="h6">Group: {item.apiVersion}</Typography>
                        <Typography variant="h6">Composition: {item.spec.names}</Typography>
                        <ReadySynced status={item.status}></ReadySynced>
                    </CardContent>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<XRD> | undefined;
};

export default function XRDsList({items}: ItemListProps) {
    return (
        <Grid container spacing={2}>
            {items?.items?.map((item: XRD) => (
                <ListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
