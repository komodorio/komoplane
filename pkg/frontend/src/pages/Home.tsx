import LogoImage from "../assets/logo_dark_text.svg";
import Typography from "@mui/material/Typography";
import {Box, Grid} from "@mui/material";
import HomePageBlock from "../components/HomePageBlock.tsx";
import apiClient from "../api.ts";
import {useNavigate} from "react-router-dom";
import ClaimsIcon from '@mui/icons-material/PanToolTwoTone';
import ManagedIcon from '@mui/icons-material/HubTwoTone';
import ProvidersIcon from '@mui/icons-material/GridViewTwoTone';
import PageBody from "../components/PageBody.tsx";
import XRDsIcon from "@mui/icons-material/SchemaTwoTone";
import CompositionsIcon from "@mui/icons-material/AccountTreeTwoTone";
import CompositeIcon from "@mui/icons-material/PolylineTwoTone";

function Home() {
    const navigate = useNavigate();
    return (
        <>
            <PageBody>
                <Box className="mb-5">
                    <img src={LogoImage} style={{height: "5rem"}} alt="Komoplane"
                         className="pb-2"/>

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
                        <HomePageBlock title="Composite Resources" getter={apiClient.getCompositeResourcesList} onClick={() => {
                            navigate("composite")
                        }} icon={<CompositeIcon fontSize={"large"}/>}/>
                    </Grid>
                    <Grid item md={4}>
                        <HomePageBlock title="Managed Resources" getter={apiClient.getManagedResourcesList}
                                       onClick={() => {
                                           navigate("managed")
                                       }} icon={<ManagedIcon fontSize={"large"}/>}/>
                    </Grid>
                    <Grid item md={4}>
                        <HomePageBlock title="Providers" getter={apiClient.getProviderList} onClick={() => {
                            navigate("providers")
                        }} icon={<ProvidersIcon fontSize={"large"}/>}/>
                    </Grid>
                    <Grid item md={4}>
                        <HomePageBlock title="Compositions" getter={apiClient.getCompositionsList}
                                       onClick={() => {
                                           navigate("compositions")
                                       }} icon={<CompositionsIcon fontSize={"large"}/>}/>
                    </Grid>
                    <Grid item md={4}>
                        <HomePageBlock title="XRDs" getter={apiClient.getXRDsList} onClick={() => {
                            navigate("xrds")
                        }} icon={<XRDsIcon fontSize={"large"}/>}/>
                    </Grid>
                </Grid>
            </PageBody>
        </>
    );
}

export default Home;
