import LaunchIcon from '@mui/icons-material/Launch';
import LogoImage from "./assets/logo.svg";
import {styled} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ManagedIcon from '@mui/icons-material/HubTwoTone';
import ClaimsIcon from '@mui/icons-material/PanToolTwoTone';
import CompositeIcon from '@mui/icons-material/PolylineTwoTone';
import XRDsIcon from '@mui/icons-material/SchemaTwoTone';
import CompositionsIcon from '@mui/icons-material/AccountTreeTwoTone';
import ProvidersIcon from '@mui/icons-material/GridViewTwoTone';
import GHIcon from '@mui/icons-material/GitHub';
import SlackIcon from '@mui/icons-material/SupportTwoTone';
import {BrowserRouter, Link as RouterLink, Route, Routes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import ProvidersPage from "./pages/ProvidersPage.tsx";
import {CssBaseline, Link, ThemeProvider} from "@mui/material";
import ProviderPage from "./pages/ProviderPage.tsx";
import ClaimsPage from "./pages/ClaimsPage.tsx";
import ClaimPage from "./pages/ClaimPage.tsx";
import ManagedResourcesPage from "./pages/ManagedResourcesPage.tsx";
import CompositeResourcesPage from "./pages/CompositeResourcesPage.tsx";
import CompositionsPage from "./pages/CompositionsPage.tsx";
import XRDsPage from "./pages/XRDsPage.tsx";
import {themeDark, themeLight} from "./theme.ts";
import UpgradeNotifier from "./components/UpgradeNotifier.tsx";

const drawerWidth = 260;

const DrawerHeader = styled('div')(({theme}) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'center',
}));

export default function App() {
    const XRDs = <XRDsPage/>
    const compositions = <CompositionsPage/>
    const composite = <CompositeResourcesPage/>
    const managed = <ManagedResourcesPage/>
    return (
        <BrowserRouter>
            <CssBaseline/>
            <Box className={"flex grow"}>
                <ThemeProvider theme={themeDark}>
                    <Drawer
                        sx={{
                            width: drawerWidth,
                            zIndex: 100,
                            backgroundColor: "#061431",
                            '& .MuiDrawer-paper': {
                                width: drawerWidth,
                            },
                        }}
                        hideBackdrop={true}
                        variant="persistent"
                        anchor="left"
                        open={true}
                        PaperProps={{sx: {backgroundColor: "transparent", color: "white"}}}
                    >
                        <Box className="flex flex-col grow justify-between">
                            <Box>
                                <DrawerHeader>
                                    <Box className="flex justify-between flex-row py-3 pb-5">
                                        <img src={LogoImage} style={{height: "2rem"}} alt="KP" className="pt-2 mr-2"/>
                                        <Box className="text-center">
                                            <Link component={RouterLink} to="/" color={"#ffffff"} underline="none">
                                                <Typography variant="h4"
                                                            sx={{letterSpacing: "0.1rem"}}> komoplane</Typography>
                                            </Link>
                                        </Box>
                                    </Box>
                                </DrawerHeader>
                                <Divider/>
                                <List>
                                    <ListItem key="Claims" disablePadding>
                                        <ListItemButton component={RouterLink} to="/claims">
                                            <ListItemIcon>
                                                <ClaimsIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Claims"/>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem key="Composite Resources" disablePadding>
                                        <ListItemButton component={RouterLink} to="/composite">
                                            <ListItemIcon>
                                                <CompositeIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Composite Resources"/>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem key="Managed Resources" disablePadding>
                                        <ListItemButton component={RouterLink} to="/managed">
                                            <ListItemIcon>
                                                <ManagedIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Managed Resources"/>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem key="Providers" disablePadding>
                                        <ListItemButton component={RouterLink} to="/providers">
                                            <ListItemIcon>
                                                <ProvidersIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Providers"/>
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                                <Divider/>
                                <List>
                                    <ListItem key="Compositions" disablePadding>
                                        <ListItemButton component={RouterLink} to="/compositions">
                                            <ListItemIcon>
                                                <CompositionsIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Compositions"/>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem key="XRDs" disablePadding>
                                        <ListItemButton component={RouterLink} to="/xrds">
                                            <ListItemIcon>
                                                <XRDsIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="XRDs"/>
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </Box>
                            <Box className="pt-20">
                                <UpgradeNotifier/>
                                <Box className="flex gap-2 border rounded m-3 p-3">
                                    <Box className="flex flex-col">
                                        <Link href="https://komodor.com/" className="font-bold">
                                            <Box className="flex items-center gap-2">
                                                More Kubernetes tooling by Komodor.com
                                                <LaunchIcon className="w-[14px] h-[14px]"/>
                                            </Box>
                                        </Link>
                                        <Typography variant="body2">
                                            Auth & RBAC, k8s events, troubleshooting and more
                                        </Typography>
                                    </Box>
                                </Box>
                                <List>
                                    <ListItem disablePadding>
                                        <ListItemButton component={Link} href="https://join.slack.com/t/komodorkommunity/shared_invite/zt-1lz4cme86-2zIKTRtTFnzL_UNxaUS9yw">
                                            <ListItemIcon>
                                                <SlackIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Slack Community"/>
                                        </ListItemButton>
                                    </ListItem>
                                    <ListItem disablePadding>
                                        <ListItemButton component={Link} href="https://github.com/komodorio/komoplane">
                                            <ListItemIcon>
                                                <GHIcon/>
                                            </ListItemIcon>
                                            <ListItemText primary="Project Page"/>
                                        </ListItemButton>
                                    </ListItem>
                                </List>
                            </Box>
                        </Box>
                    </Drawer>
                </ThemeProvider>
                <Box className={"bg-gray-50"} sx={{
                    flexGrow: 1,
                    height: "100vh"
                }}>
                    <ThemeProvider theme={themeLight}>
                        <Routes>
                            <Route path="/" element={<Home/>}/>
                            <Route path="/providers" element={<ProvidersPage/>}/>
                            <Route path="/providers/:provider" element={<ProviderPage/>}/>
                            <Route path="/claims" element={<ClaimsPage/>}/>
                            <Route path="/claims/:group/:version/:kind/:namespace/:name" element={<ClaimPage/>}/>
                            <Route path="/managed" element={managed}/>
                            <Route path="/managed/:group/:version/:kind/:name" element={managed}/>
                            <Route path="/composite" element={composite}/>
                            <Route path="/composite/:group/:version/:kind/:name" element={composite}/>
                            <Route path="/compositions" element={compositions}/>
                            <Route path="/compositions/:name" element={compositions}/>
                            <Route path="/xrds" element={XRDs}/>
                            <Route path="/xrds/:name" element={XRDs}/>
                            <Route path="*" element={<Typography>Page not found</Typography>}/>
                        </Routes>
                    </ThemeProvider>
                </Box>
            </Box>
        </BrowserRouter>
    )
        ;
}