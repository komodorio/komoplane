import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Composition, ItemList, K8sResource} from "../types.ts";
import CompositionsList from "../components/CompositionsList.tsx";
import InfoTabs, {ItemContext} from "../components/InfoTabs.tsx";
import InfoDrawer from "../components/InfoDrawer.tsx";

const CompositionsPage = () => {
    const [items, setItems] = useState<ItemList<Composition> | null>(null);
    const [error, setError] = useState<object | null>(null);
    const [isDrawerOpen, setDrawerOpen] = useState<boolean>(false);
    const [bridge] = useState<ItemContext>(new ItemContext());

    const onClose = () => {
        setDrawerOpen(false)
    }

    const onItemClick = (item: K8sResource) => {
        bridge.setCurrent(item)
        setDrawerOpen(true)
    }

    useEffect(() => {
        apiClient.getCompositionsList()
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
                <Typography variant="h5">Compositions</Typography>
            </Toolbar>

            <CompositionsList items={items} onItemClick={onItemClick}></CompositionsList>
            <InfoDrawer isOpen={isDrawerOpen} onClose={onClose} title="Composition">
                <InfoTabs bridge={bridge} noStatus={true} noEvents={true}></InfoTabs>
            </InfoDrawer>
        </>
    );
};

export default CompositionsPage;
