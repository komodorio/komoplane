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
    if (!item?.metadata?.name) {
        return null; // Don't render items without proper metadata
    }
    
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
                        {item.metadata.namespace && (
                            <Typography variant="body1">Namespace: {item.metadata.namespace}</Typography>
                        )}
                        <Typography variant="body1">Provider Config: {item.spec?.providerConfigRef?.name || "None"}</Typography>
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
    const {group: fGroup, version: fVersion, kind: fKind, namespace: fNamespace, name: fName} = useParams();
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
        
        // Construct URL path properly handling namespaced resources
        const [group, version] = item.apiVersion.split("/")
        let path: string;
        if (item.metadata?.namespace) {
            path = `./${encodeURIComponent(group)}/${encodeURIComponent(version)}/${encodeURIComponent(item.kind)}/${encodeURIComponent(item.metadata.namespace)}/${encodeURIComponent(item.metadata.name || "")}`;
        } else {
            path = `./${encodeURIComponent(group)}/${encodeURIComponent(version)}/${encodeURIComponent(item.kind)}/${encodeURIComponent(item.metadata?.name || "")}`;
        }
        
        navigate(path, {state: item});
    }

    const fApiVersion = fGroup + "/" + fVersion;

    if ((!focused.metadata?.name) && fName && items?.items) {
        items.items.forEach((item) => {
            // Only process items with proper metadata
            if (!item?.metadata?.name) {
                return;
            }
            
            const nameMatches = item.metadata?.name == fName;
            const apiVersionMatches = item.apiVersion == fApiVersion;
            const kindMatches = item.kind == fKind;
            const namespaceMatches = fNamespace ? item.metadata?.namespace == fNamespace : !item.metadata?.namespace;
            
            if (nameMatches && apiVersionMatches && kindMatches && namespaceMatches) {
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

        // Check if focused object and its metadata are properly initialized
        if (!focused || !focused.metadata || !focused.metadata.name || !focused.apiVersion || !focused.kind) {
            setError(new Error("Managed resource information is incomplete"))
            return
        }

        const [group, version] = focused.apiVersion.split("/")
        apiClient.getManagedResource(group, version, focused.kind, focused.metadata?.name || "", focused.metadata?.namespace)
            .then((data) => setData(data))
            .catch((err) => setError(err))
    }

    const title = (<>
        {focused?.metadata?.name || "Unknown Resource"}
        <ConditionChips status={focused?.status ? focused.status : {}}></ConditionChips>
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
                    item?.metadata?.name ? (
                        <ListItem item={item} key={item.metadata.name} onItemClick={onItemClick}/>
                    ) : null
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
    
    // Ensure the main resource has basic required properties
    if (!res || !res.metadata || !res.metadata.name) {
        logger.error("Invalid managed resource data received:", res)
        return data // Return empty graph data
    }
    
    const main = data.addNode(NodeTypes.ManagedResource, res, true, navigate)
    
    if (res.composite && res.composite.metadata && res.composite.metadata.name) {
        const composite = data.addNode(NodeTypes.CompositeResource, res.composite, false, navigate)
        data.addEdge(main, composite)
    }

    if (res.provConfig && res.provConfig.metadata && res.provConfig.metadata.name) {
        const provConfig = data.addNode(NodeTypes.ProviderConfig, res.provConfig, false, navigate)
        data.addEdge(provConfig, main)
    }

    return data
}
