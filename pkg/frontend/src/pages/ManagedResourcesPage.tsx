import {Alert, LinearProgress} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, ManagedResource} from "../types.ts";
import ManagedResourcesList from "../components/ManagedResourcesList.tsx";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";

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
            <HeaderBar title="Managed Resources"/>
            <PageBody>
                <ManagedResourcesList items={items}></ManagedResourcesList>
            </PageBody>
        </>
    );
};

export default ManagedResourcesPage;
