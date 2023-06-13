import React, {useEffect, useState} from "react";
import {AppStatus} from "../types.ts";
import apiClient from "../api.ts";
import {Alert, Link} from "@mui/material";
import LinearProgress from "@mui/material/LinearProgress";

export default function UpgradeNotifier(): React.ReactNode {
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

    if (isNewerVersion(status.CurVer, status.LatestVer)) {
        return (
            <Alert severity="info">
                <Link color="inherit" href="https://github.com/komodorio/komoplane/releases">
                    New version available: {status.LatestVer}
                </Link>
            </Alert>
        );
    }

    return (<></>)
}

function isNewerVersion(oldVer: string, newVer: string) {
    if (oldVer && oldVer[0] === 'v') {
        oldVer = oldVer.substring(1)
    }

    if (newVer && newVer[0] === 'v') {
        newVer = newVer.substring(1)
    }

    const oldParts = oldVer.split(/[.\-]/)
    const newParts = newVer.split(/[.\-]/)

    for (let i = 0; i < newParts.length; i++) {
        const a = ~~newParts[i] // parse int
        const b = ~~oldParts[i] // parse int
        if (a > b) return true
        if (a < b) return false
    }
    return false
}
