import {Alert, LinearProgress} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {CompositeResource, ItemList} from "../types.ts";
import CompositeResourcesList from "../components/CompositeResourcesList.tsx";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";

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
            <HeaderBar title="Composite Resources"
                       helpText="Composite resources group multiple managed resources into a single higher-level resource."
                       helpUrl="https://docs.crossplane.io/v2.2/composition/composite-resources/"/>
            <PageBody>
                <CompositeResourcesList items={items}></CompositeResourcesList>
            </PageBody>
        </>
    );
};

export default CompositeResourcesPage;
