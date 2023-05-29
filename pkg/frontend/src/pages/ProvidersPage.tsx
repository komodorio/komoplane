import Typography from "@mui/material/Typography";
import {Toolbar} from "@mui/material";
import apiClient from "../api.ts";
import ProviderList from "../components/ProviderList.tsx";
import {useEffect, useState} from "react";
import {ItemList, Provider} from "../types.ts";

const ProvidersPage = () => {
    const [providers , setProviders] = useState<ItemList<Provider> | undefined>(undefined);

    useEffect(() => {
        apiClient.getProviderList()
            .then((data) => setProviders(data))
            .catch((error) => console.error(error));
    }, []);

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
