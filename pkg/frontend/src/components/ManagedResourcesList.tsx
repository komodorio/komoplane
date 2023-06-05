import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {ItemList, K8sResource, ManagedResource} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";
import InfoDrawer from "./InfoDrawer.tsx";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import {useState} from "react";
import ConditionChips from "./ConditionChips.tsx";

type ItemProps = {
    item: ManagedResource;
    onItemClick: { (item: ManagedResource): void }
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
                        <Typography variant="h6">Kind: {item.kind}</Typography>
                        <Typography variant="h6">Group: {item.apiVersion}</Typography>
                        <Typography variant="h6">Provider Config: {item.spec.providerConfigRef.name}</Typography>
                        <ReadySynced status={item.status}></ReadySynced>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<ManagedResource> | undefined;
};

export default function ManagedResourcesList({items}: ItemListProps) {
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [bridge] = useState<ItemContext>(new ItemContext());

    const onClose = () => {
        setDrawerOpen(false)
    }

    const onItemClick = (item: K8sResource) => {
        bridge.setCurrent(item)
        setDrawerOpen(true)
    }

    const title = (<>
        {bridge.curItem.metadata.name}
        <ConditionChips status={bridge.curItem.status?bridge.curItem.status:{}}></ConditionChips>
    </>)

    return (
        <>
            <Grid container spacing={2}>
                {items?.items?.map((item: ManagedResource) => (
                    <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                ))}
            </Grid>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} type="Composite Resource Definition"
                        title={title}>
                <InfoTabs bridge={bridge} initial="status"></InfoTabs>
            </InfoDrawer>
        </>
    );
}
