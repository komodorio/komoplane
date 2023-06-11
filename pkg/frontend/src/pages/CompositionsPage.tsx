import {Alert, LinearProgress} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Composition, ItemList} from "../types.ts";
import CompositionsList from "../components/CompositionsList.tsx";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";

const CompositionsPage = () => {
    const [items, setItems] = useState<ItemList<Composition> | null>(null);
    const [error, setError] = useState<object | null>(null);

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
            <HeaderBar title="Compositions"/>
            <PageBody>
                <CompositionsList items={items}></CompositionsList>
            </PageBody>
        </>
    );
};

export default CompositionsPage;
