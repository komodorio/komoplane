import {Card, CardContent, Grid} from '@mui/material';
import {CompositeResource, CompositeResourceExtended, ItemList, K8sResource} from "../types.ts";
import Typography from "@mui/material/Typography";
import ReadySynced from "./ReadySynced.tsx";
import {useState} from "react";
import InfoTabs, {ItemContext} from "./InfoTabs.tsx";
import ConditionChips from "./ConditionChips.tsx";
import InfoDrawer from "./InfoDrawer.tsx";
import {NavigateFunction, useNavigate, useParams} from "react-router-dom";
import {GraphData, NodeTypes} from "./graph/data.ts";
import apiClient from "../api.ts";
import {logger} from "../logger.ts";

type ItemProps = {
    item: CompositeResource;
    onItemClick: { (item: CompositeResource): void }
};

function ListItem({item, onItemClick}: ItemProps) {
    return (
        <Grid item xs={12} md={12} key={item.metadata.name} onClick={() => {
            onItemClick(item)
        }}>
            <Card variant="outlined" className="cursor-pointer">
                <CardContent>
                    <Typography variant="h6">{item.metadata.name}</Typography>
                    <Typography variant="body1">Kind: {item.kind}</Typography>
                    <Typography variant="body1">Group: {item.apiVersion}</Typography>
                    <Typography variant="body1">Composition: {item.spec.compositionRef.name}</Typography>
                    <Typography variant="body1">Composed resources: {item.spec.resourceRefs.length}</Typography>
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
    const {name: focusedName} = useParams();
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(focusedName != undefined);
    const [focused, setFocused] = useState<K8sResource>({metadata: {name: ""}, kind: "", apiVersion: ""});
    const navigate = useNavigate();

    const onClose = () => {
        setDrawerOpen(false)
        navigate("/composite", {state: focused})
    }

    const onItemClick = (item: K8sResource) => {
        setFocused(item)
        setDrawerOpen(true)
        navigate(
            "./" + item.apiVersion + "/" + item.kind + "/" + item.metadata.name,
            {state: item}
        );
    }

    if (!focused.metadata.name && focusedName) {
        items?.items?.forEach((item) => {
            if (focusedName == item.metadata.name) {
                setFocused(item)
            }
        })
    }

    const bridge = new ItemContext()
    bridge.setCurrent(focused)
    bridge.getGraph = (setter, setError) => {
        const setData = (res: CompositeResourceExtended) => {
            logger.log("recv from API", res)
            const data = xrToGraph(res, navigate)
            logger.log("set graph data", data.nodes)
            setter(data)
        }

        const [group, version] = focused.apiVersion.split("/")
        apiClient.getCompositeResource(group, version, focused.kind, focused.metadata.name)
            .then((data) => setData(data))
            .catch((err) => setError(err))
    }

    const title = (<>
        {focused.metadata.name}
        <ConditionChips status={focused.status ? focused.status : {}}></ConditionChips>
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
                <InfoTabs bridge={bridge} initial="status"></InfoTabs>
            </InfoDrawer>
        </>
    );
}

function xrToGraph(res: CompositeResourceExtended, navigate: NavigateFunction): GraphData {
    const data = new GraphData()
    const xr = data.addNode(NodeTypes.CompositeResource, res, true)

    if (res.claim) {
        const claim = data.addNode(NodeTypes.Claim, res.claim, false, () => {
            navigate("/claims/" + res.claim?.metadata.name)
        });
        data.addEdge(xr, claim)
    }

    const composition = data.addNode(NodeTypes.Composition, res.composition, false, () => {
        navigate("/compositions/" + res.composition.metadata.name)
    });
    data.addEdge(composition, xr)

    res.managedResources?.map(res => {
        const resId = data.addNode(NodeTypes.ManagedResource, res, false, () => {
            navigate("/managed/" + res.apiVersion + "/" + res.kind + "/" + res.metadata.name) // FIXME: don't do if resource is missing!
        });
        data.addEdge(resId, xr)
    })

    return data
}

