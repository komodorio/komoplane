import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {ItemList, K8sResource, ManagedResource, ManagedResourceExtended} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";
import InfoDrawer from "./InfoDrawer.tsx";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import {useState} from "react";
import ConditionChips from "./ConditionChips.tsx";
import {NavigateFunction, useNavigate, useParams} from "react-router-dom";
import {GraphData, NodeTypes} from "./graph/data.ts";
import {logger} from "../logger.ts";
import apiClient from "../api.ts";

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
                        <Typography variant="body1">Provider Config: {item.spec.providerConfigRef?.name}</Typography>
                        <ReadySynced status={item.status?item.status:{}}></ReadySynced>
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
    const {group: fGroup, version: fVersion, kind: fKind, name: fName} = useParams();
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(fName != undefined);
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
            "./" + item.apiVersion + "/" + item.kind + "/" + item.metadata.name,
            {state: item}
        );
    }

    let fApiVersion = fGroup + "/" + fVersion;

    if (!focused.metadata.name && fName) {
        items?.items?.forEach((item) => {
            if (item.metadata.name == fName && item.apiVersion == fApiVersion && item.kind == fKind) {
                setFocused(item)
            }
        })
    }

    const bridge = new ItemContext()
    bridge.setCurrent(focused)
    bridge.getGraph = (setter, setError) => {
        const setData = (res: ManagedResourceExtended) => {
            logger.log("recv from API", res)
            const data = resToGraph(res, navigate)
            logger.log("set graph data", data.nodes)
            setter(data)
        }

        const [group, version] = focused.apiVersion.split("/")
        apiClient.getManagedResource(group, version, focused.kind, focused.metadata.name)
            .then((data) => setData(data))
            .catch((err) => setError(err))
    }

    const title = (<>
        {focused.metadata.name}
        <ConditionChips status={focused.status ? focused.status : {}}></ConditionChips>
    </>)

    if (!items || !items.items.length) {
        return (
            <Typography variant="h6">No items</Typography>
        )
    }

    return (
        <>
            <Grid container spacing={2}>
                {items?.items?.map((item: ManagedResource) => (
                    <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                ))}
            </Grid>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} type="Managed Resource"
                        title={title}>
                <InfoTabs bridge={bridge} initial="relations"></InfoTabs>
            </InfoDrawer>
        </>
    );
}


function resToGraph(res: ManagedResourceExtended, navigate: NavigateFunction): GraphData {
    const data = new GraphData()
    const main = data.addNode(NodeTypes.ManagedResource, res, true, navigate)
    if (res.composite) {
        const provConfig = data.addNode(NodeTypes.CompositeResource, res.composite, false, navigate)
        data.addEdge(main, provConfig)
    }

    if (res.provConfig) {
        const provConfig = data.addNode(NodeTypes.ProviderConfig, res.provConfig, false, navigate)
        data.addEdge(provConfig, main)
    }

    return data
}
