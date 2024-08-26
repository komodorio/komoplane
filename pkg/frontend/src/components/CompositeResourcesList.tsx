import {Box, Alert, Stack, List, Card, CardContent, Grid, Accordion, AccordionSummary, AccordionDetails} from '@mui/material';
import {ExpandMore as ExpandMoreIcon} from '@mui/icons-material';
import {CompositeResource, CompositeResourceExtended, ItemList, K8sReference, K8sResource} from "../types.ts";
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
        <Grid item xs={12} md={12} key={item.apiVersion + item.kind + item.metadata.name} onClick={() => {
            onItemClick(item)
        }}>
            <Card variant="outlined" className="cursor-pointer">
                <CardContent>
                    <Typography variant="h6">{item.metadata.name}</Typography>
                    <Typography variant="body1">Kind: {item.kind}</Typography>
                    <Typography variant="body1">Group: {item.apiVersion}</Typography>
                    <Typography variant="body1">Composition: {item.spec.compositionRef?.name}</Typography>
                    <Typography variant="body1">Composed resources: {item.spec.resourceRefs?.length}</Typography>
                    <ReadySynced status={item.status ? item.status : {}}></ReadySynced>
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
    const nullFocused = {metadata: {name: ""}, kind: "", apiVersion: ""};
    const [focused, setFocused] = useState<K8sResource>(nullFocused);
    const [expandedItems, setExpandedItems] = useState<{[itemIndex: string]: boolean}>({});
    const navigate = useNavigate();

    const onClose = () => {
        setDrawerOpen(false)
        setFocused(nullFocused)
        navigate("/composite")
    }

    const onItemClick = (item: K8sResource) => {
        setFocused(item)
        setDrawerOpen(true)
        navigate(
            "./" + item.apiVersion + "/" + item.kind + "/" + item.metadata.name
        );
    }

    if (focusedName && focused.metadata.name != focusedName) {
        items?.items?.forEach((item) => {
            if (focusedName == item.metadata.name) {
                logger.log("== SET FOCUSED", item)
                setFocused(item)
            }
        })
    }

    const bridge = new ItemContext()
    if (isDrawerOpen) {
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

    // Define Grouped Items
    const groupedItems: { [itemIndex: string]: CompositeResource[] } = {};
    items.items.forEach((item) => {
        const itemIndex = item.kind
        if (!groupedItems[itemIndex]) {
            groupedItems[itemIndex] = [];
        }
        groupedItems[itemIndex].push(item);
    });

    // Accordion State
    const handleAccordionChange = (itemIndex: string) => {
        setExpandedItems((prevState) => ({
            ...prevState,
            [itemIndex]: !prevState[itemIndex],
        }));
    };

    return (
        <>
            {Object.entries(groupedItems).map(([itemIndex, items]) => (    
                <Stack key={itemIndex} className="m-1">
                    <Accordion key={itemIndex} expanded={expandedItems[itemIndex] || false} 
                        onChange={() => handleAccordionChange(itemIndex)}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon/>}>
                        <Stack sx={{mt: 0.5}} direction="row" spacing={1}>
                            <Typography variant="h6">{itemIndex}</Typography>
                                <Box sx={{mx: 0.5}}>
                                    <Alert sx={{py: 0, 
                                            '& > *': {
                                                py: '4px !important',
                                            },}} 
                                        severity="success">
                                        Ready: {items.filter((item) => item.status?.conditions?.find((condition) => 
                                            condition.status === "True" && condition.type === "Ready")).length}
                                    </Alert>
                                </Box>
                                {
                                items.filter((item) => !item.status?.conditions?.find((condition) =>
                                    condition.status === "True" && condition.type === "Ready")).length > 0 ? (
                                    <Box sx={{mx: 0.5}}>
                                        <Alert sx={{py: 0, 
                                                '& > *': {
                                                    py: '4px !important', 
                                                },}} 
                                            severity="error" color="warning">
                                            Not Ready: {items.filter((item) => !item.status?.conditions?.find((condition) =>
                                                condition.status === "True" && condition.type === "Ready")).length}
                                        </Alert>
                                    </Box>
                                    ) : null
                                }
                                {
                                items.filter((item) => !item.status?.conditions?.find((condition) =>
                                    condition.status === "True" && condition.type === "Synced")).length > 0 ? (
                                    <Box sx={{mx: 0.5}}>
                                        <Alert sx={{py: 0, 
                                                '& > *': {
                                                    py: '4px !important', 
                                                },}} 
                                            severity="info" color="info">
                                            Not Synced: {items.filter((item) => !item.status?.conditions?.find((condition) =>
                                                condition.status === "True" && condition.type === "Sync")).length}
                                        </Alert>
                                    </Box>
                                    ) : null
                                }
                        </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {items.map((item: CompositeResource) => (
                                <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                            ))}
                        </List>
                    </AccordionDetails>
                    </Accordion>
                </Stack>
            ))}
            <InfoDrawer key={focused.metadata.name}
                        isOpen={isDrawerOpen} onClose={onClose} type="Composite Resource" title={title}>
                <InfoTabs bridge={bridge} initial="relations"></InfoTabs>
            </InfoDrawer>
        </>
    );
}

function xrToGraph(res: CompositeResourceExtended, navigate: NavigateFunction): GraphData {
    const data = new GraphData()
    const xr = data.addNode(NodeTypes.CompositeResource, res, true, navigate)

    if (res.claim) {
        const claim = data.addNode(NodeTypes.Claim, res.claim, false, navigate);
        data.addEdge(xr, claim)
    }

    if (res.parentXR) {
        const parentXR = data.addNode(NodeTypes.CompositeResource, res.parentXR, false, navigate);
        data.addEdge(xr, parentXR)
    }

    const composition = data.addNode(NodeTypes.Composition, res.composition, false, navigate);
    data.addEdge(composition, xr)

    res.managedResources?.map(resource => {
        let resId;

        if (res.managedResourcesXRs.some(ref => xrMatch(ref, resource))) {
            resId = data.addNode(NodeTypes.CompositeResource, resource, false, navigate);
        } else if (res.managedResourcesClaims.some(ref => claimMatch(ref, resource))) {
            // TODO: possibly never happens?
            resId = data.addNode(NodeTypes.Claim, resource, false, navigate);
        } else {
            resId = data.addNode(NodeTypes.ManagedResource, resource, false, navigate);
        }
        data.addEdge(resId, xr)
    })

    return data
}

function xrMatch(ref: K8sReference, resource: K8sResource) {
    return ref.kind == resource.kind && ref.apiVersion == resource.apiVersion && ref.name == resource.metadata.name
}

function claimMatch(ref: K8sReference, resource: K8sResource) {
    return xrMatch(ref, resource) && ref.namespace == resource.metadata.namespace;
}
