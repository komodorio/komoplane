import {Box} from "@mui/material";
import React from "react";

type Props = {
    children?: React.ReactNode
};

export default function PageBody(props: Props) {
    return (
        <Box className="p-5 flex flex-col flex-grow">
            {props.children}
        </Box>
    )
}
