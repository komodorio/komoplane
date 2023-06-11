import {Alert, LinearProgress} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Claim, ItemList} from "../types.ts";
import ClaimsList from "../components/ClaimsList.tsx";
import HeaderBar from "../components/HeaderBar.tsx";
import PageBody from "../components/PageBody.tsx";


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
            <HeaderBar title="Claims"/>
            <PageBody>
                <ClaimsList items={items}></ClaimsList>
            </PageBody>
        </>
    );
};

export default ClaimsPage;
