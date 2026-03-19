import Typography from "@mui/material/Typography";
import {Box, IconButton, ThemeProvider, Tooltip} from "@mui/material";
import {HelpOutline as HelpIcon} from "@mui/icons-material";
import React from "react";
import {themeDark} from "../theme.ts";

type Props = {
    super?: string
    title: string
    infoPieces?: React.ReactNode
    helpText?: string
    helpUrl?: string
};

export default function HeaderBar(props: Props) {
    return (
        <ThemeProvider theme={themeDark}>
            <Box className="p-5 py-8 mb-4 bg-gray-700" boxShadow={"0px 2px 5px gray"} bgcolor={"#1347ff"}>
                <Typography variant="subtitle2" color="textPrimary" className="uppercase">{props.super}</Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Typography variant="h4" color="textPrimary">{props.title}</Typography>
                    {props.helpUrl && (
                        <Tooltip title={props.helpText || "Learn more"} arrow>
                            <IconButton href={props.helpUrl} target="_blank" size="small"
                                        sx={{color: 'rgba(255,255,255,0.7)', '&:hover': {color: '#fff'}}}>
                                <HelpIcon/>
                            </IconButton>
                        </Tooltip>
                    )}
                </Box>
                {props.helpText && (
                    <Typography variant="body2" color="textSecondary" sx={{mt: 0.5, opacity: 0.8}}>{props.helpText}</Typography>
                )}
                <Box>{props.infoPieces}</Box>
            </Box>
        </ThemeProvider>
    )
}
