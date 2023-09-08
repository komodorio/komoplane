import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import {Link as RouterLink, useLocation} from "react-router-dom";
import ListItemIcon from "@mui/material/ListItemIcon";
import ClaimsIcon from "@mui/icons-material/PanToolTwoTone";
import ListItemText from "@mui/material/ListItemText";
import CompositeIcon from "@mui/icons-material/PolylineTwoTone";
import ManagedIcon from "@mui/icons-material/HubTwoTone";
import ProvidersIcon from "@mui/icons-material/GridViewTwoTone";
import Divider from "@mui/material/Divider";
import CompositionsIcon from "@mui/icons-material/AccountTreeTwoTone";
import XRDsIcon from "@mui/icons-material/SchemaTwoTone";

export default function MainMenu() {
    const location = useLocation();

    const isLinkActive = (to: string) => {
        return location.pathname === to;
    };

    const styleHighLight = (path: string) => ({
        ...(isLinkActive(path)) && {
            backgroundColor:"#ffffff14",
            fontWeight: 700,
            borderLeft: 2,
            borderLeftColor: "#1347ff"
        }
    });

    return (<>
        <List>
            <ListItem key="Claims" disablePadding>
                <ListItemButton component={RouterLink} to="/claims" sx={styleHighLight("/claims")}>
                    <ListItemIcon>
                        <ClaimsIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Claims"/>
                </ListItemButton>
            </ListItem>
            <ListItem key="Composite Resources" disablePadding>
                <ListItemButton component={RouterLink} to="/composite" sx={styleHighLight("/composite")}>
                    <ListItemIcon>
                        <CompositeIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Composite Resources"/>
                </ListItemButton>
            </ListItem>
            <ListItem key="Managed Resources" disablePadding>
                <ListItemButton component={RouterLink} to="/managed" sx={styleHighLight("/managed")}>
                    <ListItemIcon>
                        <ManagedIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Managed Resources"/>
                </ListItemButton>
            </ListItem>
            <ListItem key="Providers" disablePadding>
                <ListItemButton component={RouterLink} to="/providers" sx={styleHighLight("/providers")}>
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
                <ListItemButton component={RouterLink} to="/compositions" sx={styleHighLight("/compositions")}>
                    <ListItemIcon>
                        <CompositionsIcon/>
                    </ListItemIcon>
                    <ListItemText primary="Compositions"/>
                </ListItemButton>
            </ListItem>
            <ListItem key="XRDs" disablePadding>
                <ListItemButton component={RouterLink} to="/xrds" sx={styleHighLight("/xrds")}>
                    <ListItemIcon>
                        <XRDsIcon/>
                    </ListItemIcon>
                    <ListItemText primary="XRDs"/>
                </ListItemButton>
            </ListItem>
        </List>
    </>)
}