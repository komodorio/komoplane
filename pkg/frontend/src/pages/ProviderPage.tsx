import {Alert, Grid, LinearProgress, Paper, Typography} from "@mui/material";
import {useParams} from "react-router-dom";
import {Provider} from "../types.ts";
import {useEffect, useState} from "react";
import apiClient from "../api.ts";
import ConditionList from "../components/ConditionList.tsx";
import Events from "../components/Events.tsx";
import ProviderConfigs from "../components/ProviderConfigs.tsx";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";

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
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

    if (!provider) {
        return <LinearProgress/>
    }

    return (
        <>
            <HeaderBar title={provider.metadata.name} super="Provider"/>
            <PageBody>
                <Grid container spacing={2} alignItems="stretch">
                    <Grid item xs={12} md={6}>
                        <Paper className="p-4">
                            <Typography variant="h5">Configuration</Typography>
                            <Typography variant="body1">
                                Package: {provider.spec.package}
                            </Typography>
                            {provider.spec.controllerConfigRef ? (
                                <Typography variant="body1">
                                    Controller Config: {provider.spec.controllerConfigRef.name}
                                </Typography>
                            ) : (<></>)}

                            <Typography variant="h6">Provider Configs</Typography>
                            <ProviderConfigs name={provider.metadata.name}></ProviderConfigs>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Paper className="p-4">
                            <Typography variant="h6">Status</Typography>
                            <ConditionList conditions={provider.status?.conditions}></ConditionList>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={12}>
                        <Paper className="p-4">
                            <Typography variant="h6">Events</Typography>
                            <Events src={"providers/" + provider.metadata.name}></Events>
                        </Paper>
                    </Grid>
                </Grid>
            </PageBody>
        </>
    );
};

export default ProviderPage;
