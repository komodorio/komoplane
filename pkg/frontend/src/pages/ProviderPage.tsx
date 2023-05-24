import Typography from "@mui/material/Typography";
import {Grid} from "@mui/material";
import {useParams} from "react-router-dom";
import {Provider} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";


const ProviderPage = () => {
    const {provider: providerName} = useParams();
    const [provider, setProvider] = useState<Provider | undefined>(undefined);
    const [error, setError] = useState<object | undefined>(undefined);

    useEffect(() => {
        apiClient.getProvider(providerName as string)
            .then((data) => setProvider(data))
            .catch((err) => setError(err))
    }, [providerName])

    if (error) {
        return (<Typography>Provider not found: {error.toString()}</Typography>)
    }

    if (!provider) { // TODO: how to elegantly avoid it?
        return (<></>)
    }

    return (
        <>
            <Typography variant="subtitle2">PROVIDER</Typography>
            <Typography variant="h3">{provider.metadata.name}</Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Info</Typography>
                        <Typography variant="body1">
                            {provider.spec.package}
                            {provider.spec.controllerConfigRef.name}
                        </Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Status</Typography>
                        <Typography variant="body1">Graph content goes here</Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Provider Configs</Typography>
                        <Typography variant="body1">Content for widget 3</Typography>
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Relations</Typography>
                        <Typography variant="body1">Content for widget 4</Typography>
                    </div>
                </Grid>
            </Grid>
        </>
    );
};

export default ProviderPage;
