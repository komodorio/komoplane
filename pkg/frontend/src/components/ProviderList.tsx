import {Card, CardActionArea, CardContent, Grid} from '@mui/material';
import {ItemList, Provider} from "../types.ts";
import Typography from "@mui/material/Typography";
import {useNavigate} from "react-router-dom";
import ConditionChips from "./ConditionChips.tsx";


type ProviderListItemProps = {
    provider: Provider;
};

function ProviderListItem({provider}: ProviderListItemProps) {
    const navigate = useNavigate();
    const handleOnClick = () => {
        navigate(
            provider.metadata.name,
            {state: provider}
        );
    };

    return (
        <Grid item xs={12} md={6} lg={6} xl={4} key={provider.metadata.name} onClick={handleOnClick}>
            <Card variant="outlined" className="cursor-pointer">
                <CardActionArea>
                    <CardContent>
                        <Typography variant="h6">{provider.metadata.name}</Typography>
                        <Typography variant="body1" display="inline">{provider.spec.package}</Typography>
                        <ConditionChips status={provider.status}></ConditionChips>
                    </CardContent>
                </CardActionArea>
            </Card>
        </Grid>
    );
}

type ProviderListProps = {
    providers: ItemList<Provider> | undefined;
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
