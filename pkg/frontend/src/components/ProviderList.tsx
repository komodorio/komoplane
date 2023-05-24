import {Provider, ProviderItems} from "../types.ts";
import {Grid} from "@mui/material";
import Typography from "@mui/material/Typography";
import HealthStatus from "./HealthStatus.tsx";
import {useNavigate} from "react-router-dom";


type ProviderListItemProps = {
    provider: Provider;
};

function ProviderListItem({provider}: ProviderListItemProps) {
    const navigate = useNavigate();
    const handleOnClick = () => {
        navigate(
            provider.metadata.name,
            { state: provider }
        );
    };

    return (
        <Grid item xs={12} md={12} key={provider.metadata.name} onClick={handleOnClick}>
            <div className="p-4 bg-white rounded shadow cursor-pointer">
                <div>
                    <Typography variant="h6">{provider.metadata.name}</Typography>
                    <Typography variant="body1">{provider.spec.package}</Typography>
                </div>
                <HealthStatus status={provider.status}></HealthStatus>
            </div>
        </Grid>
    );
}

type ProviderListProps = {
    providers: ProviderItems | undefined;
};

export default function ProviderList({providers}: ProviderListProps) {
    return (
        <Grid container spacing={2}>
            {providers?.items?.map((provider: Provider) => (
                <ProviderListItem provider={provider} key={provider.metadata.name}/>
            ))}
        </Grid>
    );
}
