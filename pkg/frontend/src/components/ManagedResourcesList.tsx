import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {ItemList, K8sResource, ManagedResource} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";
import InfoDrawer from "./InfoDrawer.tsx";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import {useState} from "react";
import ConditionChips from "./ConditionChips.tsx";
import {useNavigate, useParams} from "react-router-dom";

type ItemProps = {
    item: ManagedResource;
    onItemClick: { (item: ManagedResource): void }
};

function ListItem({item, onItemClick}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name} onClick={() => {
            onItemClick(item)
        }}>
            <Card variant="outlined" className="cursor-pointer">
                <CardActionArea>
                    <CardContent>
                        <Typography variant="h6">{item.metadata.name}</Typography>
                        <Typography variant="body1">Kind: {item.kind}</Typography>
                        <Typography variant="body1">Group: {item.apiVersion}</Typography>
                        <Typography variant="body1">Provider Config: {item.spec.providerConfigRef.name}</Typography>
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
    const {name: focusedName} = useParams();
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(focusedName != undefined);
    const [focused, setFocused] = useState<K8sResource>({metadata: {name: ""}, kind: "", apiVersion: ""});
    const navigate = useNavigate();

    const onClose = () => {
        setDrawerOpen(false)
        navigate("/managed", {state: focused})
    }

    const onItemClick = (item: K8sResource) => {
        setFocused(item)
        setDrawerOpen(true)
        navigate(
            "./" + item.apiVersion+"/"+item.kind+"/"+item.metadata.name,
            {state: item}
        );
    }

    if (!focused.metadata.name && focusedName) {
        items?.items?.forEach((item) => {
            if (focusedName == item.metadata.name) {
                onItemClick(item)
            }
        })
    }

    const bridge = new ItemContext()
    bridge.setCurrent(focused)

    const title = (<>
        {focused.metadata.name}
        <ConditionChips status={focused.status?focused.status:{}}></ConditionChips>
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
                <InfoTabs bridge={bridge} initial="status" noRelations={true}></InfoTabs>
            </InfoDrawer>
        </>
    );
}
