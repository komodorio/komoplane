import {useEffect, useState} from "react";
import {AppStatus} from "../types.ts";
import apiClient from "../api.ts";
import {Alert, Box, LinearProgress, Link, Modal, Paper, ThemeProvider, Typography} from "@mui/material";
import {themeLight} from "../theme.ts";

export default function AppStatusNotifier() {
    const [status, setEvents] = useState<AppStatus | null>(null);
    const [error, setError] = useState<object | undefined>(undefined);

    useEffect(() => {
        apiClient.getStatus()
            .then((data) => setEvents(data))
            .catch((err) => setError(err))
    }, [])

    if (error) {
        return (
            <Alert severity="error">Failed: {error.toString()}</Alert>
        )
    }

    if (!status) {
        return (<LinearProgress/>);
    }

    const versionStatus = (<Typography variant="body2" sx={{fontSize: "0.75rem"}} className="pl-4 pt-2 text-gray-500">komoplane version: {status.CurVer}</Typography>)

    let upgradeStatus = (<>{versionStatus}</>)
    if (isNewerVersion(status.CurVer, status.LatestVer)) {
        upgradeStatus = (
            <>
                {versionStatus}
                <Alert severity="info">
                    <Link color="inherit" href="https://github.com/komodorio/komoplane/releases">
                        New komoplane version available: {status.LatestVer}
                    </Link>
                </Alert>
            </>
        );
    }

    let crossplaneStatus = (<></>)
    if (!status.CrossplaneInstalled) {
        crossplaneStatus = (
            <ThemeProvider theme={themeLight}>
                <Modal
                    open={true}
                    aria-labelledby="modal-modal-title"
                    aria-describedby="modal-modal-description"
                >
                    <Box className="fixed flex inset-0 items-center justify-center">
                        <Paper className="p-0">
                            <Alert severity="error">
                                <Typography variant="h6">
                                    Crossplane Installation Not Found
                                </Typography>
                                <Typography id="modal-modal-description" sx={{mt: 2}}>
                                    We tried to find some system Crossplane CRDs in the cluster and failed.
                                </Typography>
                                <Typography id="modal-modal-description" sx={{mt: 2}}>
                                    <Link href="https://docs.crossplane.io/latest/software/install/" target="_blank">
                                        Install Crossplane
                                    </Link> in your cluster, then refresh this page.

                                </Typography>
                            </Alert>
                        </Paper>
                    </Box>
                </Modal>
            </ThemeProvider>)
    }

    return (<>
        {upgradeStatus}
        {crossplaneStatus}
    </>)
}

function isNewerVersion(oldVer: string, newVer: string) {
    if (oldVer && oldVer[0] === 'v') {
        oldVer = oldVer.substring(1)
    }

    if (newVer && newVer[0] === 'v') {
        newVer = newVer.substring(1)
    }

    const oldParts = oldVer.split(/[.-]/)
    const newParts = newVer.split(/[.-]/)

    for (let i = 0; i < newParts.length; i++) {
        const a = ~~newParts[i] // parse int
        const b = ~~oldParts[i] // parse int
        if (a > b) return true
        if (a < b) return false
    }
    return false
}
