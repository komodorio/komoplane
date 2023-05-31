import {Alert, LinearProgress, Toolbar, Typography} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Claim, ItemList} from "../types.ts";
import ClaimsList from "../components/ClaimsList.tsx";


const ClaimsPage = () => {
    const [items, setItems] = useState<ItemList<Claim> | null>(null);
    const [error, setError] = useState<object | null>(null);

    useEffect(() => {
        apiClient.getClaimList()
            .then((data) => setItems(data))
            .catch((error) => setError(error));
    }, []);

    if (error) {
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

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
