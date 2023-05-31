import {Card, CardContent, Grid} from '@mui/material';
import {Composition, ItemList} from "../types.ts";
import Typography from "@mui/material/Typography";

type ItemProps = {
    item: Composition;
};

function ListItem({item}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name}>
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6">Name: {item.metadata.name}</Typography>
                    <Typography variant="h6">Composite Kind: {item.spec.compositeTypeRef.kind}</Typography>
                    <Typography variant="h6">Composite Group: {item.spec.compositeTypeRef.apiVersion}</Typography>
                    <Typography variant="h6">{item.spec.resources.length} resources composed</Typography>
                </CardContent>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<Composition> | undefined;
};

export default function CompositionsList({items}: ItemListProps) {
    return (
        <Grid container spacing={2}>
            {items?.items?.map((item) => (
                <ListItem item={item} key={item.metadata.name}/>
            ))}
        </Grid>
    );
}
