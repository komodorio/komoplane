import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, K8sResource, XRD} from "../types.ts";
import XRDsList from "../components/XRDsList.tsx";
import InfoDrawer from "../components/InfoDrawer.tsx";
import InfoTabs, {ItemContext} from "../components/InfoTabs.tsx";

const XRDsPage = () => {
    const [items, setItems] = useState<ItemList<XRD> | null>(null);
    const [error, setError] = useState<object | null>(null);
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [bridge] = useState<ItemContext>(new ItemContext());


    useEffect(() => {
        apiClient.getXRDsList()
            .then((data) => setItems(data))
            .catch((error) => setError(error));
    }, []);

    if (error) {
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

    if (!items) {
        return <LinearProgress/>;
    }

    const onClose = () => {
        setDrawerOpen(false)
    }

    const onItemClick = (item: K8sResource) => {
        bridge.setCurrent(item)
        setDrawerOpen(true)
        console.log("after set", bridge)
    }

    return (
        <>
            <Toolbar>
                <Typography variant="h5">Composite Resource Definitions (XRDs)</Typography>
            </Toolbar>

            <XRDsList items={items} onItemClick={onItemClick}></XRDsList>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} title="Composite Resource Definition">
                <InfoTabs bridge={bridge}></InfoTabs>
            </InfoDrawer>
        </>
    );
};

export default XRDsPage;
