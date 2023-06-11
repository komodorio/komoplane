import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {ItemList, K8sResource, XRD} from "../types.ts";
import Typography from "@mui/material/Typography";
import ConditionChips from "./ConditionChips.tsx";
import InfoDrawer from "./InfoDrawer.tsx";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import {useState} from "react";
import {useNavigate, useParams} from "react-router-dom";

type ItemProps = {
    item: XRD;
    onItemClick: { (item: XRD): void }
};

function ListItem({item, onItemClick}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name} onClick={() => {
            onItemClick(item)
        }}>
            <Card variant="outlined" className="cursor-pointer">
                <CardActionArea>
                    <CardContent>
                        <Typography variant="h6">Name: {item.metadata.name}</Typography>
                        <Typography variant="h6">Group: {item.spec.group}</Typography>
                        <Typography
                            variant="h6">Names: {item.spec.names.kind} / {item.spec.claimNames.kind} </Typography>
                        <ConditionChips status={item.status}></ConditionChips>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

type ItemListProps = {
    items: ItemList<XRD> | undefined;
};

export default function XRDsList({items}: ItemListProps) {
    const {name: focusedName} = useParams();
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(focusedName != undefined);
    const [focused, setFocused] = useState<K8sResource>({metadata: {name: ""}, kind: "", apiVersion: ""});
    const navigate = useNavigate();

    const onClose = () => {
        setDrawerOpen(false)
        navigate("/xrds", {state: focused})
    }

    const onItemClick = (item: K8sResource) => {
        setFocused(item)
        setDrawerOpen(true)
        navigate(
            "./" + item.metadata.name,
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

    return (
        <>
            <Grid container spacing={2}>
                {items?.items?.map((item: XRD) => (
                    <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                ))}
            </Grid>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} type="Composite Resource Definition"
                        title={focused.metadata.name}>
                <InfoTabs bridge={bridge} initial="status" noRelations={true}></InfoTabs>
            </InfoDrawer>
        </>
    );
}
