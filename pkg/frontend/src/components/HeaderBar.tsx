import Typography from "@mui/material/Typography";
import {Box, ThemeProvider} from "@mui/material";
import React from "react";
import {themeDark} from "../theme.ts";

type Props = {
    super?: string
    title: string
    infoPieces?: React.ReactNode
};

export default function HeaderBar(props: Props) {
    return (
        <ThemeProvider theme={themeDark}>
            <Box className="p-5 py-8 mb-4 bg-gray-700" boxShadow={"0px 2px 5px gray"} bgcolor={"#1347ff"}>
                <Typography variant="subtitle2" color="textPrimary" className="uppercase">{props.super}</Typography>
                <Typography variant="h4" color="textPrimary">{props.title}</Typography>
                <Box>{props.infoPieces}</Box>
            </Box>
        </ThemeProvider>
    )
}
