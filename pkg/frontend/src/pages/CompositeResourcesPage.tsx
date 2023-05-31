import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {CompositeResource, ItemList} from "../types.ts";
import CompositeResourcesList from "../components/CompositeResourcesList.tsx";

const CompositeResourcesPage = () => {
    const [items, setItems] = useState<ItemList<CompositeResource> | null>(null);
    const [error, setError] = useState<object | null>(null);

    useEffect(() => {
        apiClient.getCompositeResourcesList()
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
                <Typography variant="h5">Composite Resources</Typography>
            </Toolbar>

            <CompositeResourcesList items={items}></CompositeResourcesList>
        </>
    );
};

export default CompositeResourcesPage;
