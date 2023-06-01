import {Alert, Box, LinearProgress, Tab, Tabs, Toolbar, Typography} from "@mui/material";
import { TabPanel } from '@mui/lab';
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, XRD} from "../types.ts";
import XRDsList from "../components/XRDsList.tsx";
import InfoDrawer from "../components/InfoDrawer.tsx";
import InfoTabs from "../components/InfoTabs.tsx";

const XRDsPage = () => {
    const [items, setItems] = useState<ItemList<XRD> | null>(null);
    const [error, setError] = useState<object | null>(null);
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);

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

    return (
        <>
            <Toolbar>
                <Typography variant="h5">Composite Resource Definitions (XRDs)</Typography>
            </Toolbar>

            <XRDsList items={items} onItemClick={() => {
                setDrawerOpen(true)
            }}></XRDsList>
            <InfoDrawer isOpen={isDrawerOpen} onClose={() => {
                setDrawerOpen(false)
            }} title="Composite Resource Definition">
                <InfoTabs></InfoTabs>
            </InfoDrawer>
        </>
    );
};

export default XRDsPage;
