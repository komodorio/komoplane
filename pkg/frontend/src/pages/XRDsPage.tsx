import {Alert, LinearProgress} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, XRD} from "../types.ts";
import XRDsList from "../components/XRDsList.tsx";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";

const XRDsPage = () => {
    const [items, setItems] = useState<ItemList<XRD> | null>(null);
    const [error, setError] = useState<object | null>(null);


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
            <HeaderBar title="Composite Resource Definitions (XRDs)"/>
            <PageBody>
                <XRDsList items={items}></XRDsList>
            </PageBody>
        </>
    );
};

export default XRDsPage;
