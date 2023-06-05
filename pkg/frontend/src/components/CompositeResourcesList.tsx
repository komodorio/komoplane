import {Card, CardContent, Grid} from '@mui/material';
import {CompositeResource, ItemList, K8sResource} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";
import {useState} from "react";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import ConditionChips from "./ConditionChips.tsx";
import InfoDrawer from "./InfoDrawer.tsx";

type ItemProps = {
    item: CompositeResource;
    onItemClick: { (item: CompositeResource): void }
};

function ListItem({item, onItemClick}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name} onClick={() => {
            onItemClick(item)
        }}>
            <Card variant="outlined">
                <CardContent>
                    <Typography variant="h6">Name: {item.metadata.name}</Typography>
                    <Typography variant="h6">Kind: {item.kind}</Typography>
                    <Typography variant="h6">Group: {item.apiVersion}</Typography>
                    <Typography variant="h6">Composition: {item.spec.compositionRef.name}</Typography>
                    <Typography variant="h6">Composed resources: {item.spec.resourceRefs.length}</Typography>

                    <ReadySynced status={item.status}></ReadySynced>
                </CardContent>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<CompositeResource> | undefined;
};

export default function CompositeResourcesList({items}: ItemListProps) {
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
                {items?.items?.map((item: CompositeResource) => (
                    <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                ))}
            </Grid>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} type="Composite Resource"
                        title={title}>
                <InfoTabs bridge={bridge} initial="status" noRelations={true}></InfoTabs>
            </InfoDrawer>
        </>

    );
}
