import Typography from "@mui/material/Typography";
import {Toolbar} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {ItemList, ManagedResource} from "../types.ts";
import LinearProgress from '@mui/material/LinearProgress';
import ManagedResourcesList from "../components/ManagedResourcesList.tsx";

const ManagedResourcesPage = () => {
    const [items, setItems] = useState<ItemList<ManagedResource> | null>(null);

    useEffect(() => {
        apiClient.getManagedResourcesList()
            .then((data) => setItems(data))
            .catch((error) => console.error(error));
    }, []);

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
