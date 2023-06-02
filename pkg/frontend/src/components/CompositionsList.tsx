import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {Composition, ItemList, K8sResource} from "../types.ts";
import Typography from "@mui/material/Typography";
import {useState} from "react";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import InfoDrawer from "./InfoDrawer.tsx";

type ItemProps = {
    item: Composition;
    onItemClick: { (item: Composition): void }
};

function ListItem({item, onItemClick}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name} onClick={() => {
            onItemClick(item)
        }}>
            <Card variant="outlined">
                <CardActionArea>
                    <CardContent>
                        <Typography variant="h6">Name: {item.metadata.name}</Typography>
                        <Typography variant="h6">Composite Kind: {item.spec.compositeTypeRef.kind}</Typography>
                        <Typography variant="h6">Composite Group: {item.spec.compositeTypeRef.apiVersion}</Typography>
                        <Typography variant="h6">{item.spec.resources.length} resources composed</Typography>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<Composition> | undefined;
};

export default function CompositionsList({items}: ItemListProps) {
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [bridge] = useState<ItemContext>(new ItemContext());

    const onClose = () => {
        setDrawerOpen(false)
    }

    const onItemClick = (item: K8sResource) => {
        bridge.setCurrent(item)
        setDrawerOpen(true)
    }

    return (
        <>
            <Grid container spacing={2}>
                {items?.items?.map((item) => (
                    <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                ))}
            </Grid>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} type="Composition" title={bridge.curItem.metadata.name}>
                <InfoTabs bridge={bridge} noStatus={true} noEvents={true} initial="yaml"></InfoTabs>
            </InfoDrawer>
        </>
    );
}
