import {Card, CardContent, Grid} from '@mui/material';
import {ItemList, XRD} from "../types.ts";
import Typography from "@mui/material/Typography";
import ConditionChips from "./ConditionChips.tsx";

type ItemProps = {
    item: XRD;
};

function ListItem({item}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name}>
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6">Name: {item.metadata.name}</Typography>
                    <Typography variant="h6">Group: {item.spec.group}</Typography>
                    <Typography variant="h6">Names: {item.spec.names.kind} / {item.spec.claimNames.kind} </Typography>
                    <ConditionChips status={item.status}></ConditionChips>
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
