import {Alert, Box, LinearProgress, Paper, Typography} from "@mui/material";

import React, {useEffect, useState} from "react";
import {ItemList, K8sResource} from "../types.ts";

type Props = {
    title: string
    getter: () => Promise<ItemList<K8sResource>>
    onClick: () => void
    icon: React.ReactNode
};

const HomePageBlock = ({title, getter, onClick, icon}: Props) => {
    const [count, setCount] = useState<number | null>(null);
    const [error, setError] = useState<object | null>(null);

    useEffect(() => {
        getter()
            .then((data) => setCount(data.items.length))
            .catch((error) => setError(error));
    }, [getter]);

    if (error) {
        return (<Alert severity="error">Failed: {error.toString()}</Alert>)
    }

    if (count == null) {
        return <LinearProgress/>;
    }

    return (
        <Paper className="p-5 cursor-pointer" onClick={onClick}>
            <Box className="flex justify-between">
                <Box>
                    <Typography variant="h5" className="pb-3 text-gray-400">{icon}</Typography>
                    <Typography variant="h5" className="mb-5">{title}</Typography>
                    <Typography variant="subtitle2"></Typography>
                </Box>
                <Typography variant="h5" className="ml-5 text-gray-400" fontSize={"5rem"}>{count}</Typography>
            </Box>
        </Paper>
    );
};

export default HomePageBlock;
