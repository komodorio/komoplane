import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, ManagedResource} from "../types.ts";
import ManagedResourcesList from "../components/ManagedResourcesList.tsx";

const ManagedResourcesPage = () => {
    const [items, setItems] = useState<ItemList<ManagedResource> | null>(null);
    const [error, setError] = useState<object | null>(null);

    useEffect(() => {
        apiClient.getManagedResourcesList()
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
                <Typography variant="h5">Managed Resources</Typography>
            </Toolbar>

            <ManagedResourcesList items={items}></ManagedResourcesList>
        </>
    );
};

export default ManagedResourcesPage;
