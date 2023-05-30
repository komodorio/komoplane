import Typography from "@mui/material/Typography";
import {Toolbar} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Claim, ItemList} from "../types.ts";
import ClaimsList from "../components/ClaimsList.tsx";
import LinearProgress from '@mui/material/LinearProgress';

const ClaimsPage = () => {
    const [items, setItems] = useState<ItemList<Claim> | null>(null);

    useEffect(() => {
        apiClient.getClaimList()
            .then((data) => setItems(data))
            .catch((error) => console.error(error));
    }, []);

    if (!items) {
        return <LinearProgress/>;
    }

    return (
        <>
            <Toolbar>
                <Typography variant="h5">Claims</Typography>
            </Toolbar>

            <ClaimsList items={items}></ClaimsList>
        </>
    );
};

export default ClaimsPage;
