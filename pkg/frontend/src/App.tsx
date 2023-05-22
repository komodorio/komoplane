import {styled} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar, {AppBarProps as MuiAppBarProps} from '@mui/material/AppBar';
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
import {BrowserRouter, Route, Routes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import Providers from "./pages/Providers.tsx";


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

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({theme, open}) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
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

export default function PersistentDrawerLeft() {
    return (
        <BrowserRouter>
        <Box sx={{display: 'flex'}}>
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
                    <Typography variant="h4" noWrap component="div">
                        komoplane
                    </Typography>
                </DrawerHeader>
                <Divider/>
                <List>
                    <ListItem key="Claims" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <PanTool/>
                            </ListItemIcon>
                            <ListItemText primary="Claims"/>
                        </ListItemButton>
                    </ListItem>
                    <ListItem key="Composite Resources" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <Polyline/>
                            </ListItemIcon>
                            <ListItemText primary="Composite Resources"/>
                        </ListItemButton>
                    </ListItem>
                    <ListItem key="Managed Resources" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <InboxIcon/>
                            </ListItemIcon>
                            <ListItemText primary="Managed Resources"/>
                        </ListItemButton>
                    </ListItem>
                </List>
                <Divider/>
                <List>
                    <ListItem key="Compositions" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <CompositionsIcon/>
                            </ListItemIcon>
                            <ListItemText primary="Compositions"/>
                        </ListItemButton>
                    </ListItem>
                    <ListItem key="XRDs" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <XRDsIcon/>
                            </ListItemIcon>
                            <ListItemText primary="XRDs"/>
                        </ListItemButton>
                    </ListItem>
                    <ListItem key="Providers" disablePadding>
                        <ListItemButton>
                            <ListItemIcon>
                                <ProvidersIcon/>
                            </ListItemIcon>
                            <ListItemText primary="Providers"/>
                        </ListItemButton>
                    </ListItem>
                </List>
            </Drawer>
            <Main open={true} className={"bg-black"}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route
                        path="/providers"
                        element={<Providers />}
                    />
                </Routes>
            </Main>
        </Box>
        </BrowserRouter>
    );
}