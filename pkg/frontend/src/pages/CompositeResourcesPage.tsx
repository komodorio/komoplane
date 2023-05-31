import Typography from "@mui/material/Typography";
import {Toolbar} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {CompositeResource, ItemList} from "../types.ts";
import LinearProgress from '@mui/material/LinearProgress';
import CompositeResourcesList from "../components/CompositeResourcesList.tsx";

const CompositeResourcesPage = () => {
    const [items, setItems] = useState<ItemList<CompositeResource> | null>(null);

    useEffect(() => {
        apiClient.getCompositeResourcesList()
            .then((data) => setItems(data))
            .catch((error) => console.error(error));
    }, []);

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
