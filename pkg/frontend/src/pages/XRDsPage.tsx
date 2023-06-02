import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, XRD} from "../types.ts";
import XRDsList from "../components/XRDsList.tsx";

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
            <Toolbar>
                <Typography variant="h5">Composite Resource Definitions (XRDs)</Typography>
            </Toolbar>

            <XRDsList items={items}></XRDsList>
        </>
    );
};

export default XRDsPage;
