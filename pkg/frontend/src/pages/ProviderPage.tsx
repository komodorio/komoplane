import Typography from "@mui/material/Typography";
import {Grid} from "@mui/material";
import {useParams} from "react-router-dom";
import {Provider} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";
import HealthStatus from "../components/HealthStatus.tsx";
import ConditionList from "../components/ConditionList.tsx";
import Events from "../components/Events.tsx";


const ProviderPage = () => {
    const {provider: providerName} = useParams();
    const [provider, setProvider] = useState<Provider | null>(null);
    const [error, setError] = useState<object | null>(null);

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
            <Typography variant="h3">{provider.metadata.name} <HealthStatus
                status={provider.status}></HealthStatus></Typography>
            <Grid container spacing={2} alignItems="stretch">
                <Grid item xs={12} md={6} >
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Configuration</Typography>
                        <Typography variant="body1">
                            Package: {provider.spec.package}
                        </Typography>
                        {provider.spec.controllerConfigRef ? (
                            <Typography variant="body1">
                                Controller Config: {provider.spec.controllerConfigRef.name}
                            </Typography>
                        ) : (<></>)}
                    </div>
                </Grid>
                <Grid item xs={12} md={6}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Status</Typography>
                        <ConditionList conditions={provider.status.conditions}></ConditionList>
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
                <Grid item xs={12} md={12}>
                    <div className="p-4 bg-white rounded shadow">
                        <Typography variant="h6">Events</Typography>
                        <Events src={"providers/" + provider.metadata.name}></Events>
                    </div>
                </Grid>
            </Grid>
        </>
    );
};

export default ProviderPage;
