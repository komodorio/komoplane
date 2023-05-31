import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import ProviderList from "../components/ProviderList.tsx";
import {useEffect, useState} from "react";
import {ItemList, Provider} from "../types.ts";

const ProvidersPage = () => {
    const [providers, setProviders] = useState<ItemList<Provider> | null>(null);
    const [error, setError] = useState<object | null>(null);

    useEffect(() => {
        apiClient.getProviderList()
            .then((data) => setProviders(data))
            .catch((error) => setError(error));
    }, []);

    if (error) {
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

    if (!providers) return <LinearProgress/>;

    return (
        <>
            <Toolbar>
                <Typography variant="h5">Providers</Typography>
            </Toolbar>

            <ProviderList providers={providers}></ProviderList>
        </>
    );
};

export default ProvidersPage;
