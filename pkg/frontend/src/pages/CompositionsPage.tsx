import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Composition, ItemList} from "../types.ts";
import CompositionsList from "../components/CompositionsList.tsx";

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
            <Toolbar>
                <Typography variant="h5">Compositions</Typography>
            </Toolbar>

            <CompositionsList items={items}></CompositionsList>
        </>
    );
};

export default CompositionsPage;
