import {styled} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import InboxIcon from '@mui/icons-material/HubTwoTone';
import PanTool from '@mui/icons-material/PanToolTwoTone';
import Polyline from '@mui/icons-material/PolylineTwoTone';
import XRDsIcon from '@mui/icons-material/SchemaTwoTone';
import CompositionsIcon from '@mui/icons-material/AccountTreeTwoTone';
import ProvidersIcon from '@mui/icons-material/GridViewTwoTone';
import {BrowserRouter, Link as RouterLink, Route, Routes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import ProvidersPage from "./pages/ProvidersPage.tsx";
import {Link} from "@mui/material";
import ProviderPage from "./pages/ProviderPage.tsx";
import ClaimsPage from "./pages/ClaimsPage.tsx";
import ClaimPage from "./pages/ClaimPage.tsx";
import ManagedResourcesPage from "./pages/ManagedResourcesPage.tsx";
import CompositeResourcesPage from "./pages/CompositeResourcesPage.tsx";
import CompositionsPage from "./pages/CompositionsPage.tsx";
import XRDsPage from "./pages/XRDsPage.tsx";


const drawerWidth = 260;

const Main = styled('main', {shouldForwardProp: (prop) => prop !== 'open'})<{
    open?: boolean;
}>(({theme, open}) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${drawerWidth}px`,
    ...(open && {
        transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
        marginLeft: 0,
    }),
}));


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
            <Box className={"flex grow"}>
                <CssBaseline/>
                <Drawer
                    sx={{
                        width: drawerWidth,
                        flexShrink: 0,
                        '& .MuiDrawer-paper': {
                            width: drawerWidth,
                            boxSizing: 'border-box',
                        },
                    }}
                    variant="persistent"
                    anchor="left"
                    open={true}
                >
                    <DrawerHeader>
                        <Typography variant="h4" noWrap component="div" className="text-center">
                            <Link component={RouterLink} to="/" style={{letterSpacing: "0.3rem"}}>komoplane</Link>
                            <Typography variant="body2" className={"text-slate-500"}>crossplane tool by
                                Komodor.com</Typography>
                        </Typography>
                    </DrawerHeader>
                    <Divider/>
                    <List>
                        <ListItem key="Claims" disablePadding>
                            <ListItemButton component={RouterLink} to="/claims">
                                <ListItemIcon>
                                    <PanTool/>
                                </ListItemIcon>
                                <ListItemText primary="Claims"/>
                            </ListItemButton>
                        </ListItem>
                        <ListItem key="Composite Resources" disablePadding>
                            <ListItemButton component={RouterLink} to="/composite">
                                <ListItemIcon>
                                    <Polyline/>
                                </ListItemIcon>
                                <ListItemText primary="Composite Resources"/>
                            </ListItemButton>
                        </ListItem>
                        <ListItem key="Managed Resources" disablePadding>
                            <ListItemButton component={RouterLink} to="/managed">
                                <ListItemIcon>
                                    <InboxIcon/>
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
                </Drawer>
                <Main open={true} className={"bg-slate-50"}>
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
                </Main>
            </Box>
        </BrowserRouter>
    );
}