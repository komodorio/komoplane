import Typography from "@mui/material/Typography";
import {Toolbar} from "@mui/material";
import apiClient from "../api.ts";
import {useEffect, useState} from "react";
import {Claim, ItemList} from "../types.ts";
import ClaimsList from "../components/ClaimsList.tsx";

const ClaimsPage = () => {
    const [items, setItems] = useState<ItemList<Claim> | undefined>(undefined);

    useEffect(() => {
        apiClient.getClaimList()
            .then((data) => setItems(data))
            .catch((error) => console.error(error));
    }, []);

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
