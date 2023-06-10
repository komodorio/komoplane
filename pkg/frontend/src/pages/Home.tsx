import Typography from "@mui/material/Typography";
import {Box, Grid} from "@mui/material";
import HomePageBlock from "../components/HomePageBlock.tsx";
import apiClient from "../api.ts";
import {useNavigate} from "react-router-dom";
import ClaimsIcon from '@mui/icons-material/PanToolTwoTone';
import ManagedIcon from '@mui/icons-material/HubTwoTone';
import ProvidersIcon from '@mui/icons-material/GridViewTwoTone';

function Home() {
    const navigate = useNavigate();
    return (
        <>
            <Box className="mb-5">
                <Typography variant="h3">komoplane</Typography>
                <Typography variant="subtitle2">Eases understanding and troubleshooting of your custom control
                    plane.</Typography>
            </Box>
            <Grid container spacing={5} alignItems="stretch">
                <Grid item md={4}>
                    <HomePageBlock title="Claims" getter={apiClient.getClaimList} onClick={() => {
                        navigate("claims")
                    }} icon={<ClaimsIcon fontSize={"large"}/>}/>
                </Grid>
                <Grid item md={4}>
                    <HomePageBlock title="Managed Resources" getter={apiClient.getManagedResourcesList} onClick={() => {
                        navigate("managed")
                    }} icon={<ManagedIcon fontSize={"large"}/>}/>
                </Grid>
                <Grid item md={4}>
                    <HomePageBlock title="Providers" getter={apiClient.getProviderList} onClick={() => {
                        navigate("providers")
                    }} icon={<ProvidersIcon fontSize={"large"}/>}/>
                </Grid>
            </Grid>
        </>
    );
}

export default Home;
